-- MIZ Loja · mesclar e excluir clientes (ADM). As funções não apagam linhas: o site apaga em seguida,
-- pela API (a ADM tem permissão de apagar cliente pelo RLS), a cliente que ficou vazia.
-- mizloja_mesclar_clientes: vendas, contatos, pulos e transferências vão para a mantida; nome e WhatsApp
--   escolhidos; a outra fica anonimizada e sem histórico (o site apaga) e a mescla fica registrada.
-- mizloja_excluir_cliente: com vendas, anonimiza e mantém as vendas nos números ('anonimizada');
--   sem vendas, devolve 'pode_apagar' (o site apaga).

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

  -- a duplicada fica vazia e anonimizada (libera o WhatsApp); o site apaga em seguida
  update public.mizloja_clientes
     set nome = 'Cliente removida', whatsapp = null, aniv_dia = null, aniv_mes = null, aniv_ano = null,
         observacoes = null, recado_transferencia = null, etapa_manual = 'sem_interesse'
   where id = p_remover;
  perform public.mizloja_recalcular_cliente(p_remover);

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
  'MIZ Loja (ADM): junta duas clientes duplicadas. Histórico vai para a mantida, com o nome e o WhatsApp escolhidos; a outra fica anonimizada e vazia (o site apaga) e a mescla fica em mizloja_clientes_mesclas.';

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

  if not exists (select 1 from public.mizloja_vendas v where v.cliente_id = p_id) then
    return 'pode_apagar';
  end if;

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
  'MIZ Loja (ADM): com vendas, anonimiza a cliente ("Cliente removida", sem WhatsApp, aniversário e observações) e mantém as vendas nos números; sem vendas, devolve pode_apagar (o site apaga).';

revoke all on function public.mizloja_mesclar_clientes(uuid, uuid, text, text) from public, anon;
revoke all on function public.mizloja_excluir_cliente(uuid) from public, anon;
grant execute on function public.mizloja_mesclar_clientes(uuid, uuid, text, text) to authenticated, service_role;
grant execute on function public.mizloja_excluir_cliente(uuid) to authenticated, service_role;
