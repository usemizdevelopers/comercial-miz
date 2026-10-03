-- MIZ Loja · funções usadas pelas páginas

-- ---------------------------------------------------------------------------
-- Lançar venda (etapa 10). Roda como invoker: respeita RLS e gatilhos.
-- p_itens: [{"tipo":"miz","peca_id":"...","peca_cor_id":"...","tamanho":"M","quantidade":1},
--           {"tipo":"outra","cor":"Azul","tamanho":"G","quantidade":2}]
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_lancar_venda(
  p_cliente_id uuid,
  p_valor_total numeric,
  p_forma_pagamento text,
  p_itens jsonb,
  p_data_venda timestamptz default now(),
  p_vendedora_id uuid default auth.uid()
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_venda_id uuid;
  v_item jsonb;
begin
  if p_itens is not null and jsonb_typeof(p_itens) <> 'array' then
    raise exception 'Os itens da venda devem ser uma lista.' using errcode = '22023';
  end if;

  insert into public.mizloja_vendas (cliente_id, vendedora_id, data_venda, valor_total, forma_pagamento)
  values (p_cliente_id,
          coalesce(p_vendedora_id, (select auth.uid())),
          coalesce(p_data_venda, now()),
          p_valor_total,
          p_forma_pagamento)
  returning id into v_venda_id;

  for v_item in select value from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) loop
    insert into public.mizloja_venda_itens (venda_id, tipo, peca_id, peca_cor_id, cor, cor_hex, tamanho, quantidade)
    values (v_venda_id,
            v_item ->> 'tipo',
            nullif(v_item ->> 'peca_id', '')::uuid,
            nullif(v_item ->> 'peca_cor_id', '')::uuid,
            v_item ->> 'cor',
            v_item ->> 'cor_hex',
            v_item ->> 'tamanho',
            coalesce(nullif(v_item ->> 'quantidade', '')::integer, 1));
  end loop;

  return v_venda_id;
end;
$$;
comment on function public.mizloja_lancar_venda(uuid, numeric, text, jsonb, timestamptz, uuid) is 'MIZ Loja: grava venda e itens numa transação e devolve o id da venda.';

