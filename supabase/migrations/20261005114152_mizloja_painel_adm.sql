-- MIZ Loja · funções de leitura do painel da ADM (Prompt 4). Todas conferem que quem chama é ADM ativa da loja.
-- mizloja_painel_resumo, mizloja_painel_series, mizloja_painel_meta, mizloja_painel_vendedora, mizloja_adm_vendas
-- e a tabela mizloja_clientes_mesclas (registro das mesclas de clientes duplicadas).

create table public.mizloja_clientes_mesclas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.mizloja_lojas(id) on delete cascade,
  cliente_mantida_id uuid not null references public.mizloja_clientes(id) on delete cascade,
  removida_id uuid not null,
  removida jsonb not null,
  mantida_antes jsonb not null,
  vendas_movidas integer not null default 0,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.mizloja_clientes_mesclas enable row level security;
create index mizloja_clientes_mesclas_loja_idx on public.mizloja_clientes_mesclas (loja_id, created_at desc);
create index mizloja_clientes_mesclas_mantida_idx on public.mizloja_clientes_mesclas (cliente_mantida_id);
create index mizloja_clientes_mesclas_criado_por_idx on public.mizloja_clientes_mesclas (criado_por);
comment on table public.mizloja_clientes_mesclas is 'MIZ Loja: registro das clientes duplicadas mescladas pela ADM (dados da cliente apagada e da mantida antes). Escrita só pela função.';
revoke all on public.mizloja_clientes_mesclas from anon, authenticated;
grant select on public.mizloja_clientes_mesclas to authenticated;
grant all on public.mizloja_clientes_mesclas to service_role;
create policy mizloja_clientes_mesclas_select on public.mizloja_clientes_mesclas
  for select to authenticated
  using (loja_id = (select mizloja_interno.mizloja_minha_loja()) and (select mizloja_interno.mizloja_meu_perfil()) = 'adm');

