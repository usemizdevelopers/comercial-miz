-- MIZ Loja · Row Level Security e permissões
-- Nenhuma tabela mizloja_ é acessível por anon. Políticas só para authenticated.
-- Admin Miz vê lojas, usuárias e catálogo; não lê clientes, vendas, metas nem contatos.

-- ---------------------------------------------------------------------------
-- Permissões de tabela
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'mizloja\_%'
  loop
    execute format('revoke all on table public.%I from anon, authenticated, public', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end;
$$;

grant select on public.mizloja_admins to authenticated;
grant select, insert, update, delete on public.mizloja_lojas to authenticated;
grant select, insert, update, delete on public.mizloja_usuarias to authenticated;
grant select, insert, update, delete on public.mizloja_pecas to authenticated;
grant select, insert, update, delete on public.mizloja_peca_cores to authenticated;
grant select, insert, update, delete on public.mizloja_peca_tamanhos to authenticated;
grant select, insert, update, delete on public.mizloja_peca_imagens to authenticated;
grant select, insert, update, delete on public.mizloja_clientes to authenticated;
grant select, insert, update on public.mizloja_vendas to authenticated;
grant select, insert, update, delete on public.mizloja_venda_itens to authenticated;
grant select, insert, update, delete on public.mizloja_metas to authenticated;
grant select, insert, update, delete on public.mizloja_metas_vendedoras to authenticated;
grant select, insert on public.mizloja_contatos to authenticated;
grant select, insert, delete on public.mizloja_pulos to authenticated;
grant select on public.mizloja_transferencias to authenticated;
grant select, update on public.mizloja_mensagens to authenticated;
grant select, update on public.mizloja_config to authenticated;
grant select on public.mizloja_alteracoes to authenticated;

-- ---------------------------------------------------------------------------
-- Admin Miz
-- ---------------------------------------------------------------------------
create policy mizloja_admins_select on public.mizloja_admins
  for select to authenticated
  using (id = (select auth.uid()) or (select public.mizloja_eh_admin_miz()));

-- ---------------------------------------------------------------------------
-- Lojas
-- ---------------------------------------------------------------------------
create policy mizloja_lojas_select on public.mizloja_lojas
  for select to authenticated
  using (id = (select public.mizloja_minha_loja()) or (select public.mizloja_eh_admin_miz()));

create policy mizloja_lojas_insert on public.mizloja_lojas
  for insert to authenticated
  with check ((select public.mizloja_eh_admin_miz()));

create policy mizloja_lojas_update on public.mizloja_lojas
  for update to authenticated
  using ((select public.mizloja_eh_admin_miz())
         or (id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm'))
  with check ((select public.mizloja_eh_admin_miz())
              or (id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm'));

create policy mizloja_lojas_delete on public.mizloja_lojas
  for delete to authenticated
  using ((select public.mizloja_eh_admin_miz()));

-- ---------------------------------------------------------------------------
-- Usuárias
-- ---------------------------------------------------------------------------
create policy mizloja_usuarias_select on public.mizloja_usuarias
  for select to authenticated
  using (id = (select auth.uid())
         or loja_id = (select public.mizloja_minha_loja())
         or (select public.mizloja_eh_admin_miz()));

create policy mizloja_usuarias_insert on public.mizloja_usuarias
  for insert to authenticated
  with check ((select public.mizloja_eh_admin_miz()));

create policy mizloja_usuarias_update on public.mizloja_usuarias
  for update to authenticated
  using ((select public.mizloja_eh_admin_miz())
         or (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm'))
  with check ((select public.mizloja_eh_admin_miz())
              or (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm'));

create policy mizloja_usuarias_delete on public.mizloja_usuarias
  for delete to authenticated
  using ((select public.mizloja_eh_admin_miz()));

-- ---------------------------------------------------------------------------
-- Catálogo: leitura por usuárias ativas e Admin Miz; escrita só Admin Miz
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['mizloja_pecas', 'mizloja_peca_cores', 'mizloja_peca_tamanhos', 'mizloja_peca_imagens'] loop
    execute format($p$
      create policy %1$s_select on public.%1$I for select to authenticated
        using ((select public.mizloja_minha_loja()) is not null or (select public.mizloja_eh_admin_miz()))
    $p$, t);
    execute format($p$
      create policy %1$s_insert on public.%1$I for insert to authenticated
        with check ((select public.mizloja_eh_admin_miz()))
    $p$, t);
    execute format($p$
      create policy %1$s_update on public.%1$I for update to authenticated
        using ((select public.mizloja_eh_admin_miz()))
        with check ((select public.mizloja_eh_admin_miz()))
    $p$, t);
    execute format($p$
      create policy %1$s_delete on public.%1$I for delete to authenticated
        using ((select public.mizloja_eh_admin_miz()))
    $p$, t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Clientes: qualquer usuária ativa da loja (a busca é na base inteira); DELETE só ADM
-- ---------------------------------------------------------------------------
create policy mizloja_clientes_select on public.mizloja_clientes
  for select to authenticated
  using (loja_id = (select public.mizloja_minha_loja()));

create policy mizloja_clientes_insert on public.mizloja_clientes
  for insert to authenticated
  with check (loja_id = (select public.mizloja_minha_loja()));

create policy mizloja_clientes_update on public.mizloja_clientes
  for update to authenticated
  using (loja_id = (select public.mizloja_minha_loja()))
  with check (loja_id = (select public.mizloja_minha_loja()));

create policy mizloja_clientes_delete on public.mizloja_clientes
  for delete to authenticated
  using (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm');

-- ---------------------------------------------------------------------------
-- Vendas: leitura pela loja; UPDATE pela ADM ou pela vendedora até 24 h; sem DELETE
-- ---------------------------------------------------------------------------
create policy mizloja_vendas_select on public.mizloja_vendas
  for select to authenticated
  using (loja_id = (select public.mizloja_minha_loja()));

create policy mizloja_vendas_insert on public.mizloja_vendas
  for insert to authenticated
  with check (loja_id = (select public.mizloja_minha_loja()));

create policy mizloja_vendas_update on public.mizloja_vendas
  for update to authenticated
  using (loja_id = (select public.mizloja_minha_loja())
         and ((select public.mizloja_meu_perfil()) = 'adm'
              or (vendedora_id = (select auth.uid()) and created_at > now() - interval '24 hours')))
  with check (loja_id = (select public.mizloja_minha_loja()));

-- ---------------------------------------------------------------------------
-- Itens: mesmas regras da venda
-- ---------------------------------------------------------------------------
create policy mizloja_venda_itens_select on public.mizloja_venda_itens
  for select to authenticated
  using (loja_id = (select public.mizloja_minha_loja()));

create policy mizloja_venda_itens_insert on public.mizloja_venda_itens
  for insert to authenticated
  with check (exists (
    select 1 from public.mizloja_vendas v
    where v.id = venda_id
      and v.loja_id = (select public.mizloja_minha_loja())
      and ((select public.mizloja_meu_perfil()) = 'adm'
           or (v.vendedora_id = (select auth.uid()) and v.created_at > now() - interval '24 hours'))
  ));

create policy mizloja_venda_itens_update on public.mizloja_venda_itens
  for update to authenticated
  using (exists (
    select 1 from public.mizloja_vendas v
    where v.id = venda_id
      and v.loja_id = (select public.mizloja_minha_loja())
      and ((select public.mizloja_meu_perfil()) = 'adm'
           or (v.vendedora_id = (select auth.uid()) and v.created_at > now() - interval '24 hours'))
  ))
  with check (loja_id = (select public.mizloja_minha_loja()));

create policy mizloja_venda_itens_delete on public.mizloja_venda_itens
  for delete to authenticated
  using (exists (
    select 1 from public.mizloja_vendas v
    where v.id = venda_id
      and v.loja_id = (select public.mizloja_minha_loja())
      and ((select public.mizloja_meu_perfil()) = 'adm'
           or (v.vendedora_id = (select auth.uid()) and v.created_at > now() - interval '24 hours'))
  ));

-- ---------------------------------------------------------------------------
-- Metas: ADM vê todas e escreve; vendedora vê só publicadas
-- ---------------------------------------------------------------------------
create policy mizloja_metas_select on public.mizloja_metas
  for select to authenticated
  using (loja_id = (select public.mizloja_minha_loja())
         and ((select public.mizloja_meu_perfil()) = 'adm' or status = 'publicada'));

create policy mizloja_metas_insert on public.mizloja_metas
  for insert to authenticated
  with check (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm');

create policy mizloja_metas_update on public.mizloja_metas
  for update to authenticated
  using (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm')
  with check (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm');

create policy mizloja_metas_delete on public.mizloja_metas
  for delete to authenticated
  using (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm');

-- Metas por vendedora: ADM vê todas; vendedora só a própria e de meta publicada
create policy mizloja_metas_vendedoras_select on public.mizloja_metas_vendedoras
  for select to authenticated
  using (loja_id = (select public.mizloja_minha_loja())
         and ((select public.mizloja_meu_perfil()) = 'adm'
              or (usuaria_id = (select auth.uid())
                  and exists (select 1 from public.mizloja_metas m where m.id = meta_id and m.status = 'publicada'))));

create policy mizloja_metas_vendedoras_insert on public.mizloja_metas_vendedoras
  for insert to authenticated
  with check (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm');

create policy mizloja_metas_vendedoras_update on public.mizloja_metas_vendedoras
  for update to authenticated
  using (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm')
  with check (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm');

create policy mizloja_metas_vendedoras_delete on public.mizloja_metas_vendedoras
  for delete to authenticated
  using (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm');

-- ---------------------------------------------------------------------------
-- Contatos e pulos: grava a própria usuária; leitura pela loja
-- ---------------------------------------------------------------------------
create policy mizloja_contatos_select on public.mizloja_contatos
  for select to authenticated
  using (loja_id = (select public.mizloja_minha_loja()));

create policy mizloja_contatos_insert on public.mizloja_contatos
  for insert to authenticated
  with check (loja_id = (select public.mizloja_minha_loja()) and usuaria_id = (select auth.uid()));

create policy mizloja_pulos_select on public.mizloja_pulos
  for select to authenticated
  using (loja_id = (select public.mizloja_minha_loja()));

create policy mizloja_pulos_insert on public.mizloja_pulos
  for insert to authenticated
  with check (loja_id = (select public.mizloja_minha_loja()) and usuaria_id = (select auth.uid()));

create policy mizloja_pulos_delete on public.mizloja_pulos
  for delete to authenticated
  using (loja_id = (select public.mizloja_minha_loja()) and usuaria_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Transferências: leitura pela loja; escrita só pelas funções
-- ---------------------------------------------------------------------------
create policy mizloja_transferencias_select on public.mizloja_transferencias
  for select to authenticated
  using (loja_id = (select public.mizloja_minha_loja()));

-- ---------------------------------------------------------------------------
-- Mensagens e config: leitura pela loja; UPDATE só ADM
-- ---------------------------------------------------------------------------
create policy mizloja_mensagens_select on public.mizloja_mensagens
  for select to authenticated
  using (loja_id = (select public.mizloja_minha_loja()));

create policy mizloja_mensagens_update on public.mizloja_mensagens
  for update to authenticated
  using (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm')
  with check (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm');

create policy mizloja_config_select on public.mizloja_config
  for select to authenticated
  using (loja_id = (select public.mizloja_minha_loja()));

create policy mizloja_config_update on public.mizloja_config
  for update to authenticated
  using (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm')
  with check (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm');

-- ---------------------------------------------------------------------------
-- Alterações: leitura só ADM; escrita só pelo gatilho
-- ---------------------------------------------------------------------------
create policy mizloja_alteracoes_select on public.mizloja_alteracoes
  for select to authenticated
  using (loja_id = (select public.mizloja_minha_loja()) and (select public.mizloja_meu_perfil()) = 'adm');
