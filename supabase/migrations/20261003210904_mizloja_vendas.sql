-- MIZ Loja · vendas e itens de venda

create table public.mizloja_vendas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.mizloja_lojas(id) on delete cascade,
  -- NO ACTION (equivale a restrict para exclusão direta, mas permite apagar a loja inteira em cascata)
  cliente_id uuid not null references public.mizloja_clientes(id),
  vendedora_id uuid not null references public.mizloja_usuarias(id),
  lancada_por uuid references auth.users(id) on delete set null,
  data_venda timestamptz not null default now(),
  valor_total numeric(12,2) not null check (valor_total > 0),
  forma_pagamento text not null check (forma_pagamento in ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'crediario')),
  tem_peca_miz boolean not null default false,
  excluida boolean not null default false,
  excluida_em timestamptz,
  excluida_por uuid references auth.users(id) on delete set null,
  motivo_exclusao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mizloja_vendas_exclusao_ck check (not excluida or (motivo_exclusao is not null and btrim(motivo_exclusao) <> ''))
);
alter table public.mizloja_vendas enable row level security;
comment on table public.mizloja_vendas is 'MIZ Loja: vendas. Exclusão é lógica (excluida + motivo).';

create index mizloja_vendas_data_idx on public.mizloja_vendas (loja_id, data_venda);
create index mizloja_vendas_vendedora_data_idx on public.mizloja_vendas (loja_id, vendedora_id, data_venda);
create index mizloja_vendas_cliente_idx on public.mizloja_vendas (cliente_id);
create index mizloja_vendas_vendedora_fk_idx on public.mizloja_vendas (vendedora_id);
create index mizloja_vendas_lancada_por_idx on public.mizloja_vendas (lancada_por);
create index mizloja_vendas_excluida_por_idx on public.mizloja_vendas (excluida_por);

create table public.mizloja_venda_itens (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references public.mizloja_vendas(id) on delete cascade,
  loja_id uuid not null references public.mizloja_lojas(id) on delete cascade,
  tipo text not null check (tipo in ('miz', 'outra')),
  peca_id uuid references public.mizloja_pecas(id) on delete set null,
  peca_cor_id uuid references public.mizloja_peca_cores(id) on delete set null,
  peca_nome text,
  peca_codigo text,
  cor text not null check (btrim(cor) <> ''),
  cor_hex text check (cor_hex ~* '^#[0-9a-f]{6}$'),
  tamanho text not null check (tamanho in ('PP', 'P', 'M', 'G', 'GG', 'PP/P', 'M/G', 'Unico')),
  quantidade integer not null default 1 check (quantidade > 0),
  created_at timestamptz not null default now(),
  -- peça Miz sempre tem a cópia do nome (o peca_id é exigido no lançamento pelo gatilho
  -- e só fica nulo se a peça for apagada do catálogo depois)
  constraint mizloja_venda_itens_miz_ck check (tipo <> 'miz' or peca_nome is not null),
  constraint mizloja_venda_itens_outra_ck check (tipo <> 'outra' or (peca_id is null and peca_cor_id is null))
);
alter table public.mizloja_venda_itens enable row level security;
comment on table public.mizloja_venda_itens is 'MIZ Loja: peças de cada venda, com cópia de nome, código e cor no momento da venda.';

create index mizloja_venda_itens_venda_idx on public.mizloja_venda_itens (venda_id);
create index mizloja_venda_itens_loja_idx on public.mizloja_venda_itens (loja_id);
create index mizloja_venda_itens_peca_idx on public.mizloja_venda_itens (peca_id);
create index mizloja_venda_itens_peca_cor_idx on public.mizloja_venda_itens (peca_cor_id);

-- ---------------------------------------------------------------------------
-- Antes de gravar a venda: regras de quem lança, data e exclusão
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_tg_vendas_antes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_interno boolean := public.mizloja_eh_interno();
  v_uid uuid := (select auth.uid());
  v_loja_cliente uuid;
  v_adm boolean;
