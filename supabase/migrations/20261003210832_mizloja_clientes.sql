-- MIZ Loja · clientes das lojas

create table public.mizloja_clientes (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.mizloja_lojas(id) on delete cascade,
  nome text not null check (btrim(nome) <> ''),
  nome_busca text not null,
  whatsapp text not null check (whatsapp ~ '^55\d{10,11}$'),
  aniv_dia smallint check (aniv_dia between 1 and 31),
  aniv_mes smallint check (aniv_mes between 1 and 12),
  aniv_ano smallint check (aniv_ano between 1900 and 2100),
  observacoes text check (char_length(observacoes) <= 500),
  origem text not null default 'loja' check (origem in ('loja', 'lead_miz')),
  vendedora_id uuid references public.mizloja_usuarias(id) on delete set null,
  cadastrada_por uuid references public.mizloja_usuarias(id) on delete set null,
  etapa_manual text check (etapa_manual in ('novas', 'em_conversa', 'sem_interesse')),
  recado_transferencia text,
  ultimo_contato_em timestamptz,
  ultimo_contato_por uuid references public.mizloja_usuarias(id) on delete set null,
  -- calculados por gatilho (mizloja_recalcular_cliente)
  num_compras integer not null default 0,
  total_gasto numeric(12,2) not null default 0,
  ticket_medio numeric(12,2),
  primeira_compra_em timestamptz,
  ultima_compra_em timestamptz,
  intervalo_medio_dias numeric(6,1),
  tamanho_preferido text,
  cores_preferidas text[] not null default '{}',
  pecas_miz_compradas jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mizloja_clientes_whatsapp_uk unique (loja_id, whatsapp),
  constraint mizloja_clientes_aniv_ck check ((aniv_dia is null) = (aniv_mes is null)),
  constraint mizloja_clientes_aniv_ano_ck check (aniv_ano is null or aniv_dia is not null)
);
alter table public.mizloja_clientes enable row level security;
comment on table public.mizloja_clientes is 'MIZ Loja: clientes de cada loja. Campos de compra são calculados por gatilho.';

create index mizloja_clientes_vendedora_idx on public.mizloja_clientes (loja_id, vendedora_id);
create index mizloja_clientes_ultima_compra_idx on public.mizloja_clientes (loja_id, ultima_compra_em);
create index mizloja_clientes_aniv_idx on public.mizloja_clientes (loja_id, aniv_mes, aniv_dia);
create index mizloja_clientes_nome_busca_trgm_idx on public.mizloja_clientes using gin (nome_busca extensions.gin_trgm_ops);
create index mizloja_clientes_whatsapp_trgm_idx on public.mizloja_clientes using gin (whatsapp extensions.gin_trgm_ops);
create index mizloja_clientes_vendedora_fk_idx on public.mizloja_clientes (vendedora_id);
create index mizloja_clientes_cadastrada_por_idx on public.mizloja_clientes (cadastrada_por);
create index mizloja_clientes_ultimo_contato_por_idx on public.mizloja_clientes (ultimo_contato_por);

create or replace function public.mizloja_tg_clientes_antes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_interno boolean := public.mizloja_eh_interno();
  v_uid uuid := (select auth.uid());
begin
  new.nome := btrim(regexp_replace(coalesce(new.nome, ''), '\s+', ' ', 'g'));
  if new.nome = '' then
    raise exception 'Digite o nome da cliente.' using errcode = '23514';
  end if;
  new.nome_busca := public.mizloja_sem_acento(new.nome);
  new.whatsapp := public.mizloja_normalizar_whatsapp(new.whatsapp);
  if new.whatsapp is null then
    raise exception 'Digite o WhatsApp com DDD.' using errcode = '23514';
  end if;
  new.observacoes := nullif(btrim(new.observacoes), '');
  new.recado_transferencia := nullif(btrim(new.recado_transferencia), '');

  if tg_op = 'INSERT' then
    if not v_interno then
      -- campos calculados sempre começam do zero quando a cliente vem da tela
      new.num_compras := 0;
      new.total_gasto := 0;
      new.ticket_medio := null;
      new.primeira_compra_em := null;
      new.ultima_compra_em := null;
      new.intervalo_medio_dias := null;
      new.tamanho_preferido := null;
      new.cores_preferidas := '{}';
      new.pecas_miz_compradas := '[]';
      new.ultimo_contato_em := null;
      new.ultimo_contato_por := null;
      new.recado_transferencia := null;
      new.cadastrada_por := v_uid;
      if new.vendedora_id is null then
        new.vendedora_id := v_uid;
      elsif new.vendedora_id <> v_uid and not public.mizloja_eh_adm(new.loja_id) then
        raise exception 'Você só pode cadastrar clientes para você.' using errcode = '42501';
      end if;
    end if;
  else
    if new.loja_id is distinct from old.loja_id then
      raise exception 'A loja da cliente não pode ser alterada.' using errcode = '42501';
    end if;
    if not v_interno then
      if new.vendedora_id is distinct from old.vendedora_id then
        raise exception 'Use Transferir para trocar a responsável pela cliente.' using errcode = '42501';
      end if;
      new.num_compras := old.num_compras;
      new.total_gasto := old.total_gasto;
      new.ticket_medio := old.ticket_medio;
      new.primeira_compra_em := old.primeira_compra_em;
      new.ultima_compra_em := old.ultima_compra_em;
      new.intervalo_medio_dias := old.intervalo_medio_dias;
      new.tamanho_preferido := old.tamanho_preferido;
      new.cores_preferidas := old.cores_preferidas;
      new.pecas_miz_compradas := old.pecas_miz_compradas;
      new.ultimo_contato_em := old.ultimo_contato_em;
      new.ultimo_contato_por := old.ultimo_contato_por;
      new.cadastrada_por := old.cadastrada_por;
      new.created_at := old.created_at;
    end if;
    new.updated_at := now();
  end if;

  -- a responsável precisa ser da mesma loja
  if new.vendedora_id is not null
     and (tg_op = 'INSERT' or new.vendedora_id is distinct from old.vendedora_id)
     and not exists (
       select 1 from public.mizloja_usuarias u
       where u.id = new.vendedora_id and u.loja_id = new.loja_id
     ) then
    raise exception 'A vendedora responsável precisa ser desta loja.' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger mizloja_clientes_antes
before insert or update on public.mizloja_clientes
for each row execute function public.mizloja_tg_clientes_antes();