-- ---------------------------------------------------------------------------
-- Buscar clientes na base inteira da loja (nome sem acento ou dígitos do WhatsApp)
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_buscar_clientes(p_termo text, p_limite integer default 20)
returns table (
  id uuid,
  nome text,
  whatsapp_final text,
  ultima_compra_em timestamptz,
  num_compras integer,
  vendedora_id uuid,
  vendedora_nome text
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_loja uuid := public.mizloja_minha_loja();
  v_termo text := btrim(coalesce(p_termo, ''));
  v_limite integer := least(greatest(coalesce(p_limite, 20), 1), 50);
  v_digitos text;
  v_busca text;
  v_like text;
begin
  if v_loja is null or char_length(v_termo) < 2 then
    return;
  end if;

  if v_termo ~ '^[0-9()+.\s-]+$' then
    v_digitos := regexp_replace(v_termo, '\D', '', 'g');
    if length(v_digitos) < 2 then
      return;
    end if;
    return query
      select c.id, c.nome, right(c.whatsapp, 4), c.ultima_compra_em, c.num_compras, c.vendedora_id, u.nome
      from public.mizloja_clientes c
      left join public.mizloja_usuarias u on u.id = c.vendedora_id
      where c.loja_id = v_loja
        and c.whatsapp like '%' || v_digitos || '%'
      order by (c.whatsapp like '%' || v_digitos) desc, c.ultima_compra_em desc nulls last, c.nome
      limit v_limite;
  else
    v_busca := public.mizloja_sem_acento(v_termo);
    v_like := replace(replace(replace(v_busca, '\', '\\'), '%', '\%'), '_', '\_');
    return query
      select c.id, c.nome, right(c.whatsapp, 4), c.ultima_compra_em, c.num_compras, c.vendedora_id, u.nome
      from public.mizloja_clientes c
      left join public.mizloja_usuarias u on u.id = c.vendedora_id
      where c.loja_id = v_loja
        and (c.nome_busca like '%' || v_like || '%'
             or extensions.word_similarity(v_busca, c.nome_busca) >= 0.5)
      order by (c.nome_busca like v_like || '%') desc,
               (c.nome_busca like '%' || v_like || '%') desc,
               extensions.word_similarity(v_busca, c.nome_busca) desc,
               c.ultima_compra_em desc nulls last,
               c.nome
      limit v_limite;
  end if;
end;
$$;
comment on function public.mizloja_buscar_clientes(text, integer) is 'MIZ Loja: busca clientes da loja por nome (sem acento) ou dígitos do WhatsApp, a partir de 2 caracteres.';

-- ---------------------------------------------------------------------------
-- Transferir uma cliente para outra usuária da loja
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_transferir_cliente(
  p_cliente_id uuid,
  p_para_usuaria_id uuid,
  p_recado text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_eu record;
  v_cliente record;
begin
  select u.id, u.loja_id, u.perfil into v_eu
  from public.mizloja_usuarias u
  join public.mizloja_lojas l on l.id = u.loja_id
  where u.id = v_uid and u.situacao = 'ativa' and l.situacao = 'ativa';
  if not found then
    raise exception 'Acesso não autorizado.' using errcode = '42501';
  end if;

  select c.id, c.loja_id, c.vendedora_id into v_cliente
  from public.mizloja_clientes c where c.id = p_cliente_id
  for update;
  if not found or v_cliente.loja_id <> v_eu.loja_id then
    raise exception 'Cliente não encontrada.' using errcode = '23503';
  end if;

  if not exists (
    select 1 from public.mizloja_usuarias u
    where u.id = p_para_usuaria_id and u.loja_id = v_eu.loja_id and u.situacao = 'ativa'
  ) then
    raise exception 'Escolha uma vendedora ativa da loja.' using errcode = '23514';
  end if;

  if v_cliente.vendedora_id = p_para_usuaria_id then
    raise exception 'A cliente já é dessa vendedora.' using errcode = '23514';
  end if;

  if v_eu.perfil = 'vendedora' and v_cliente.vendedora_id is not null and v_cliente.vendedora_id <> v_uid then
    raise exception 'Você só pode transferir clientes suas.' using errcode = '42501';
  end if;

  update public.mizloja_clientes
     set vendedora_id = p_para_usuaria_id,
         recado_transferencia = nullif(btrim(p_recado), '')
   where id = p_cliente_id;

  insert into public.mizloja_transferencias (loja_id, cliente_id, de_usuaria_id, para_usuaria_id, motivo, recado, criado_por)
  values (v_eu.loja_id, p_cliente_id, v_cliente.vendedora_id, p_para_usuaria_id,
          case when v_eu.perfil = 'adm' then 'adm' else 'manual' end,
          nullif(btrim(p_recado), ''), v_uid);
end;
$$;
comment on function public.mizloja_transferir_cliente(uuid, uuid, text) is 'MIZ Loja: troca a responsável pela cliente e registra a transferência (manual ou adm).';

-- ---------------------------------------------------------------------------
-- Transferir a carteira inteira de uma usuária para outra (só ADM)
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_transferir_carteira(p_de uuid, p_para uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_loja uuid;
  v_qtd integer;
begin
  select u.loja_id into v_loja from public.mizloja_usuarias u where u.id = p_de;
  if v_loja is null or not public.mizloja_eh_adm(v_loja) then
    raise exception 'Só a ADM da loja pode transferir a carteira.' using errcode = '42501';
  end if;
  if p_de = p_para then
    raise exception 'Escolha outra vendedora para receber as clientes.' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.mizloja_usuarias u
    where u.id = p_para and u.loja_id = v_loja and u.situacao = 'ativa'
  ) then
    raise exception 'Escolha uma vendedora ativa da loja.' using errcode = '23514';
  end if;

  with movidas as (
    update public.mizloja_clientes c
       set vendedora_id = p_para,
           recado_transferencia = null
     where c.loja_id = v_loja and c.vendedora_id = p_de
    returning c.id
  )
  insert into public.mizloja_transferencias (loja_id, cliente_id, de_usuaria_id, para_usuaria_id, motivo, criado_por)
  select v_loja, m.id, p_de, p_para, 'desativacao', v_uid from movidas m;

  get diagnostics v_qtd = row_count;
  return v_qtd;
end;
$$;
comment on function public.mizloja_transferir_carteira(uuid, uuid) is 'MIZ Loja: só ADM. Passa todas as clientes de uma usuária para outra (motivo desativacao). Devolve a quantidade.';

-- ---------------------------------------------------------------------------
-- Acesso e senha
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_registrar_acesso()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.mizloja_usuarias set ultimo_acesso_em = now() where id = (select auth.uid());
end;
$$;
comment on function public.mizloja_registrar_acesso() is 'MIZ Loja: grava o último acesso da usuária logada.';

create or replace function public.mizloja_senha_trocada()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.mizloja_usuarias set precisa_trocar_senha = false where id = (select auth.uid());
end;
$$;
comment on function public.mizloja_senha_trocada() is 'MIZ Loja: marca que a usuária logada já trocou a senha provisória.';
