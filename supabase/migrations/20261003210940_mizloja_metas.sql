-- MIZ Loja · metas mensais e prêmios

create table public.mizloja_metas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.mizloja_lojas(id) on delete cascade,
  mes date not null check (extract(day from mes) = 1),
  valor_loja numeric(12,2) not null check (valor_loja > 0),
  status text not null default 'rascunho' check (status in ('rascunho', 'publicada')),
  publicada_em timestamptz,
  premio_descricao text,
  premio_condicao_pct integer not null default 100 check (premio_condicao_pct > 0),
  premio_extra_descricao text,
  premio_extra_pct integer check (premio_extra_pct > 0),
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mizloja_metas_mes_uk unique (loja_id, mes)
);
alter table public.mizloja_metas enable row level security;
create index mizloja_metas_criado_por_idx on public.mizloja_metas (criado_por);
comment on table public.mizloja_metas is 'MIZ Loja: meta da loja por mês (mes = dia 1) e prêmio.';

create table public.mizloja_metas_vendedoras (
  id uuid primary key default gen_random_uuid(),
  meta_id uuid not null references public.mizloja_metas(id) on delete cascade,
  loja_id uuid not null references public.mizloja_lojas(id) on delete cascade,
  usuaria_id uuid not null references public.mizloja_usuarias(id) on delete cascade,
  valor numeric(12,2) check (valor > 0),
  premio_elegivel boolean not null default true,
  constraint mizloja_metas_vendedoras_uk unique (meta_id, usuaria_id)
);
alter table public.mizloja_metas_vendedoras enable row level security;
create index mizloja_metas_vendedoras_loja_idx on public.mizloja_metas_vendedoras (loja_id);
create index mizloja_metas_vendedoras_usuaria_idx on public.mizloja_metas_vendedoras (usuaria_id);
comment on table public.mizloja_metas_vendedoras is 'MIZ Loja: meta individual de cada vendedora (valor nulo = sem meta individual).';

create or replace function public.mizloja_tg_metas_antes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.mes := date_trunc('month', new.mes)::date;
  if tg_op = 'INSERT' then
    new.criado_por := coalesce((select auth.uid()), new.criado_por);
  else
    new.loja_id := old.loja_id;
    new.criado_por := old.criado_por;
    new.created_at := old.created_at;
    new.updated_at := now();
  end if;
  if new.status = 'publicada' and (tg_op = 'INSERT' or old.status <> 'publicada') then
    new.publicada_em := now();
  elsif new.status = 'rascunho' then
    new.publicada_em := null;
  end if;
  return new;
end;
$$;

create trigger mizloja_metas_antes
before insert or update on public.mizloja_metas
for each row execute function public.mizloja_tg_metas_antes();

create or replace function public.mizloja_tg_metas_vendedoras_antes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select m.loja_id into new.loja_id from public.mizloja_metas m where m.id = new.meta_id;
  if new.loja_id is null then
    raise exception 'Meta não encontrada.' using errcode = '23503';
  end if;
  if not exists (
    select 1 from public.mizloja_usuarias u where u.id = new.usuaria_id and u.loja_id = new.loja_id
  ) then
    raise exception 'A vendedora precisa ser desta loja.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger mizloja_metas_vendedoras_antes
before insert or update on public.mizloja_metas_vendedoras
for each row execute function public.mizloja_tg_metas_vendedoras_antes();
