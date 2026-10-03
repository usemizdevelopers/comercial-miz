-- MIZ Loja · confere a Loja Demonstração (só leitura)
with loja as (select id from public.mizloja_lojas where cnpj = '99999999000191')
select 'clientes' as item, count(*)::text as valor from public.mizloja_clientes where loja_id = (select id from loja)
union all select 'vendas', count(*)::text from public.mizloja_vendas where loja_id = (select id from loja)
union all select 'vendas com peça Miz', count(*)::text from public.mizloja_vendas where loja_id = (select id from loja) and tem_peca_miz
union all select 'formas de pagamento', string_agg(distinct forma_pagamento, ', ') from public.mizloja_vendas where loja_id = (select id from loja)
union all select 'valor mínimo / máximo', min(valor_total)::text || ' / ' || max(valor_total)::text from public.mizloja_vendas where loja_id = (select id from loja)
union all select 'kanban', string_agg(etapa_kanban || '=' || n, ', ' order by etapa_kanban) from (select etapa_kanban, count(*) n from public.mizloja_v_clientes where loja_id = (select id from loja) group by 1) k
union all select 'status', string_agg(status || '=' || n, ', ' order by status) from (select status, count(*) n from public.mizloja_v_clientes where loja_id = (select id from loja) group by 1) s
union all select 'aniversários em até 7 dias', count(*)::text from public.mizloja_v_clientes where loja_id = (select id from loja) and dias_para_aniversario between 0 and 7
union all select 'transferências', count(*)::text from public.mizloja_transferencias where loja_id = (select id from loja)
union all select 'meta do mês', coalesce((select status || ' · R$ ' || valor_loja from public.mizloja_metas where loja_id = (select id from loja) and mes = date_trunc('month', public.mizloja_hoje())::date), 'nenhuma');
