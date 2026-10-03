-- MIZ Loja · quem pode executar cada função
-- Tudo fechado por padrão; liberado para authenticated só o que as páginas e as
-- políticas de RLS usam. Funções de gatilho e o recálculo ficam só internos.

do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'mizloja\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end;
$$;

-- apoio (usadas dentro de políticas, view e gatilhos executados pela usuária)
grant execute on function public.mizloja_normalizar_whatsapp(text) to authenticated;
grant execute on function public.mizloja_hoje() to authenticated;
grant execute on function public.mizloja_data_local(timestamptz) to authenticated;
grant execute on function public.mizloja_sem_acento(text) to authenticated;
grant execute on function public.mizloja_proximo_aniversario(integer, integer, date) to authenticated;
grant execute on function public.mizloja_eh_interno() to authenticated;
grant execute on function public.mizloja_eh_admin_miz() to authenticated;
grant execute on function public.mizloja_minha_loja() to authenticated;
grant execute on function public.mizloja_meu_perfil() to authenticated;
grant execute on function public.mizloja_eh_adm(uuid) to authenticated;

-- páginas
grant execute on function public.mizloja_lancar_venda(uuid, numeric, text, jsonb, timestamptz, uuid) to authenticated;
grant execute on function public.mizloja_buscar_clientes(text, integer) to authenticated;
grant execute on function public.mizloja_transferir_cliente(uuid, uuid, text) to authenticated;
grant execute on function public.mizloja_transferir_carteira(uuid, uuid) to authenticated;
grant execute on function public.mizloja_registrar_acesso() to authenticated;
grant execute on function public.mizloja_senha_trocada() to authenticated;
grant execute on function public.mizloja_tarefas_hoje() to authenticated;
