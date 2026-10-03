-- MIZ Loja · recálculo da cliente, troca de responsável por venda e registro de alterações

-- ---------------------------------------------------------------------------
-- Recalcula os campos de compra da cliente (ignora vendas excluídas)
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_recalcular_cliente(p_cliente_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_n integer;
  v_total numeric(12,2);
  v_primeira timestamptz;
  v_ultima timestamptz;
  v_tamanho text;
  v_cores text[];
  v_pecas jsonb;
begin
  select count(*)::integer, coalesce(sum(v.valor_total), 0), min(v.data_venda), max(v.data_venda)
    into v_n, v_total, v_primeira, v_ultima
  from public.mizloja_vendas v
  where v.cliente_id = p_cliente_id and not v.excluida;

  -- tamanho com maior quantidade; empate: o comprado mais recentemente
  select i.tamanho into v_tamanho
  from public.mizloja_venda_itens i
  join public.mizloja_vendas v on v.id = i.venda_id
  where v.cliente_id = p_cliente_id and not v.excluida
  group by i.tamanho
  order by sum(i.quantidade) desc, max(v.data_venda) desc
  limit 1;

  -- 3 cores com maior quantidade; "OFF-WHITE" e "Off White" contam como a mesma cor
  select coalesce(array_agg(x.nome order by x.qtd desc, x.ultima desc), '{}') into v_cores
  from (
    select (array_agg(initcap(btrim(regexp_replace(replace(i.cor, '-', ' '), '\s+', ' ', 'g')))
                      order by v.data_venda desc))[1] as nome,
           sum(i.quantidade) as qtd,
           max(v.data_venda) as ultima
    from public.mizloja_venda_itens i
    join public.mizloja_vendas v on v.id = i.venda_id
    where v.cliente_id = p_cliente_id and not v.excluida
    group by public.mizloja_sem_acento(replace(i.cor, '-', ' '))
    order by qtd desc, ultima desc
    limit 3
  ) x;

  -- peças Miz compradas
  select coalesce(jsonb_agg(jsonb_build_object('peca_id', x.peca_id, 'nome', x.nome, 'quantidade', x.qtd)
                            order by x.qtd desc, x.nome), '[]'::jsonb) into v_pecas
  from (
    select i.peca_id,
           (array_agg(i.peca_nome order by v.data_venda desc))[1] as nome,
           sum(i.quantidade)::integer as qtd
    from public.mizloja_venda_itens i
    join public.mizloja_vendas v on v.id = i.venda_id
    where v.cliente_id = p_cliente_id and not v.excluida and i.tipo = 'miz' and i.peca_id is not null
    group by i.peca_id
  ) x;

  update public.mizloja_clientes c
     set num_compras = v_n,
         total_gasto = v_total,
         ticket_medio = case when v_n > 0 then round(v_total / v_n, 2) end,
         primeira_compra_em = v_primeira,
         ultima_compra_em = v_ultima,
         intervalo_medio_dias = case
                                  when v_n >= 2
                                  then round((extract(epoch from (v_ultima - v_primeira)) / 86400.0 / (v_n - 1))::numeric, 1)
                                end,
         tamanho_preferido = v_tamanho,
         cores_preferidas = v_cores,
         pecas_miz_compradas = v_pecas
   where c.id = p_cliente_id;
end;
$$;
comment on function public.mizloja_recalcular_cliente(uuid) is 'MIZ Loja: recalcula compras, total, ticket, intervalo, tamanho, cores e peças Miz da cliente.';

-- ---------------------------------------------------------------------------
-- Depois de inserir a venda: troca a responsável se outra vendedora vendeu,
-- limpa etapa manual de novas/em conversa e recalcula a cliente
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_tg_vendas_depois_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_resp uuid;
  v_etapa text;
begin
  select c.vendedora_id, c.etapa_manual into v_resp, v_etapa
  from public.mizloja_clientes c where c.id = new.cliente_id
  for update;

  if v_resp is distinct from new.vendedora_id then
    update public.mizloja_clientes
       set vendedora_id = new.vendedora_id,
           recado_transferencia = null
     where id = new.cliente_id;
    insert into public.mizloja_transferencias (loja_id, cliente_id, de_usuaria_id, para_usuaria_id, motivo, criado_por)
    values (new.loja_id, new.cliente_id, v_resp, new.vendedora_id, 'venda', (select auth.uid()));
  end if;

  if v_etapa in ('novas', 'em_conversa') then
    update public.mizloja_clientes set etapa_manual = null where id = new.cliente_id;
  end if;

  perform public.mizloja_recalcular_cliente(new.cliente_id);
  return null;
end;
$$;

create trigger mizloja_vendas_depois_insert
after insert on public.mizloja_vendas
for each row execute function public.mizloja_tg_vendas_depois_insert();

-- ---------------------------------------------------------------------------
-- Depois de alterar a venda: registra em mizloja_alteracoes e recalcula a cliente
-- (mudanças só de tem_peca_miz/updated_at, feitas pelos gatilhos, não são registradas)
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_tg_vendas_depois_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antes jsonb := to_jsonb(old) - 'updated_at' - 'tem_peca_miz';
  v_depois jsonb := to_jsonb(new) - 'updated_at' - 'tem_peca_miz';
  v_exclusao boolean := new.excluida and not old.excluida;
begin
  if v_antes is distinct from v_depois then
    insert into public.mizloja_alteracoes (loja_id, venda_id, usuaria_id, acao, antes, depois, motivo)
    values (new.loja_id, new.id, (select auth.uid()),
            case when v_exclusao then 'exclusao' else 'edicao' end,
            v_antes, v_depois,
            case when v_exclusao then new.motivo_exclusao end);
  end if;

  if new.cliente_id is distinct from old.cliente_id
     or new.valor_total is distinct from old.valor_total
     or new.data_venda is distinct from old.data_venda
     or new.excluida is distinct from old.excluida then
    perform public.mizloja_recalcular_cliente(new.cliente_id);
    if new.cliente_id is distinct from old.cliente_id then
      perform public.mizloja_recalcular_cliente(old.cliente_id);
    end if;
  end if;
  return null;
end;
$$;

create trigger mizloja_vendas_depois_update
after update on public.mizloja_vendas
for each row execute function public.mizloja_tg_vendas_depois_update();

-- ---------------------------------------------------------------------------
-- Depois de inserir/alterar/excluir item: atualiza tem_peca_miz, recalcula a
-- cliente e, se a venda não foi criada nesta mesma transação, registra a edição
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_tg_venda_itens_depois()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_venda_id uuid := coalesce(new.venda_id, old.venda_id);
  v_venda record;
  v_tem boolean;
begin
  select v.id, v.loja_id, v.cliente_id, v.tem_peca_miz, v.created_at into v_venda
  from public.mizloja_vendas v where v.id = v_venda_id;
  if not found then
    return null; -- venda apagada em cascata
  end if;

  v_tem := exists (select 1 from public.mizloja_venda_itens i where i.venda_id = v_venda_id and i.tipo = 'miz');
  if v_tem is distinct from v_venda.tem_peca_miz then
    update public.mizloja_vendas set tem_peca_miz = v_tem where id = v_venda_id;
  end if;

  if v_venda.created_at <> now() then
    insert into public.mizloja_alteracoes (loja_id, venda_id, usuaria_id, acao, antes, depois)
    values (v_venda.loja_id, v_venda_id, (select auth.uid()), 'edicao',
            case when tg_op <> 'INSERT' then jsonb_build_object('item', to_jsonb(old)) end,
            case when tg_op <> 'DELETE' then jsonb_build_object('item', to_jsonb(new)) end);
  end if;

  perform public.mizloja_recalcular_cliente(v_venda.cliente_id);
  return null;
end;
$$;

create trigger mizloja_venda_itens_depois
after insert or update or delete on public.mizloja_venda_itens
for each row execute function public.mizloja_tg_venda_itens_depois();
