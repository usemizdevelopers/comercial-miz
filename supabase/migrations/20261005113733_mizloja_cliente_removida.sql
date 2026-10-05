-- MIZ Loja · cliente removida + apoio do painel da ADM (Prompt 4)
-- Com vendas, a cliente excluída é anonimizada (nome "Cliente removida", sem WhatsApp, aniversário e
-- observações). WhatsApp nulo passa a ser permitido SÓ nesse caso (só funções internas gravam).
-- Removidas saem da view de clientes (kanban/tabela), da busca e das pastas de Hoje.
-- Também: mizloja_interno.mizloja_exigir_adm() (loja da ADM logada ou erro) e mizloja_inicio_dia(date).

create or replace function mizloja_interno.mizloja_exigir_adm()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_loja uuid := mizloja_interno.mizloja_minha_loja();
begin
  if v_loja is null or not mizloja_interno.mizloja_eh_adm(v_loja) then
    raise exception 'Só a dona da loja pode ver ou fazer isso.' using errcode = '42501';
  end if;
  return v_loja;
end;
$$;
revoke all on function mizloja_interno.mizloja_exigir_adm() from public, anon;
grant execute on function mizloja_interno.mizloja_exigir_adm() to authenticated, service_role;

create or replace function mizloja_interno.mizloja_inicio_dia(p_dia date)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select p_dia::timestamp at time zone 'America/Sao_Paulo';
$$;
revoke all on function mizloja_interno.mizloja_inicio_dia(date) from public, anon;
grant execute on function mizloja_interno.mizloja_inicio_dia(date) to authenticated, service_role;

alter table public.mizloja_clientes alter column whatsapp drop not null;
alter table public.mizloja_clientes add constraint mizloja_clientes_removida_ck
  check (whatsapp is not null or nome = 'Cliente removida');
comment on column public.mizloja_clientes.whatsapp is
  '55 + DDD + número; único por loja. Nulo só em cliente removida (anonimizada por mizloja_excluir_cliente).';

create or replace function public.mizloja_tg_clientes_antes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_interno boolean := public.mizloja_eh_interno();
  v_uid uuid := (select auth.uid());
begin
  if tg_op = 'UPDATE' and old.whatsapp is null and not v_interno then
    raise exception 'Essa cliente foi removida e não pode ser alterada.' using errcode = '42501';
  end if;

  new.nome := btrim(regexp_replace(coalesce(new.nome, ''), '\s+', ' ', 'g'));
  if new.nome = '' then
    raise exception 'Digite o nome da cliente.' using errcode = '23514';
  end if;
  new.nome_busca := public.mizloja_sem_acento(new.nome);
  new.whatsapp := public.mizloja_normalizar_whatsapp(new.whatsapp);
  if new.whatsapp is null and not (v_interno and new.nome = 'Cliente removida') then
    raise exception 'Digite o WhatsApp com DDD.' using errcode = '23514';
  end if;
  new.observacoes := nullif(btrim(new.observacoes), '');
  new.recado_transferencia := nullif(btrim(new.recado_transferencia), '');

  if tg_op = 'INSERT' then
    if not v_interno then
      -- campos calculados sempre começam do zero quando a cliente vem da tela
      new.num_compras := 0;
      new.total_gasto := 0;
      new.ticket_medio := null;
      new.primeira_compra_em := null;
      new.ultima_compra_em := null;
      new.intervalo_medio_dias := null;
      new.tamanho_preferido := null;
      new.cores_preferidas := '{}';
      new.pecas_miz_compradas := '[]';
      new.ultimo_contato_em := null;
      new.ultimo_contato_por := null;
      new.recado_transferencia := null;
      new.cadastrada_por := v_uid;
      if new.vendedora_id is null then
        new.vendedora_id := v_uid;
      elsif new.vendedora_id <> v_uid and not mizloja_interno.mizloja_eh_adm(new.loja_id) then
        raise exception 'Você só pode cadastrar clientes para você.' using errcode = '42501';
      end if;
    end if;
  else
    if new.loja_id is distinct from old.loja_id then
      raise exception 'A loja da cliente não pode ser alterada.' using errcode = '42501';
    end if;
    if not v_interno then
      if new.vendedora_id is distinct from old.vendedora_id then
        raise exception 'Use Transferir para trocar a responsável pela cliente.' using errcode = '42501';
      end if;
      new.num_compras := old.num_compras;
      new.total_gasto := old.total_gasto;
      new.ticket_medio := old.ticket_medio;
      new.primeira_compra_em := old.primeira_compra_em;
      new.ultima_compra_em := old.ultima_compra_em;
      new.intervalo_medio_dias := old.intervalo_medio_dias;
      new.tamanho_preferido := old.tamanho_preferido;
      new.cores_preferidas := old.cores_preferidas;
      new.pecas_miz_compradas := old.pecas_miz_compradas;
      new.ultimo_contato_em := old.ultimo_contato_em;
      new.ultimo_contato_por := old.ultimo_contato_por;
      new.cadastrada_por := old.cadastrada_por;
      new.created_at := old.created_at;
    end if;
    new.updated_at := now();
  end if;

  -- a responsável precisa ser da mesma loja
  if new.vendedora_id is not null
     and (tg_op = 'INSERT' or new.vendedora_id is distinct from old.vendedora_id)
     and not exists (
       select 1 from public.mizloja_usuarias u
       where u.id = new.vendedora_id and u.loja_id = new.loja_id
     ) then
    raise exception 'A vendedora responsável precisa ser desta loja.' using errcode = '23514';
  end if;

  return new;
end;
$$;

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
       uv.valor_total as ultima_compra_valor,
       jsonb_array_length(coalesce(c.pecas_miz_compradas, '[]'::jsonb)) > 0 as tem_peca_miz
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
) uv on true
where c.whatsapp is not null;

create or replace function public.mizloja_buscar_clientes(p_termo text, p_limite integer default 20)
returns table (id uuid, nome text, whatsapp_final text, ultima_compra_em timestamptz, num_compras integer, vendedora_id uuid, vendedora_nome text)
language plpgsql
stable
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_loja uuid := mizloja_interno.mizloja_minha_loja();
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
        and c.whatsapp is not null
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

create or replace function public.mizloja_tarefas_hoje()
returns table (cliente_id uuid, nome text, whatsapp text, pasta text, motivo text, ultima_compra_em timestamptz, total_gasto numeric, vendedora_id uuid)
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
      and c.whatsapp is not null
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
