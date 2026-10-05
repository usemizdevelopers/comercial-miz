-- MIZ Loja · exclusões atômicas (PENDENTE: aplicar no SQL Editor, junto com mizloja_sem_imagens)
-- Não foi aplicada pelo conector: comandos de apagar pedem confirmação extra e a chamada expira.
-- Depois de aplicar, mover para supabase/migrations/<versão>_mizloja_exclusoes_atomicas.sql
-- (ver docs/TESTES-PENDENTES.md, passo 0).
--
-- O que muda:
-- 1) mizloja_mesclar_clientes apaga a cliente duplicada dentro da própria função, na mesma transação
--    em que move o histórico (antes ela ficava vazia e anonimizada para o site apagar).
-- 2) mizloja_excluir_cliente apaga de vez a cliente sem vendas (devolve 'apagada'); com vendas,
--    continua anonimizando ('anonimizada').
-- 3) Limpeza: apaga as clientes removidas (WhatsApp nulo) que ficaram sem nenhuma venda — as
--    duplicadas vazias de mesclas e as excluídas sem vendas enquanto esta migration não existia.
--    Removidas COM vendas ficam (as vendas continuam nos números).
-- Contatos, pulos e transferências da cliente apagada saem junto (on delete cascade).

create or replace function public.mizloja_mesclar_clientes(p_manter uuid, p_remover uuid, p_nome text, p_whatsapp text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_loja uuid := mizloja_interno.mizloja_exigir_adm();
  v_manter public.mizloja_clientes%rowtype;
  v_remover public.mizloja_clientes%rowtype;
  v_whats text := public.mizloja_normalizar_whatsapp(p_whatsapp);
  v_nome text := btrim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g'));
  v_vendas integer;
begin
  if p_manter is null or p_remover is null or p_manter = p_remover then
    raise exception 'Escolha duas clientes diferentes.' using errcode = '22023';
  end if;
  select * into v_manter from public.mizloja_clientes where id = p_manter and loja_id = v_loja for update;
  if not found then raise exception 'Cliente não encontrada.' using errcode = '23503'; end if;
  select * into v_remover from public.mizloja_clientes where id = p_remover and loja_id = v_loja for update;
  if not found then raise exception 'Cliente não encontrada.' using errcode = '23503'; end if;
  if v_manter.whatsapp is null or v_remover.whatsapp is null then
    raise exception 'Cliente removida não pode ser mesclada.' using errcode = '23514';
  end if;
  if char_length(v_nome) < 2 then
    raise exception 'Digite o nome da cliente.' using errcode = '23514';
  end if;
  if v_whats is null or v_whats !~ '^55\d{10,11}$' then
    raise exception 'Digite o WhatsApp com DDD.' using errcode = '23514';
  end if;
  if v_whats not in (v_manter.whatsapp, v_remover.whatsapp)
     and exists (select 1 from public.mizloja_clientes c where c.loja_id = v_loja and c.whatsapp = v_whats) then
    raise exception 'Esse WhatsApp já é de outra cliente da loja.' using errcode = '23505';
  end if;

  -- histórico passa para a cliente mantida
  update public.mizloja_vendas set cliente_id = p_manter where cliente_id = p_remover;
  get diagnostics v_vendas = row_count;
  update public.mizloja_contatos set cliente_id = p_manter where cliente_id = p_remover;
  update public.mizloja_pulos p set cliente_id = p_manter
   where p.cliente_id = p_remover
     and not exists (select 1 from public.mizloja_pulos q where q.cliente_id = p_manter and q.usuaria_id = p.usuaria_id and q.data = p.data);
  update public.mizloja_transferencias set cliente_id = p_manter where cliente_id = p_remover;

  insert into public.mizloja_clientes_mesclas (loja_id, cliente_mantida_id, removida_id, removida, mantida_antes, vendas_movidas, criado_por)
  values (v_loja, p_manter, p_remover, to_jsonb(v_remover), to_jsonb(v_manter), v_vendas, (select auth.uid()));

  -- a duplicada sai de vez, na mesma transação (pulos repetidos do mesmo dia saem em cascata)
  delete from public.mizloja_clientes where id = p_remover;

  update public.mizloja_clientes
     set nome = v_nome,
         whatsapp = v_whats,
         aniv_dia = coalesce(v_manter.aniv_dia, v_remover.aniv_dia),
         aniv_mes = case when v_manter.aniv_dia is not null then v_manter.aniv_mes else v_remover.aniv_mes end,
         aniv_ano = case when v_manter.aniv_dia is not null then v_manter.aniv_ano else v_remover.aniv_ano end,
         observacoes = left(nullif(concat_ws(' · ', v_manter.observacoes, v_remover.observacoes), ''), 500),
         ultimo_contato_em = greatest(v_manter.ultimo_contato_em, v_remover.ultimo_contato_em),
         ultimo_contato_por = case when v_remover.ultimo_contato_em > coalesce(v_manter.ultimo_contato_em, '-infinity')
                                   then v_remover.ultimo_contato_por else v_manter.ultimo_contato_por end
   where id = p_manter;

  perform public.mizloja_recalcular_cliente(p_manter);

  return jsonb_build_object('cliente_id', p_manter, 'removida_id', p_remover, 'vendas_movidas', v_vendas);
end;
$$;
comment on function public.mizloja_mesclar_clientes(uuid, uuid, text, text) is
  'MIZ Loja (ADM): junta duas clientes duplicadas numa transação só. Histórico vai para a mantida, com o nome e o WhatsApp escolhidos; a outra é apagada e a mescla fica em mizloja_clientes_mesclas.';

create or replace function public.mizloja_excluir_cliente(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_loja uuid := mizloja_interno.mizloja_exigir_adm();
begin
  if not exists (select 1 from public.mizloja_clientes c where c.id = p_id and c.loja_id = v_loja) then
    raise exception 'Cliente não encontrada.' using errcode = '23503';
  end if;

  -- sem vendas: apaga de vez (contatos, pulos e transferências saem em cascata)
  if not exists (select 1 from public.mizloja_vendas v where v.cliente_id = p_id) then
    delete from public.mizloja_clientes where id = p_id;
    return 'apagada';
  end if;

  -- com vendas: anonimiza e mantém as vendas nos números
  delete from public.mizloja_pulos where cliente_id = p_id;
  update public.mizloja_clientes
     set nome = 'Cliente removida',
         whatsapp = null,
         aniv_dia = null, aniv_mes = null, aniv_ano = null,
         observacoes = null,
         recado_transferencia = null,
         etapa_manual = 'sem_interesse'
   where id = p_id;
  return 'anonimizada';
end;
$$;
comment on function public.mizloja_excluir_cliente(uuid) is
  'MIZ Loja (ADM): sem vendas, apaga a cliente (''apagada''); com vendas, anonimiza ("Cliente removida", sem WhatsApp, aniversário e observações) e mantém as vendas nos números (''anonimizada'').';

revoke all on function public.mizloja_mesclar_clientes(uuid, uuid, text, text) from public, anon;
revoke all on function public.mizloja_excluir_cliente(uuid) from public, anon;
grant execute on function public.mizloja_mesclar_clientes(uuid, uuid, text, text) to authenticated, service_role;
grant execute on function public.mizloja_excluir_cliente(uuid) to authenticated, service_role;

-- Limpeza: removidas que ficaram sem nenhuma venda (duplicadas vazias e excluídas sem vendas)
delete from public.mizloja_clientes c
 where c.whatsapp is null
   and not exists (select 1 from public.mizloja_vendas v where v.cliente_id = c.id);
