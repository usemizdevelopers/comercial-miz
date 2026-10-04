-- MIZ Loja · kanban: a etapa escolhida pela vendedora (Novas ou Em conversa) vale para cliente sem compra.
-- Antes, cliente já contatada ficava sempre em "Em conversa", mesmo movida de volta para "Novas".
-- (O toque no WhatsApp continua passando "Novas" para "Em conversa" pelo gatilho de contatos.)

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
       end as etapa_kanban
from public.mizloja_clientes c
join public.mizloja_config cf on cf.loja_id = c.loja_id
left join public.mizloja_usuarias u on u.id = c.vendedora_id
cross join lateral (
  select h.hoje,
         h.hoje - public.mizloja_data_local(c.ultima_compra_em) as dias_sem_comprar,
         public.mizloja_proximo_aniversario(c.aniv_dia, c.aniv_mes, h.hoje) as proximo_aniversario
  from (select public.mizloja_hoje() as hoje) h
) x;

