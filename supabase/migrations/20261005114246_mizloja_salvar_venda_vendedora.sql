-- MIZ Loja · Lançar venda com vendedora escolhida (ADM fora do modo vendedora).
-- mizloja_salvar_venda_vendedora = mesma lógica de mizloja_salvar_venda, com p_vendedora_id
-- (o gatilho de vendas garante que só a ADM lança em nome de outra pessoa).
-- mizloja_salvar_venda passa a chamar esta com a usuária logada (assinatura e resultado iguais).

create or replace function public.mizloja_salvar_venda_vendedora(
  p_vendedora_id uuid,
  p_venda_id uuid,
  p_cliente_id uuid,
  p_valor_total numeric,
  p_forma_pagamento text,
  p_itens jsonb,
  p_data_venda timestamptz default now(),
  p_cliente_nova jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_loja uuid := mizloja_interno.mizloja_minha_loja();
  v_cliente uuid := p_cliente_id;
  v_vendedora uuid := coalesce(p_vendedora_id, (select auth.uid()));
  v_existente uuid;
  v_whats text;
  v_item jsonb;
begin
  if v_loja is null then
    raise exception 'Seu acesso está desativado.' using errcode = '42501';
  end if;
  if p_venda_id is null then
    raise exception 'Venda sem identificador. Tente de novo.' using errcode = '22023';
  end if;

  select v.cliente_id into v_existente from public.mizloja_vendas v where v.id = p_venda_id;
  if found then
    return jsonb_build_object('venda_id', p_venda_id, 'cliente_id', v_existente, 'ja_existia', true);
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione pelo menos uma peça à venda.' using errcode = '23514';
  end if;

  if p_cliente_nova is not null
     and (v_cliente is null or not exists (select 1 from public.mizloja_clientes c where c.id = v_cliente)) then
    v_whats := public.mizloja_normalizar_whatsapp(p_cliente_nova ->> 'whatsapp');
    select c.id into v_existente from public.mizloja_clientes c where c.loja_id = v_loja and c.whatsapp = v_whats;
    if found then
      v_cliente := v_existente;
    else
      insert into public.mizloja_clientes (id, loja_id, nome, whatsapp, aniv_dia, aniv_mes, aniv_ano, vendedora_id)
      values (
        coalesce(v_cliente, gen_random_uuid()),
        v_loja,
        p_cliente_nova ->> 'nome',
        p_cliente_nova ->> 'whatsapp',
        nullif(p_cliente_nova ->> 'aniv_dia', '')::smallint,
        nullif(p_cliente_nova ->> 'aniv_mes', '')::smallint,
        nullif(p_cliente_nova ->> 'aniv_ano', '')::smallint,
        v_vendedora
      )
      returning id into v_cliente;
    end if;
  end if;

  if v_cliente is null then
    raise exception 'Escolha a cliente.' using errcode = '23514';
  end if;

  begin
    insert into public.mizloja_vendas (id, cliente_id, vendedora_id, data_venda, valor_total, forma_pagamento)
    values (p_venda_id, v_cliente, v_vendedora, coalesce(p_data_venda, now()), p_valor_total, p_forma_pagamento);
  exception when unique_violation then
    if exists (select 1 from public.mizloja_vendas v where v.id = p_venda_id) then
      return jsonb_build_object('venda_id', p_venda_id, 'cliente_id', v_cliente, 'ja_existia', true);
    end if;
    raise;
  end;

  for v_item in select value from jsonb_array_elements(p_itens) loop
    insert into public.mizloja_venda_itens (venda_id, tipo, peca_id, peca_cor_id, cor, cor_hex, tamanho, quantidade)
    values (p_venda_id,
            v_item ->> 'tipo',
            nullif(v_item ->> 'peca_id', '')::uuid,
            nullif(v_item ->> 'peca_cor_id', '')::uuid,
            v_item ->> 'cor',
            v_item ->> 'cor_hex',
            v_item ->> 'tamanho',
            coalesce(nullif(v_item ->> 'quantidade', '')::integer, 1));
  end loop;

  return jsonb_build_object('venda_id', p_venda_id, 'cliente_id', v_cliente, 'ja_existia', false);
end;
$$;
comment on function public.mizloja_salvar_venda_vendedora(uuid, uuid, uuid, numeric, text, jsonb, timestamptz, jsonb) is
  'MIZ Loja: Lançar venda em nome de uma vendedora (só a ADM escolhe outra pessoa). Cliente nova + venda + itens; reenvio não duplica.';

create or replace function public.mizloja_salvar_venda(
  p_venda_id uuid,
  p_cliente_id uuid,
  p_valor_total numeric,
  p_forma_pagamento text,
  p_itens jsonb,
  p_data_venda timestamptz default now(),
  p_cliente_nova jsonb default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select public.mizloja_salvar_venda_vendedora((select auth.uid()), p_venda_id, p_cliente_id, p_valor_total,
                                               p_forma_pagamento, p_itens, p_data_venda, p_cliente_nova);
$$;

revoke all on function public.mizloja_salvar_venda_vendedora(uuid, uuid, uuid, numeric, text, jsonb, timestamptz, jsonb) from public, anon;
grant execute on function public.mizloja_salvar_venda_vendedora(uuid, uuid, uuid, numeric, text, jsonb, timestamptz, jsonb) to authenticated, service_role;
