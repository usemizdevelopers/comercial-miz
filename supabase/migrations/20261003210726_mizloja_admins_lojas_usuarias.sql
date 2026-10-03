-- MIZ Loja · Admin Miz, lojas e usuárias (ADM e vendedoras)

-- ---------------------------------------------------------------------------
-- Admin Miz: time da Miz que cria lojas e donas. Independente do app MIZ.
-- ---------------------------------------------------------------------------
create table public.mizloja_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (btrim(nome) <> ''),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.mizloja_admins enable row level security;
comment on table public.mizloja_admins is 'MIZ Loja: usuários do time Miz (Admin Miz).';

create or replace function public.mizloja_eh_admin_miz()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.mizloja_admins a
    where a.id = (select auth.uid()) and a.ativo
  );
$$;
comment on function public.mizloja_eh_admin_miz() is 'MIZ Loja: a pessoa logada é Admin Miz ativa.';

-- ---------------------------------------------------------------------------
-- Lojas
-- ---------------------------------------------------------------------------
create table public.mizloja_lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (btrim(nome) <> ''),
  cnpj text not null unique check (cnpj ~ '^\d{14}$'),
  cidade text not null check (btrim(cidade) <> ''),
  uf char(2) not null check (uf ~ '^[A-Z]{2}$'),
  whatsapp text check (whatsapp ~ '^\d{10,15}$'),
  situacao text not null default 'ativa' check (situacao in ('ativa', 'inativa')),
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.mizloja_lojas enable row level security;
create index mizloja_lojas_criado_por_idx on public.mizloja_lojas (criado_por);
comment on table public.mizloja_lojas is 'MIZ Loja: lojas clientes da Miz.';

-- ---------------------------------------------------------------------------
-- Usuárias (id = auth.users.id)
-- ---------------------------------------------------------------------------
create table public.mizloja_usuarias (
  id uuid primary key references auth.users(id) on delete cascade,
  loja_id uuid not null references public.mizloja_lojas(id) on delete cascade,
  perfil text not null check (perfil in ('adm', 'vendedora')),
  nome text not null check (btrim(nome) <> ''),
  whatsapp text not null check (whatsapp ~ '^55\d{10,11}$'),
  usuario text not null unique check (usuario ~ '^\d{10,15}$'),
  email text,
  precisa_trocar_senha boolean not null default true,
  situacao text not null default 'ativa' check (situacao in ('ativa', 'inativa')),
  ultimo_acesso_em timestamptz,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.mizloja_usuarias enable row level security;
create index mizloja_usuarias_loja_idx on public.mizloja_usuarias (loja_id);
create index mizloja_usuarias_criado_por_idx on public.mizloja_usuarias (criado_por);
comment on table public.mizloja_usuarias is 'MIZ Loja: ADM (dona) e vendedoras. usuario = WhatsApp normalizado (login).';

-- ---------------------------------------------------------------------------
-- Quem é a usuária logada
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_minha_loja()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.loja_id
  from public.mizloja_usuarias u
  join public.mizloja_lojas l on l.id = u.loja_id
  where u.id = (select auth.uid())
    and u.situacao = 'ativa'
    and l.situacao = 'ativa';
$$;
comment on function public.mizloja_minha_loja() is 'MIZ Loja: loja da usuária ativa logada (nulo se não houver ou se a loja estiver inativa).';

create or replace function public.mizloja_meu_perfil()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.perfil
  from public.mizloja_usuarias u
  join public.mizloja_lojas l on l.id = u.loja_id
  where u.id = (select auth.uid())
    and u.situacao = 'ativa'
    and l.situacao = 'ativa';
$$;
comment on function public.mizloja_meu_perfil() is 'MIZ Loja: adm ou vendedora (nulo se não for usuária ativa).';

create or replace function public.mizloja_eh_adm(p_loja uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.mizloja_usuarias u
    join public.mizloja_lojas l on l.id = u.loja_id
    where u.id = (select auth.uid())
      and u.loja_id = p_loja
      and u.perfil = 'adm'
      and u.situacao = 'ativa'
      and l.situacao = 'ativa'
  );
$$;
comment on function public.mizloja_eh_adm(uuid) is 'MIZ Loja: a usuária logada é ADM ativa da loja informada.';

-- ---------------------------------------------------------------------------
-- Gatilhos de proteção
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_tg_lojas_antes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.nome := btrim(new.nome);
  new.cidade := btrim(new.cidade);
  new.cnpj := regexp_replace(coalesce(new.cnpj, ''), '\D', '', 'g');
  new.uf := upper(btrim(new.uf));
  new.whatsapp := public.mizloja_normalizar_whatsapp(new.whatsapp);

  if tg_op = 'INSERT' then
    new.criado_por := coalesce((select auth.uid()), new.criado_por);
  else
    if not public.mizloja_eh_interno() then
      if not public.mizloja_eh_admin_miz()
         and (new.cnpj is distinct from old.cnpj or new.situacao is distinct from old.situacao) then
        raise exception 'Só o time Miz pode alterar o CNPJ ou a situação da loja.' using errcode = '42501';
      end if;
      new.criado_por := old.criado_por;
      new.created_at := old.created_at;
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger mizloja_lojas_antes
before insert or update on public.mizloja_lojas
for each row execute function public.mizloja_tg_lojas_antes();

create or replace function public.mizloja_tg_usuarias_antes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.nome := btrim(new.nome);
  new.whatsapp := public.mizloja_normalizar_whatsapp(new.whatsapp);
  new.email := nullif(lower(btrim(new.email)), '');

  if tg_op = 'INSERT' then
    new.usuario := coalesce(public.mizloja_normalizar_whatsapp(new.usuario), new.whatsapp);
    new.criado_por := coalesce((select auth.uid()), new.criado_por);
  else
    if not public.mizloja_eh_interno() then
      if new.perfil is distinct from old.perfil
         or new.loja_id is distinct from old.loja_id
         or new.usuario is distinct from old.usuario then
        raise exception 'Perfil, loja e usuário de acesso não podem ser alterados aqui.' using errcode = '42501';
      end if;
      if new.id = (select auth.uid()) and old.situacao = 'ativa' and new.situacao = 'inativa' then
        raise exception 'Você não pode desativar o seu próprio acesso.' using errcode = '42501';
      end if;
      new.precisa_trocar_senha := old.precisa_trocar_senha;
      new.ultimo_acesso_em := old.ultimo_acesso_em;
      new.criado_por := old.criado_por;
      new.created_at := old.created_at;
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger mizloja_usuarias_antes
before insert or update on public.mizloja_usuarias
for each row execute function public.mizloja_tg_usuarias_antes();
