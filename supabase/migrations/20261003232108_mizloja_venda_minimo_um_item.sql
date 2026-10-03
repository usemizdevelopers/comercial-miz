-- MIZ Loja · venda precisa de pelo menos 1 item (especificação, seção 4: "Itens · Sim (mín. 1)")
-- e mensagem clara para tamanho inválido em peça de outra marca.

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
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione pelo menos uma peça à venda.' using errcode = '23514';
  end if;

  insert into public.mizloja_vendas (cliente_id, vendedora_id, data_venda, valor_total, forma_pagamento)
  values (p_cliente_id,
          coalesce(p_vendedora_id, (select auth.uid())),
          coalesce(p_data_venda, now()),
          p_valor_total,
          p_forma_pagamento)
  returning id into v_venda_id;

  for v_item in select value from jsonb_array_elements(p_itens) loop
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
comment on function public.mizloja_lancar_venda(uuid, numeric, text, jsonb, timestamptz, uuid) is 'MIZ Loja: grava venda e itens (mínimo 1) numa transação e devolve o id da venda.';

-- Peça de outra marca: tamanho fora da lista fixa recebe mensagem clara (antes caía na regra técnica)
create or replace function public.mizloja_tg_venda_itens_outra_tamanho()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.tipo = 'outra' and new.tamanho not in ('PP', 'P', 'M', 'G', 'GG', 'Unico') then
    raise exception 'Para peça de outra marca, escolha PP, P, M, G, GG ou Único.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.mizloja_tg_venda_itens_outra_tamanho() from public, anon, authenticated;

-- roda depois de mizloja_venda_itens_antes (ordem alfabética), que já normalizou o tamanho
create trigger mizloja_venda_itens_outra_tamanho
before insert or update on public.mizloja_venda_itens
for each row execute function public.mizloja_tg_venda_itens_outra_tamanho();
