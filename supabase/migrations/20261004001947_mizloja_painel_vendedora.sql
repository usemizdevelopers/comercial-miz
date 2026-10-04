-- MIZ Loja · funções do painel da vendedora (Prompt 3)
-- 1) mizloja_salvar_venda: grava cliente nova (se houver) + venda + itens numa transação, com o id
--    da venda gerado no navegador. Reenviar a mesma venda (fila sem conexão) não duplica.
-- 2) mizloja_meu_resumo_mes / mizloja_meu_historico_metas: meta, vendido e prêmio da usuária logada.
-- 3) mizloja_minhas_vendas_hoje: total do dia e as 3 últimas vendas.
-- 4) mizloja_cores_usadas: sugestões de cor para peça de outra marca.
-- 5) mizloja_ranking_mes: posição e nomes (sem valores), só quando a ADM liga o ranking.
-- Todas security invoker: o RLS continua valendo.

-- O navegador escolhe o id da cliente nova e da venda (necessário para a fila sem conexão).
grant insert (id) on public.mizloja_clientes to authenticated;
grant insert (id) on public.mizloja_vendas to authenticated;

-- ---------------------------------------------------------------------------
-- 1) Salvar venda (idempotente)
-- ---------------------------------------------------------------------------
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
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_loja uuid := mizloja_interno.mizloja_minha_loja();
  v_cliente uuid := p_cliente_id;
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

  -- mesma venda enviada de novo: devolve a que já existe
  select v.cliente_id into v_existente from public.mizloja_vendas v where v.id = p_venda_id;
  if found then
    return jsonb_build_object('venda_id', p_venda_id, 'cliente_id', v_existente, 'ja_existia', true);
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione pelo menos uma peça à venda.' using errcode = '23514';
  end if;

  -- cliente nova: cria (ou, se o WhatsApp já existe na loja, usa a cliente que já existe)
  if p_cliente_nova is not null
     and (v_cliente is null or not exists (select 1 from public.mizloja_clientes c where c.id = v_cliente)) then
    v_whats := public.mizloja_normalizar_whatsapp(p_cliente_nova ->> 'whatsapp');
    select c.id into v_existente from public.mizloja_clientes c where c.loja_id = v_loja and c.whatsapp = v_whats;
    if found then
      v_cliente := v_existente;
    else
      insert into public.mizloja_clientes (id, loja_id, nome, whatsapp, aniv_dia, aniv_mes, aniv_ano)
      values (
        coalesce(v_cliente, gen_random_uuid()),
        v_loja,
        p_cliente_nova ->> 'nome',
        p_cliente_nova ->> 'whatsapp',
        nullif(p_cliente_nova ->> 'aniv_dia', '')::smallint,
        nullif(p_cliente_nova ->> 'aniv_mes', '')::smallint,
        nullif(p_cliente_nova ->> 'aniv_ano', '')::smallint
      )
      returning id into v_cliente;
    end if;
  end if;

  if v_cliente is null then
    raise exception 'Escolha a cliente.' using errcode = '23514';
  end if;

  begin
    insert into public.mizloja_vendas (id, cliente_id, vendedora_id, data_venda, valor_total, forma_pagamento)
    values (p_venda_id, v_cliente, (select auth.uid()), coalesce(p_data_venda, now()), p_valor_total, p_forma_pagamento);
  exception when unique_violation then
    -- duas tentativas ao mesmo tempo: a outra já gravou
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
comment on function public.mizloja_salvar_venda(uuid, uuid, numeric, text, jsonb, timestamptz, jsonb) is
  'MIZ Loja: Lançar venda. Cria a cliente nova (opcional), a venda (id vindo do navegador) e os itens. Reenvio não duplica.';

