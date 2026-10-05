-- Provisória até mizloja_exclusoes_atomicas: sem vendas também anonimiza (some da view, busca e pastas).
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
  'MIZ Loja (ADM): anonimiza a cliente ("Cliente removida", sem WhatsApp, aniversário e observações); as vendas continuam nos números. Provisória: com mizloja_exclusoes_atomicas, a cliente sem vendas passa a ser apagada (''apagada'').';

revoke all on function public.mizloja_excluir_cliente(uuid) from public, anon;
grant execute on function public.mizloja_excluir_cliente(uuid) to authenticated, service_role;
