-- MIZ Loja · view de clientes: valor da última compra (cartão do kanban: "Última compra há 34 dias · R$ 289").
-- Coluna nova no fim da view; o resto não muda. Vendas excluídas não contam.

create or replace view public.mizloja_v_clientes
with (security_invoker = true)
as
select c.*,
       u.nome as vendedora_nome,
       x.dias_sem_comprar,
       x.proximo_aniversario,
       x.proximo_aniversario - x.hoje as dias_para_aniversario,
       case
         when c.num_compras = 0 then 'nova'
         when c.num_compras >= 3 and x.dias_sem_comprar < cf.dias_sumida then 'vip'
         when x.dias_sem_comprar < cf.dias_recompra then 'ativa'
         when x.dias_sem_comprar < cf.dias_sumida then 'esfriando'
         when x.dias_sem_comprar <= cf.dias_inativa then 'sumida'
         else 'inativa'
       end as status,
       case
         when c.etapa_manual = 'sem_interesse' then 'sem_interesse'
         when c.num_compras = 0 then
           case when c.etapa_manual in ('novas', 'em_conversa') then c.etapa_manual
                when c.ultimo_contato_em is not null then 'em_conversa'
                else 'novas' end
         when x.dias_sem_comprar <= cf.dias_comprou then 'comprou'
         when x.dias_sem_comprar < cf.dias_recompra then 'ativa'
         when x.dias_sem_comprar < cf.dias_sumida then 'recompra'
         else 'sumidas'
       end as etapa_kanban,
       uv.valor_total as ultima_compra_valor
from public.mizloja_clientes c
join public.mizloja_config cf on cf.loja_id = c.loja_id
left join public.mizloja_usuarias u on u.id = c.vendedora_id
cross join lateral (
  select h.hoje,
         h.hoje - public.mizloja_data_local(c.ultima_compra_em) as dias_sem_comprar,
         public.mizloja_proximo_aniversario(c.aniv_dia, c.aniv_mes, h.hoje) as proximo_aniversario
  from (select public.mizloja_hoje() as hoje) h
) x
left join lateral (
  select v.valor_total
  from public.mizloja_vendas v
  where v.cliente_id = c.id and not v.excluida
  order by v.data_venda desc, v.created_at desc
  limit 1
) uv on true;

