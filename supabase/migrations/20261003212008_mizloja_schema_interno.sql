-- MIZ Loja · funções de apoio do RLS fora da API
-- As funções que dizem "quem é a usuária logada" são SECURITY DEFINER e usadas
-- pelas políticas de RLS. Elas saem do schema public (exposto pela API REST) e vão
-- para mizloja_interno, que não é exposto. As políticas continuam funcionando
-- (o Postgres guarda a referência pela função, não pelo nome).

create schema if not exists mizloja_interno;
comment on schema mizloja_interno is 'MIZ Loja: funções internas usadas pelo RLS. Não exposto pela API.';
revoke all on schema mizloja_interno from public, anon;
grant usage on schema mizloja_interno to authenticated, service_role;

alter function public.mizloja_minha_loja() set schema mizloja_interno;
alter function public.mizloja_meu_perfil() set schema mizloja_interno;
alter function public.mizloja_eh_adm(uuid) set schema mizloja_interno;
alter function public.mizloja_eh_admin_miz() set schema mizloja_interno;

-- Atualiza as funções do MIZ Loja que chamavam essas funções pelo nome antigo
do $$
declare
  r record;
  v_def text;
begin
  for r in
    select p.oid
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'mizloja\_%'
  loop
    v_def := pg_get_functiondef(r.oid);
    if v_def ~ 'public\.mizloja_(minha_loja|meu_perfil|eh_adm|eh_admin_miz)\(' then
      v_def := regexp_replace(v_def, 'public\.mizloja_(minha_loja|meu_perfil|eh_admin_miz|eh_adm)\(',
                              'mizloja_interno.mizloja_\1(', 'g');
      execute v_def;
    end if;
  end loop;
end;
$$;