-- ---------------------------------------------------------------------------
-- 2) Resumo do mês da usuária logada
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_meu_resumo_mes(p_mes date default null)
returns table (
  mes date,
  meta_individual numeric,
  meta_loja numeric,
  vendido_loja numeric,
  vendido numeric,
  num_vendas integer,
  ticket_medio numeric,
  clientes_novas integer,
  dias_restantes integer,
  valor_por_dia numeric,
  premio_descricao text,
  premio_condicao_pct integer,
  premio_extra_descricao text,
  premio_extra_pct integer,
  premio_conquistado boolean,
  premio_extra_conquistado boolean
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := (select auth.uid());
  v_loja uuid := mizloja_interno.mizloja_minha_loja();
  v_hoje date := public.mizloja_hoje();
  v_mes date;
  v_ini timestamptz;
  v_fim timestamptz;
  v_meta public.mizloja_metas%rowtype;
  v_tem_meta boolean := false;
  v_ind numeric;
  v_eleg boolean;
  v_vendido numeric := 0;
  v_num integer := 0;
  v_novas integer := 0;
  v_loja_vendido numeric;
  v_dias integer;
  v_premio boolean;
begin
  if v_loja is null or v_uid is null then
    return;
  end if;

  v_mes := date_trunc('month', coalesce(p_mes, v_hoje))::date;
  v_ini := v_mes::timestamp at time zone 'America/Sao_Paulo';
  v_fim := (v_mes + interval '1 month')::date::timestamp at time zone 'America/Sao_Paulo';

  select m.* into v_meta from public.mizloja_metas m
   where m.loja_id = v_loja and m.mes = v_mes and m.status = 'publicada';
  v_tem_meta := found;
  if v_tem_meta then
    select mv.valor, mv.premio_elegivel into v_ind, v_eleg
      from public.mizloja_metas_vendedoras mv
     where mv.meta_id = v_meta.id and mv.usuaria_id = v_uid;
  end if;

  select coalesce(sum(v.valor_total), 0), count(*)::integer into v_vendido, v_num
    from public.mizloja_vendas v
   where v.loja_id = v_loja and v.vendedora_id = v_uid and not v.excluida
     and v.data_venda >= v_ini and v.data_venda < v_fim;

  -- clientes novas: a 1ª compra (não excluída) da cliente foi neste mês e foi com ela
  select count(*)::integer into v_novas
    from (
      select distinct on (v.cliente_id) v.cliente_id, v.vendedora_id, v.data_venda
        from public.mizloja_vendas v
       where v.loja_id = v_loja and not v.excluida
         and v.cliente_id in (
           select v2.cliente_id from public.mizloja_vendas v2
            where v2.loja_id = v_loja and v2.vendedora_id = v_uid and not v2.excluida
              and v2.data_venda >= v_ini and v2.data_venda < v_fim)
       order by v.cliente_id, v.data_venda, v.created_at
    ) primeira
   where primeira.vendedora_id = v_uid and primeira.data_venda >= v_ini and primeira.data_venda < v_fim;

  -- meta da loja só aparece quando não há meta individual
  if v_tem_meta and v_ind is null then
    select coalesce(sum(v.valor_total), 0) into v_loja_vendido
      from public.mizloja_vendas v
     where v.loja_id = v_loja and not v.excluida and v.data_venda >= v_ini and v.data_venda < v_fim;
  end if;

  -- dias restantes contam hoje
  v_dias := case
              when v_mes = date_trunc('month', v_hoje)::date then ((v_mes + interval '1 month')::date - v_hoje)
              when v_mes > v_hoje then ((v_mes + interval '1 month')::date - v_mes)
              else 0
            end;

  v_premio := v_ind is not null and coalesce(v_eleg, true) and v_meta.premio_descricao is not null;

  return query select
    v_mes,
    v_ind,
    case when v_tem_meta and v_ind is null then v_meta.valor_loja end,
    v_loja_vendido,
    v_vendido,
    v_num,
    case when v_num > 0 then round(v_vendido / v_num, 2) end,
    v_novas,
    v_dias,
    case when v_ind is not null and v_ind > v_vendido and v_dias > 0 then round((v_ind - v_vendido) / v_dias, 2) end,
    case when v_premio then v_meta.premio_descricao end,
    case when v_premio then v_meta.premio_condicao_pct end,
    case when v_premio then v_meta.premio_extra_descricao end,
    case when v_premio and v_meta.premio_extra_descricao is not null then v_meta.premio_extra_pct end,
    case when v_premio then v_vendido >= v_ind * v_meta.premio_condicao_pct / 100.0 end,
    case when v_premio and v_meta.premio_extra_descricao is not null and v_meta.premio_extra_pct is not null
         then v_vendido >= v_ind * v_meta.premio_extra_pct / 100.0 end;
end;
$$;
comment on function public.mizloja_meu_resumo_mes(date) is
  'MIZ Loja: meta (individual ou, sem ela, a da loja), vendido, nº de vendas, ticket, clientes novas, dias restantes, R$ por dia e prêmio da usuária logada. Só metas publicadas.';

create or replace function public.mizloja_meu_historico_metas(p_meses integer default 6)
returns table (mes date, vendido numeric, meta numeric, percentual numeric, premio_ganho boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select r.mes,
         r.vendido,
         r.meta_individual,
         case when r.meta_individual > 0 then round(r.vendido / r.meta_individual * 100, 1) end,
         case when r.premio_descricao is not null then r.premio_conquistado end
    from generate_series(1, least(greatest(coalesce(p_meses, 6), 1), 24)) as g(n)
    cross join lateral public.mizloja_meu_resumo_mes(
      (date_trunc('month', public.mizloja_hoje()) - make_interval(months => g.n))::date) r
   order by r.mes desc;
$$;
comment on function public.mizloja_meu_historico_metas(integer) is
  'MIZ Loja: meses anteriores da usuária logada (vendido, meta individual, % e se ganhou o prêmio; nulo = sem prêmio).';

-- ---------------------------------------------------------------------------
-- 3) Vendas de hoje
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_minhas_vendas_hoje()
returns table (total_dia numeric, num_vendas integer, ultimas jsonb)
language sql
stable
security invoker
set search_path = ''
as $$
  with minhas as (
    select v.id, v.cliente_id, v.valor_total, v.data_venda, v.forma_pagamento, v.created_at
      from public.mizloja_vendas v
     where v.vendedora_id = (select auth.uid())
       and v.loja_id = (select mizloja_interno.mizloja_minha_loja())
       and not v.excluida
       and v.data_venda >= (public.mizloja_hoje()::timestamp at time zone 'America/Sao_Paulo')
       and v.data_venda < ((public.mizloja_hoje() + 1)::timestamp at time zone 'America/Sao_Paulo')
  )
  select coalesce((select sum(m.valor_total) from minhas m), 0)::numeric,
         (select count(*) from minhas)::integer,
         coalesce((
           select jsonb_agg(u order by u.data_venda desc, u.created_at desc)
             from (
               select m.id, m.cliente_id, c.nome as cliente_nome, m.valor_total, m.data_venda, m.forma_pagamento, m.created_at,
                      (select coalesce(jsonb_agg(jsonb_build_object(
                                'tipo', i.tipo, 'peca_nome', i.peca_nome, 'cor', i.cor,
                                'tamanho', i.tamanho, 'quantidade', i.quantidade) order by i.created_at, i.id), '[]'::jsonb)
                         from public.mizloja_venda_itens i where i.venda_id = m.id) as itens
                 from minhas m
                 join public.mizloja_clientes c on c.id = m.cliente_id
                order by m.data_venda desc, m.created_at desc
                limit 3
             ) u
         ), '[]'::jsonb);
$$;
comment on function public.mizloja_minhas_vendas_hoje() is
  'MIZ Loja: total vendido hoje (São Paulo) pela usuária logada, nº de vendas e as 3 últimas com itens.';

-- ---------------------------------------------------------------------------
-- 4) Cores já digitadas em peças de outra marca (sugestão)
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_cores_usadas(p_limite integer default 40)
returns table (cor text, usos integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select min(i.cor), count(*)::integer
    from public.mizloja_venda_itens i
   where i.tipo = 'outra'
     and i.loja_id = (select mizloja_interno.mizloja_minha_loja())
   group by public.mizloja_sem_acento(i.cor)
   order by count(*) desc, min(i.cor)
   limit least(greatest(coalesce(p_limite, 40), 1), 100);
$$;
comment on function public.mizloja_cores_usadas(integer) is
  'MIZ Loja: cores de outra marca já usadas na loja (agrupadas sem acento), da mais usada para a menos.';

-- ---------------------------------------------------------------------------
-- 5) Ranking do mês (sem valores)
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_ranking_mes(p_mes date default null)
returns table (posicao integer, nome text, sou_eu boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  with loja as (
    select mizloja_interno.mizloja_minha_loja() as id
  ),
  periodo as (
    select (date_trunc('month', coalesce(p_mes, public.mizloja_hoje()))::date::timestamp at time zone 'America/Sao_Paulo') as ini,
           ((date_trunc('month', coalesce(p_mes, public.mizloja_hoje())) + interval '1 month')::date::timestamp at time zone 'America/Sao_Paulo') as fim
  ),
  totais as (
    select u.id, u.nome,
           coalesce(sum(v.valor_total), 0) as total
      from public.mizloja_usuarias u
      cross join periodo p
      left join public.mizloja_vendas v
        on v.vendedora_id = u.id and not v.excluida and v.data_venda >= p.ini and v.data_venda < p.fim
     where u.loja_id = (select id from loja)
       and u.situacao = 'ativa'
       and (u.perfil = 'vendedora' or u.id = (select auth.uid()))
     group by u.id, u.nome
  )
  select (rank() over (order by t.total desc))::integer, t.nome, t.id = (select auth.uid())
    from totais t
   where coalesce((select c.ranking_visivel from public.mizloja_config c where c.loja_id = (select id from loja)), false)
   order by 1, 2;
$$;
comment on function public.mizloja_ranking_mes(date) is
  'MIZ Loja: posição da equipe no mês por faturamento, só nomes (sem valores). Vazio se a ADM não ligou o ranking.';

-- Permissões: só usuárias logadas
revoke all on function public.mizloja_salvar_venda(uuid, uuid, numeric, text, jsonb, timestamptz, jsonb) from public, anon;
revoke all on function public.mizloja_meu_resumo_mes(date) from public, anon;
revoke all on function public.mizloja_meu_historico_metas(integer) from public, anon;
revoke all on function public.mizloja_minhas_vendas_hoje() from public, anon;
revoke all on function public.mizloja_cores_usadas(integer) from public, anon;
revoke all on function public.mizloja_ranking_mes(date) from public, anon;
grant execute on function public.mizloja_salvar_venda(uuid, uuid, numeric, text, jsonb, timestamptz, jsonb) to authenticated, service_role;
grant execute on function public.mizloja_meu_resumo_mes(date) to authenticated, service_role;
grant execute on function public.mizloja_meu_historico_metas(integer) to authenticated, service_role;
grant execute on function public.mizloja_minhas_vendas_hoje() to authenticated, service_role;
grant execute on function public.mizloja_cores_usadas(integer) to authenticated, service_role;
grant execute on function public.mizloja_ranking_mes(date) to authenticated, service_role;
