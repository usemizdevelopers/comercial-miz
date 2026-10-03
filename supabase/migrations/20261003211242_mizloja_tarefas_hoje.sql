-- MIZ Loja · tarefas das pastas da tela Hoje (Aniversário, Pós-venda, Follow-up)
-- Cada cliente aparece em uma pasta só: aniversario > pos_venda > follow_up.

create or replace function public.mizloja_tarefas_hoje()
returns table (
  cliente_id uuid,
  nome text,
  whatsapp text,
  pasta text,
  motivo text,
  ultima_compra_em timestamptz,
  total_gasto numeric,
  vendedora_id uuid
)
language sql
stable
security invoker
set search_path = ''
as $$
  with eu as (
    select u.id as uid, u.loja_id, u.perfil,
           cf.dias_pos_venda, cf.dias_pos_venda_limite, cf.dias_recompra, cf.dias_sumida,
           cf.dias_followup_conversa, cf.dias_followup_recontato, cf.visibilidade_vendedora,
           public.mizloja_hoje() as hoje
    from public.mizloja_usuarias u
    join public.mizloja_lojas l on l.id = u.loja_id and l.situacao = 'ativa'
    join public.mizloja_config cf on cf.loja_id = u.loja_id
    where u.id = (select auth.uid()) and u.situacao = 'ativa'
  ),
  base as (
    select c.id, c.nome, c.whatsapp, c.ultima_compra_em, c.total_gasto, c.vendedora_id,
           c.num_compras, c.ultimo_contato_em,
           e.uid, e.dias_pos_venda, e.dias_pos_venda_limite, e.dias_recompra, e.dias_sumida,
           e.dias_followup_conversa, e.dias_followup_recontato,
           e.hoje - public.mizloja_data_local(c.ultima_compra_em) as dias_sem,
           public.mizloja_proximo_aniversario(c.aniv_dia, c.aniv_mes, e.hoje) - e.hoje as dias_aniv,
           e.hoje - public.mizloja_data_local(c.ultimo_contato_em) as dias_contato
    from public.mizloja_clientes c
    join eu e on e.loja_id = c.loja_id
    where c.etapa_manual is distinct from 'sem_interesse'
      and (c.vendedora_id = e.uid
           or (e.perfil = 'vendedora' and e.visibilidade_vendedora = 'todas'))
      and not exists (
        select 1 from public.mizloja_pulos p
        where p.cliente_id = c.id and p.usuaria_id = e.uid and p.data = e.hoje
      )
  ),
  transf as (
    select distinct on (t.cliente_id)
           t.cliente_id, t.created_at, t.para_usuaria_id,
           coalesce(de.nome, cr.nome) as quem
    from public.mizloja_transferencias t
    left join public.mizloja_usuarias de on de.id = t.de_usuaria_id
    left join public.mizloja_usuarias cr on cr.id = t.criado_por
    where t.motivo <> 'venda'
      and t.cliente_id in (select b.id from base b)
    order by t.cliente_id, t.created_at desc
  ),
  classificadas as (
    select b.*,
           tr.quem,
           case
             when b.dias_aniv between 0 and 2
                  and not exists (
                    select 1 from public.mizloja_contatos ct
                    where ct.cliente_id = b.id and ct.pasta = 'aniversario'
                      and ct.created_at >= now() - interval '7 days')
               then 'aniversario'
             when b.num_compras > 0
                  and b.dias_sem between b.dias_pos_venda and b.dias_pos_venda_limite
                  and (b.ultimo_contato_em is null or b.ultimo_contato_em < b.ultima_compra_em)
               then 'pos_venda'
             when tr.cliente_id is not null
                  and tr.para_usuaria_id = b.vendedora_id
                  and (b.ultimo_contato_em is null or b.ultimo_contato_em < tr.created_at)
               then 'fu_transferida'
             when b.num_compras = 0 and b.ultimo_contato_em is null
               then 'fu_nova'
             when b.num_compras = 0 and b.dias_contato >= b.dias_followup_conversa
               then 'fu_sem_resposta'
             when b.num_compras > 0 and b.dias_sem >= b.dias_sumida
                  and (b.ultimo_contato_em is null or b.dias_contato >= b.dias_followup_recontato)
               then 'fu_sumida'
             when b.num_compras > 0 and b.dias_sem >= b.dias_recompra
                  and (b.ultimo_contato_em is null or b.dias_contato >= b.dias_followup_recontato)
               then 'fu_recompra'
           end as regra
    from base b
    left join transf tr on tr.cliente_id = b.id
  )
  select k.id,
         k.nome,
         k.whatsapp,
         case when k.regra like 'fu\_%' then 'follow_up' else k.regra end as pasta,
         case k.regra
           when 'aniversario' then
             case k.dias_aniv when 0 then 'Aniversário hoje' when 1 then 'Aniversário amanhã'
                              else 'Aniversário em ' || k.dias_aniv || ' dias' end
           when 'pos_venda' then
             'Comprou há ' || k.dias_sem || case when k.dias_sem = 1 then ' dia' else ' dias' end
           when 'fu_transferida' then
             coalesce('Transferida pela ' || split_part(k.quem, ' ', 1), 'Transferida para você')
           when 'fu_nova' then 'Nova, ainda sem conversa'
           when 'fu_sem_resposta' then
             'Sem resposta há ' || k.dias_contato || case when k.dias_contato = 1 then ' dia' else ' dias' end
           when 'fu_sumida' then 'Sumida há ' || k.dias_sem || ' dias'
           when 'fu_recompra' then k.dias_sem || ' dias sem comprar'
         end as motivo,
         k.ultima_compra_em,
         k.total_gasto,
         k.vendedora_id
  from classificadas k
  where k.regra is not null
  order by case when k.regra = 'aniversario' then 1 when k.regra = 'pos_venda' then 2 else 3 end,
           k.dias_aniv nulls last,
           k.dias_sem desc nulls last,
           k.nome;
$$;
comment on function public.mizloja_tarefas_hoje() is 'MIZ Loja: clientes das pastas Aniversário, Pós-venda e Follow-up da usuária logada, com o motivo pronto para o cartão.';