create or replace function mizloja_interno.mizloja_indicadores(p_loja uuid, p_inicio date, p_fim date, p_vendedora uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_ini timestamptz := mizloja_interno.mizloja_inicio_dia(p_inicio);
  v_fim timestamptz := mizloja_interno.mizloja_inicio_dia(p_fim + 1);
  v_fat numeric := 0;
  v_n integer := 0;
  v_miz numeric := 0;
  v_pecas integer := 0;
  v_novas integer := 0;
  v_com1 integer := 0;
  v_com2 integer := 0;
  v_ativas integer := 0;
begin
  select coalesce(sum(v.valor_total), 0), count(*)::integer, coalesce(sum(v.valor_total) filter (where v.tem_peca_miz), 0)
    into v_fat, v_n, v_miz
    from public.mizloja_vendas v
   where v.loja_id = p_loja and not v.excluida and v.data_venda >= v_ini and v.data_venda < v_fim
     and (p_vendedora is null or v.vendedora_id = p_vendedora);

  select coalesce(sum(i.quantidade), 0)::integer into v_pecas
    from public.mizloja_venda_itens i
    join public.mizloja_vendas v on v.id = i.venda_id
   where v.loja_id = p_loja and not v.excluida and v.data_venda >= v_ini and v.data_venda < v_fim
     and (p_vendedora is null or v.vendedora_id = p_vendedora);

  select count(*)::integer into v_novas
    from (
      select distinct on (v.cliente_id) v.cliente_id, v.vendedora_id, v.data_venda
        from public.mizloja_vendas v
       where v.loja_id = p_loja and not v.excluida
       order by v.cliente_id, v.data_venda, v.created_at
    ) p
   where p.data_venda >= v_ini and p.data_venda < v_fim
     and (p_vendedora is null or p.vendedora_id = p_vendedora);

  select count(*) filter (where n >= 1)::integer, count(*) filter (where n >= 2)::integer into v_com1, v_com2
    from (
      select v.cliente_id, count(*) as n
        from public.mizloja_vendas v
       where v.loja_id = p_loja and not v.excluida and v.data_venda < v_fim
         and (p_vendedora is null or v.vendedora_id = p_vendedora)
       group by v.cliente_id
    ) q;

  select count(distinct v.cliente_id)::integer into v_ativas
    from public.mizloja_vendas v
   where v.loja_id = p_loja and not v.excluida
     and v.data_venda >= mizloja_interno.mizloja_inicio_dia(p_fim - 89) and v.data_venda < v_fim
     and (p_vendedora is null or v.vendedora_id = p_vendedora);

  return jsonb_build_object(
    'faturamento', v_fat,
    'vendas', v_n,
    'ticket_medio', case when v_n > 0 then round(v_fat / v_n, 2) end,
    'pecas', v_pecas,
    'clientes_novas', v_novas,
    'taxa_recompra', case when v_com1 > 0 then round(v_com2::numeric * 100 / v_com1, 1) end,
    'clientes_ativas', v_ativas,
    'pct_miz', case when v_fat > 0 then round(v_miz * 100 / v_fat, 1) end
  );
end;
$$;

create or replace function public.mizloja_painel_resumo(p_inicio date, p_fim date, p_vendedora_id uuid default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_loja uuid := mizloja_interno.mizloja_exigir_adm();
  v_dias integer;
  v_ant_ini date;
  v_ant_fim date;
begin
  if p_inicio is null or p_fim is null or p_fim < p_inicio then
    raise exception 'Período inválido.' using errcode = '22023';
  end if;
  v_dias := p_fim - p_inicio + 1;
  v_ant_fim := p_inicio - 1;
  v_ant_ini := p_inicio - v_dias;
  return jsonb_build_object(
    'inicio', p_inicio, 'fim', p_fim,
    'anterior_inicio', v_ant_ini, 'anterior_fim', v_ant_fim,
    'atual', mizloja_interno.mizloja_indicadores(v_loja, p_inicio, p_fim, p_vendedora_id),
    'anterior', mizloja_interno.mizloja_indicadores(v_loja, v_ant_ini, v_ant_fim, p_vendedora_id)
  );
end;
$$;
comment on function public.mizloja_painel_resumo(date, date, uuid) is
  'MIZ Loja (ADM): faturamento, vendas, ticket, peças, clientes novas, recompra, ativas (90 dias) e % Miz do período e do período anterior de mesma duração.';

create or replace function public.mizloja_painel_series(p_inicio date, p_fim date, p_vendedora_id uuid default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_loja uuid := mizloja_interno.mizloja_exigir_adm();
  v_ini timestamptz;
  v_fim timestamptz;
  v_por_dia boolean;
  v_fat jsonb;
  v_vend jsonb;
  v_pecas jsonb;
  v_cores jsonb;
  v_tams jsonb;
  v_perfil jsonb;
  v_saude jsonb;
  v_mes int := extract(month from public.mizloja_hoje())::int;
begin
  if p_inicio is null or p_fim is null or p_fim < p_inicio then
    raise exception 'Período inválido.' using errcode = '22023';
  end if;
  v_ini := mizloja_interno.mizloja_inicio_dia(p_inicio);
  v_fim := mizloja_interno.mizloja_inicio_dia(p_fim + 1);
  v_por_dia := (p_fim - p_inicio + 1) <= 62;

  if v_por_dia then
    select coalesce(jsonb_agg(jsonb_build_object('data', d.dia::date, 'valor', coalesce(s.valor, 0), 'vendas', coalesce(s.n, 0)) order by d.dia), '[]')
      into v_fat
      from generate_series(p_inicio, p_fim, interval '1 day') as d(dia)
      left join (
        select public.mizloja_data_local(v.data_venda) as dia, sum(v.valor_total) as valor, count(*) as n
          from public.mizloja_vendas v
         where v.loja_id = v_loja and not v.excluida and v.data_venda >= v_ini and v.data_venda < v_fim
           and (p_vendedora_id is null or v.vendedora_id = p_vendedora_id)
         group by 1
      ) s on s.dia = d.dia::date;
  else
    select coalesce(jsonb_agg(jsonb_build_object('data', d.mes::date, 'valor', coalesce(s.valor, 0), 'vendas', coalesce(s.n, 0)) order by d.mes), '[]')
      into v_fat
      from generate_series(date_trunc('month', p_inicio), date_trunc('month', p_fim), interval '1 month') as d(mes)
      left join (
        select date_trunc('month', public.mizloja_data_local(v.data_venda)) as mes, sum(v.valor_total) as valor, count(*) as n
          from public.mizloja_vendas v
         where v.loja_id = v_loja and not v.excluida and v.data_venda >= v_ini and v.data_venda < v_fim
           and (p_vendedora_id is null or v.vendedora_id = p_vendedora_id)
         group by 1
      ) s on s.mes = d.mes;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('usuaria_id', t.id, 'nome', t.nome, 'faturamento', t.fat, 'vendas', t.n) order by t.fat desc, t.nome), '[]')
    into v_vend
    from (
      select u.id, u.nome, coalesce(sum(v.valor_total), 0) as fat, count(v.id) as n
        from public.mizloja_usuarias u
        left join public.mizloja_vendas v
          on v.vendedora_id = u.id and not v.excluida and v.data_venda >= v_ini and v.data_venda < v_fim
       where u.loja_id = v_loja
       group by u.id, u.nome, u.situacao
      having u.situacao = 'ativa' or count(v.id) > 0
    ) t;

  select coalesce(jsonb_agg(jsonb_build_object('peca_id', t.peca_id, 'nome', t.nome, 'codigo', t.codigo, 'quantidade', t.qtd) order by t.qtd desc, t.nome), '[]')
    into v_pecas
    from (
      select i.peca_id, max(i.peca_nome) as nome, max(i.peca_codigo) as codigo, sum(i.quantidade)::integer as qtd
        from public.mizloja_venda_itens i
        join public.mizloja_vendas v on v.id = i.venda_id
       where v.loja_id = v_loja and not v.excluida and v.data_venda >= v_ini and v.data_venda < v_fim
         and (p_vendedora_id is null or v.vendedora_id = p_vendedora_id)
         and i.tipo = 'miz'
       group by i.peca_id
       order by qtd desc
       limit 10
    ) t;

  select coalesce(jsonb_agg(jsonb_build_object('cor', t.cor, 'hex', t.hex, 'quantidade', t.qtd) order by t.qtd desc, t.cor), '[]')
    into v_cores
    from (
      select (array_agg(i.cor order by i.created_at desc))[1] as cor,
             (array_agg(i.cor_hex order by i.cor_hex is null, i.created_at desc))[1] as hex,
             sum(i.quantidade)::integer as qtd
        from public.mizloja_venda_itens i
        join public.mizloja_vendas v on v.id = i.venda_id
       where v.loja_id = v_loja and not v.excluida and v.data_venda >= v_ini and v.data_venda < v_fim
         and (p_vendedora_id is null or v.vendedora_id = p_vendedora_id)
       group by public.mizloja_sem_acento(i.cor)
       order by qtd desc
       limit 10
    ) t;

  select coalesce(jsonb_agg(jsonb_build_object('tamanho', t.tamanho, 'quantidade', t.qtd)
                            order by array_position(array['PP','PP/P','P','M','M/G','G','GG','Unico'], t.tamanho)), '[]')
    into v_tams
    from (
      select i.tamanho, sum(i.quantidade)::integer as qtd
        from public.mizloja_venda_itens i
        join public.mizloja_vendas v on v.id = i.venda_id
       where v.loja_id = v_loja and not v.excluida and v.data_venda >= v_ini and v.data_venda < v_fim
         and (p_vendedora_id is null or v.vendedora_id = p_vendedora_id)
       group by i.tamanho
    ) t;

  select jsonb_build_object(
           'tamanho', (select x->>'tamanho' from jsonb_array_elements(v_tams) x order by (x->>'quantidade')::int desc limit 1),
           'cores', coalesce((select jsonb_agg(y.x) from (select x from jsonb_array_elements(v_cores) x limit 3) y), '[]'),
           'peca', (select x from jsonb_array_elements(v_pecas) x limit 1),
           'ticket_medio', (select case when count(*) > 0 then round(sum(v.valor_total) / count(*), 2) end
                              from public.mizloja_vendas v
                             where v.loja_id = v_loja and not v.excluida and v.data_venda >= v_ini and v.data_venda < v_fim
                               and (p_vendedora_id is null or v.vendedora_id = p_vendedora_id)),
           'intervalo_medio', (select round(avg(c.intervalo_medio_dias), 0)
                                 from public.mizloja_clientes c
                                where c.loja_id = v_loja and c.whatsapp is not null and c.num_compras >= 2
                                  and (p_vendedora_id is null or c.vendedora_id = p_vendedora_id)),
           'aniversariantes_mes', (select count(*)
                                     from public.mizloja_clientes c
                                    where c.loja_id = v_loja and c.whatsapp is not null and c.aniv_mes = v_mes
                                      and (p_vendedora_id is null or c.vendedora_id = p_vendedora_id))
         ) into v_perfil;

  select coalesce(jsonb_object_agg(e.etapa_kanban, e.n), '{}')
    into v_saude
    from (
      select vc.etapa_kanban, count(*) as n
        from public.mizloja_v_clientes vc
       where vc.loja_id = v_loja and (p_vendedora_id is null or vc.vendedora_id = p_vendedora_id)
       group by vc.etapa_kanban
    ) e;

  return jsonb_build_object(
    'agrupamento', case when v_por_dia then 'dia' else 'mes' end,
    'faturamento', v_fat,
    'por_vendedora', v_vend,
    'pecas_miz', v_pecas,
    'cores', v_cores,
    'tamanhos', v_tams,
    'perfil', v_perfil,
    'saude', v_saude
  );
end;
$$;
comment on function public.mizloja_painel_series(date, date, uuid) is
  'MIZ Loja (ADM): faturamento por dia (até 62 dias) ou mês, vendas por vendedora, peças Miz, cores e tamanhos mais vendidos, perfil da cliente e clientes por etapa.';

create or replace function public.mizloja_painel_meta(p_mes date default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_loja uuid := mizloja_interno.mizloja_exigir_adm();
  v_hoje date := public.mizloja_hoje();
  v_mes date := date_trunc('month', coalesce(p_mes, public.mizloja_hoje()))::date;
  v_ini timestamptz := mizloja_interno.mizloja_inicio_dia(v_mes);
  v_fim timestamptz := mizloja_interno.mizloja_inicio_dia((v_mes + interval '1 month')::date);
  v_meta public.mizloja_metas%rowtype;
  v_tem boolean;
  v_vendido numeric;
  v_dias integer;
  v_vend jsonb;
begin
  select m.* into v_meta from public.mizloja_metas m where m.loja_id = v_loja and m.mes = v_mes;
  v_tem := found;

  select coalesce(sum(v.valor_total), 0) into v_vendido
    from public.mizloja_vendas v
   where v.loja_id = v_loja and not v.excluida and v.data_venda >= v_ini and v.data_venda < v_fim;

  v_dias := case
              when v_mes = date_trunc('month', v_hoje)::date then ((v_mes + interval '1 month')::date - v_hoje)
              when v_mes > v_hoje then ((v_mes + interval '1 month')::date - v_mes)
              else 0
            end;

  select coalesce(jsonb_agg(jsonb_build_object(
           'usuaria_id', t.id, 'nome', t.nome, 'perfil', t.perfil, 'situacao', t.situacao,
           'meta', t.meta, 'vendido', t.vendido, 'vendas', t.n,
           'percentual', case when t.meta > 0 then round(t.vendido * 100 / t.meta, 1) end,
           'falta', case when t.meta > 0 then greatest(t.meta - t.vendido, 0) end,
           'premio_elegivel', t.elegivel,
           'premio', case
                       when not v_tem or v_meta.premio_descricao is null or t.meta is null or not coalesce(t.elegivel, true) then null
                       when t.vendido >= t.meta * v_meta.premio_condicao_pct / 100.0 then 'conquistado'
                       else 'a_caminho'
                     end,
           'premio_extra', case
                       when not v_tem or v_meta.premio_extra_descricao is null or v_meta.premio_extra_pct is null
                            or t.meta is null or not coalesce(t.elegivel, true) then null
                       when t.vendido >= t.meta * v_meta.premio_extra_pct / 100.0 then 'conquistado'
                       else 'a_caminho'
                     end
         ) order by t.vendido desc, t.nome), '[]')
    into v_vend
    from (
      select u.id, u.nome, u.perfil, u.situacao, mv.valor as meta, mv.premio_elegivel as elegivel,
             coalesce(sum(v.valor_total), 0) as vendido, count(v.id)::integer as n
        from public.mizloja_usuarias u
        left join public.mizloja_metas_vendedoras mv on mv.usuaria_id = u.id and v_tem and mv.meta_id = v_meta.id
        left join public.mizloja_vendas v
          on v.vendedora_id = u.id and not v.excluida and v.data_venda >= v_ini and v.data_venda < v_fim
       where u.loja_id = v_loja
       group by u.id, u.nome, u.perfil, u.situacao, mv.valor, mv.premio_elegivel
      having u.situacao = 'ativa' or count(v.id) > 0 or mv.valor is not null
    ) t;

  return jsonb_build_object(
    'mes', v_mes,
    'meta_id', case when v_tem then v_meta.id end,
    'status', case when v_tem then v_meta.status end,
    'valor_loja', case when v_tem then v_meta.valor_loja end,
    'vendido', v_vendido,
    'falta', case when v_tem then greatest(v_meta.valor_loja - v_vendido, 0) end,
    'dias_restantes', v_dias,
    'por_dia', case when v_tem and v_dias > 0 and v_meta.valor_loja > v_vendido then round((v_meta.valor_loja - v_vendido) / v_dias, 2) end,
    'premio_descricao', case when v_tem then v_meta.premio_descricao end,
    'premio_condicao_pct', case when v_tem then v_meta.premio_condicao_pct end,
    'premio_extra_descricao', case when v_tem then v_meta.premio_extra_descricao end,
    'premio_extra_pct', case when v_tem then v_meta.premio_extra_pct end,
    'vendedoras', v_vend
  );
end;
$$;
comment on function public.mizloja_painel_meta(date) is
  'MIZ Loja (ADM): meta da loja no mês (rascunho ou publicada), vendido, falta, R$ por dia e, por usuária, meta, vendido, %, falta e prêmio (a_caminho/conquistado).';

create or replace function public.mizloja_painel_vendedora(p_vendedora_id uuid, p_inicio date, p_fim date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_loja uuid := mizloja_interno.mizloja_exigir_adm();
  v_ini timestamptz := mizloja_interno.mizloja_inicio_dia(p_inicio);
  v_fim timestamptz := mizloja_interno.mizloja_inicio_dia(p_fim + 1);
  v_contatos integer;
  v_atendidas integer;
  v_miz integer;
  v_cad integer;
  v_cad_compraram integer;
begin
  if not exists (select 1 from public.mizloja_usuarias u where u.id = p_vendedora_id and u.loja_id = v_loja) then
    raise exception 'Pessoa não encontrada nesta loja.' using errcode = '23503';
  end if;

  select count(*)::integer into v_contatos
    from public.mizloja_contatos ct
   where ct.loja_id = v_loja and ct.usuaria_id = p_vendedora_id and ct.created_at >= v_ini and ct.created_at < v_fim;

  select count(distinct v.cliente_id)::integer into v_atendidas
    from public.mizloja_vendas v
   where v.loja_id = v_loja and v.vendedora_id = p_vendedora_id and not v.excluida
     and v.data_venda >= v_ini and v.data_venda < v_fim;

  select coalesce(sum(i.quantidade), 0)::integer into v_miz
    from public.mizloja_venda_itens i
    join public.mizloja_vendas v on v.id = i.venda_id
   where v.loja_id = v_loja and v.vendedora_id = p_vendedora_id and not v.excluida and i.tipo = 'miz'
     and v.data_venda >= v_ini and v.data_venda < v_fim;

  select count(*)::integer, count(*) filter (where c.num_compras > 0)::integer into v_cad, v_cad_compraram
    from public.mizloja_clientes c
   where c.loja_id = v_loja and c.cadastrada_por = p_vendedora_id
     and c.created_at >= v_ini and c.created_at < v_fim;

  return jsonb_build_object(
    'contatos', v_contatos,
    'clientes_atendidas', v_atendidas,
    'pecas_miz', v_miz,
    'cadastradas', v_cad,
    'cadastradas_compraram', v_cad_compraram,
    'conversao', case when v_cad > 0 then round(v_cad_compraram::numeric * 100 / v_cad, 1) end
  );
end;
$$;
comment on function public.mizloja_painel_vendedora(uuid, date, date) is
  'MIZ Loja (ADM): contatos de WhatsApp, clientes atendidas, peças Miz e conversão (cadastradas no período que compraram) de uma usuária.';

create or replace function public.mizloja_adm_vendas(
  p_inicio date,
  p_fim date,
  p_vendedora_id uuid default null,
  p_miz boolean default null,
  p_peca_id uuid default null,
  p_cor text default null,
  p_tamanho text default null,
  p_pagamento text default null,
  p_excluidas boolean default false,
  p_limite integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_loja uuid := mizloja_interno.mizloja_exigir_adm();
  v_ini timestamptz := mizloja_interno.mizloja_inicio_dia(p_inicio);
  v_fim timestamptz := mizloja_interno.mizloja_inicio_dia(p_fim + 1);
  v_cor text := nullif(public.mizloja_sem_acento(p_cor), '');
  v_res jsonb;
begin
  with filtradas as (
    select v.*
      from public.mizloja_vendas v
     where v.loja_id = v_loja
       and v.data_venda >= v_ini and v.data_venda < v_fim
       and (coalesce(p_excluidas, false) or not v.excluida)
       and (p_vendedora_id is null or v.vendedora_id = p_vendedora_id)
       and (p_miz is null or v.tem_peca_miz = p_miz)
       and (p_pagamento is null or v.forma_pagamento = p_pagamento)
       and (p_peca_id is null and v_cor is null and p_tamanho is null
            or exists (
              select 1 from public.mizloja_venda_itens i
               where i.venda_id = v.id
                 and (p_peca_id is null or i.peca_id = p_peca_id)
                 and (v_cor is null or public.mizloja_sem_acento(i.cor) = v_cor)
                 and (p_tamanho is null or i.tamanho = p_tamanho)))
  ),
  totais as (
    select count(*) filter (where not f.excluida) as n,
           coalesce(sum(f.valor_total) filter (where not f.excluida), 0) as fat,
           count(*) as linhas
      from filtradas f
  ),
  pecas as (
    select coalesce(sum(i.quantidade), 0) as qtd
      from public.mizloja_venda_itens i
      join filtradas f on f.id = i.venda_id
     where not f.excluida
  ),
  pagina as (
    select f.*
      from filtradas f
     order by f.data_venda desc, f.created_at desc
     limit least(greatest(coalesce(p_limite, 50), 1), 5000)
    offset greatest(coalesce(p_offset, 0), 0)
  )
  select jsonb_build_object(
           'total_linhas', t.linhas,
           'vendas', t.n,
           'faturamento', t.fat,
           'pecas', (select qtd from pecas),
           'linhas', coalesce((
             select jsonb_agg(jsonb_build_object(
                      'id', p.id, 'data_venda', p.data_venda, 'created_at', p.created_at,
                      'cliente_id', p.cliente_id, 'cliente_nome', c.nome,
                      'vendedora_id', p.vendedora_id, 'vendedora_nome', u.nome,
                      'valor_total', p.valor_total, 'forma_pagamento', p.forma_pagamento,
                      'tem_peca_miz', p.tem_peca_miz, 'excluida', p.excluida, 'motivo_exclusao', p.motivo_exclusao,
                      'itens', (select coalesce(jsonb_agg(jsonb_build_object(
                                  'id', i.id, 'tipo', i.tipo, 'peca_id', i.peca_id, 'peca_nome', i.peca_nome,
                                  'peca_codigo', i.peca_codigo, 'peca_cor_id', i.peca_cor_id, 'cor', i.cor,
                                  'cor_hex', i.cor_hex, 'tamanho', i.tamanho, 'quantidade', i.quantidade)
                                  order by i.created_at, i.id), '[]'::jsonb)
                                  from public.mizloja_venda_itens i where i.venda_id = p.id))
                    order by p.data_venda desc, p.created_at desc)
               from pagina p
               join public.mizloja_clientes c on c.id = p.cliente_id
               left join public.mizloja_usuarias u on u.id = p.vendedora_id
           ), '[]'::jsonb)
         ) into v_res
    from totais t;
  return v_res;
end;
$$;
comment on function public.mizloja_adm_vendas(date, date, uuid, boolean, uuid, text, text, text, boolean, integer, integer) is
  'MIZ Loja (ADM): vendas da loja no período com filtros (vendedora, Miz, peça, cor, tamanho, pagamento, excluídas), página e totais (vendas, peças e faturamento sem as excluídas).';

revoke all on function mizloja_interno.mizloja_indicadores(uuid, date, date, uuid) from public, anon;
grant execute on function mizloja_interno.mizloja_indicadores(uuid, date, date, uuid) to authenticated, service_role;
revoke all on function public.mizloja_painel_resumo(date, date, uuid) from public, anon;
revoke all on function public.mizloja_painel_series(date, date, uuid) from public, anon;
revoke all on function public.mizloja_painel_meta(date) from public, anon;
revoke all on function public.mizloja_painel_vendedora(uuid, date, date) from public, anon;
revoke all on function public.mizloja_adm_vendas(date, date, uuid, boolean, uuid, text, text, text, boolean, integer, integer) from public, anon;
grant execute on function public.mizloja_painel_resumo(date, date, uuid) to authenticated, service_role;
grant execute on function public.mizloja_painel_series(date, date, uuid) to authenticated, service_role;
grant execute on function public.mizloja_painel_meta(date) to authenticated, service_role;
grant execute on function public.mizloja_painel_vendedora(uuid, date, date) to authenticated, service_role;
grant execute on function public.mizloja_adm_vendas(date, date, uuid, boolean, uuid, text, text, text, boolean, integer, integer) to authenticated, service_role;