begin
  if tg_op = 'INSERT' then
    new.lancada_por := coalesce(v_uid, new.lancada_por);
    if not v_interno then
      new.tem_peca_miz := false;
      new.excluida := false;
      new.excluida_em := null;
      new.excluida_por := null;
      new.motivo_exclusao := null;
      new.created_at := now();
    end if;
  else
    if new.loja_id is distinct from old.loja_id then
      raise exception 'A loja da venda não pode ser alterada.' using errcode = '42501';
    end if;
    new.lancada_por := old.lancada_por;
    if not v_interno then
      new.tem_peca_miz := old.tem_peca_miz;
      new.created_at := old.created_at;
    end if;

    if new.excluida and not old.excluida then
      new.excluida_em := now();
      new.excluida_por := v_uid;
      new.motivo_exclusao := btrim(new.motivo_exclusao);
    elsif old.excluida and not new.excluida then
      if not v_interno and not public.mizloja_eh_adm(old.loja_id) then
        raise exception 'Só a ADM pode restaurar uma venda excluída.' using errcode = '42501';
      end if;
      new.excluida_em := null;
      new.excluida_por := null;
      new.motivo_exclusao := null;
    else
      new.excluida_em := old.excluida_em;
      new.excluida_por := old.excluida_por;
    end if;
    new.updated_at := now();
  end if;

  -- cliente e loja
  if tg_op = 'INSERT' or new.cliente_id is distinct from old.cliente_id then
    select c.loja_id into v_loja_cliente from public.mizloja_clientes c where c.id = new.cliente_id;
    if v_loja_cliente is null then
      raise exception 'Cliente não encontrada.' using errcode = '23503';
    end if;
    if new.loja_id is null then
      new.loja_id := v_loja_cliente;
    elsif new.loja_id <> v_loja_cliente then
      raise exception 'A cliente não é desta loja.' using errcode = '23514';
    end if;
  end if;

  -- vendedora ativa da mesma loja
  if tg_op = 'INSERT' or new.vendedora_id is distinct from old.vendedora_id then
    if not exists (
      select 1 from public.mizloja_usuarias u
      where u.id = new.vendedora_id and u.loja_id = new.loja_id and u.situacao = 'ativa'
    ) then
      raise exception 'Vendedora não encontrada nesta loja.' using errcode = '23503';
    end if;
  end if;

  -- data
  if tg_op = 'INSERT' or new.data_venda is distinct from old.data_venda then
    if new.data_venda > now() + interval '5 minutes' then
      raise exception 'A data da venda não pode ser no futuro.' using errcode = '23514';
    end if;
  end if;

  -- vendedora: só em nome próprio e até 7 dias para trás
  if not v_interno then
    v_adm := public.mizloja_eh_adm(new.loja_id);
    if not v_adm then
      if new.vendedora_id is distinct from v_uid
         or (tg_op = 'UPDATE' and old.vendedora_id is distinct from v_uid) then
        raise exception 'Você só pode lançar vendas no seu nome.' using errcode = '42501';
      end if;
      if (tg_op = 'INSERT' or new.data_venda is distinct from old.data_venda)
         and public.mizloja_data_local(new.data_venda) < public.mizloja_hoje() - 7 then
        raise exception 'A vendedora pode lançar vendas de até 7 dias atrás.' using errcode = '42501';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger mizloja_vendas_antes
before insert or update on public.mizloja_vendas
for each row execute function public.mizloja_tg_vendas_antes();

-- ---------------------------------------------------------------------------
-- Antes de gravar o item: copia loja, valida e copia dados do catálogo
-- (SECURITY DEFINER para ler o catálogo mesmo de peças inativas)
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_tg_venda_itens_antes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_peca record;
  v_cor record;
  v_tam text;
begin
  if tg_op = 'UPDATE' and new.venda_id is distinct from old.venda_id then
    raise exception 'O item não pode mudar de venda.' using errcode = '42501';
  end if;

  select v.loja_id into new.loja_id from public.mizloja_vendas v where v.id = new.venda_id;
  if new.loja_id is null then
    raise exception 'Venda não encontrada.' using errcode = '23503';
  end if;

  -- tamanho: aceita "unico", "Único", "U" etc.
  v_tam := upper(btrim(coalesce(new.tamanho, '')));
  new.tamanho := case when v_tam in ('UNICO', 'ÚNICO', 'U', 'UN', 'TU') then 'Unico' else v_tam end;

  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.created_at := old.created_at;
  end if;

  if new.tipo = 'miz' then
    if tg_op = 'INSERT'
       or new.peca_id is distinct from old.peca_id
       or new.peca_cor_id is distinct from old.peca_cor_id
       or new.tamanho is distinct from old.tamanho
       or new.tipo is distinct from old.tipo then
      if new.peca_id is null then
        raise exception 'Escolha a peça Miz.' using errcode = '23514';
      end if;
      select p.nome, p.codigo_referencia into v_peca from public.mizloja_pecas p where p.id = new.peca_id;
      if not found then
        raise exception 'Peça Miz não encontrada.' using errcode = '23503';
      end if;
      if new.peca_cor_id is null then
        raise exception 'Escolha a cor da peça.' using errcode = '23514';
      end if;
      select c.nome, c.valor into v_cor from public.mizloja_peca_cores c
      where c.id = new.peca_cor_id and c.peca_id = new.peca_id;
      if not found then
        raise exception 'Essa cor não pertence à peça escolhida.' using errcode = '23514';
      end if;
      if exists (select 1 from public.mizloja_peca_tamanhos t where t.peca_id = new.peca_id)
         and not exists (select 1 from public.mizloja_peca_tamanhos t where t.peca_id = new.peca_id and t.valor = new.tamanho) then
        raise exception 'A peça % não tem o tamanho %.', v_peca.nome, new.tamanho using errcode = '23514';
      end if;
      new.peca_nome := v_peca.nome;
      new.peca_codigo := v_peca.codigo_referencia;
      new.cor := v_cor.nome;
      new.cor_hex := case when v_cor.valor ~* '^#[0-9a-f]{6}$' then lower(v_cor.valor) end;
    else
      -- sem mudança de peça/cor/tamanho: mantém as cópias originais
      new.peca_nome := old.peca_nome;
      new.peca_codigo := old.peca_codigo;
      new.cor := old.cor;
      new.cor_hex := old.cor_hex;
    end if;
  else
    new.peca_id := null;
    new.peca_cor_id := null;
    new.peca_nome := null;
    new.peca_codigo := null;
    new.cor := btrim(regexp_replace(coalesce(new.cor, ''), '\s+', ' ', 'g'));
    if new.cor = '' then
      raise exception 'Digite a cor da peça.' using errcode = '23514';
    end if;
    new.cor_hex := case when new.cor_hex ~* '^#[0-9a-f]{6}$' then lower(new.cor_hex) end;
  end if;

  return new;
end;
$$;

create trigger mizloja_venda_itens_antes
before insert or update on public.mizloja_venda_itens
for each row execute function public.mizloja_tg_venda_itens_antes();
