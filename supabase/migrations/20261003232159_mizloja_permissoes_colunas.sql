-- MIZ Loja · permissões de escrita por coluna em todas as tabelas mizloja_
-- Motivo: com permissão de tabela inteira, quem pode editar uma linha também poderia trocar
-- o id (ex.: apontar uma usuária para outra conta do Auth) ou campos calculados/de autoria.
-- Agora a usuária logada (authenticated) só escreve as colunas que as telas usam.
-- id, loja_id (exceto onde a tela informa a loja), autoria, datas e campos calculados ficam
-- só para gatilhos, funções internas e Edge Functions (service role, que não é afetada).
-- O RLS continua decidindo QUAIS linhas; isto decide QUAIS colunas.

-- 1) tira toda escrita de authenticated nas tabelas mizloja_ (leitura continua)
do $$
declare
  t text;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'mizloja\_%'
  loop
    execute format('revoke insert, update, delete on table public.%I from authenticated', t);
  end loop;
end;
$$;

-- 2) devolve só o necessário, coluna por coluna

-- Admin Miz: só o nome (WhatsApp e situação só pelas Edge Functions)
grant update (nome) on public.mizloja_admins to authenticated;

-- Lojas: criação e situação só pela Edge Function; Admin Miz e ADM editam dados básicos (CNPJ nunca)
grant update (nome, cidade, uf, whatsapp) on public.mizloja_lojas to authenticated;

-- Usuárias: criação, perfil, loja, login e situação só pelas Edge Functions
grant update (nome, whatsapp, email) on public.mizloja_usuarias to authenticated;

-- Catálogo (Admin Miz): origem_id não é editável
grant insert (nome, codigo_referencia, categoria, composicao, ativa, esgotado) on public.mizloja_pecas to authenticated;
grant update (nome, codigo_referencia, categoria, composicao, ativa, esgotado) on public.mizloja_pecas to authenticated;
grant delete on public.mizloja_pecas to authenticated;
grant insert (peca_id, nome, valor, ordem, ativa) on public.mizloja_peca_cores to authenticated;
grant update (nome, valor, ordem, ativa) on public.mizloja_peca_cores to authenticated;
grant delete on public.mizloja_peca_cores to authenticated;
grant insert (peca_id, valor, ordem) on public.mizloja_peca_tamanhos to authenticated;
grant update (ordem) on public.mizloja_peca_tamanhos to authenticated;
grant delete on public.mizloja_peca_tamanhos to authenticated;

-- Clientes: campos calculados, último contato e autoria só por gatilho
grant insert (loja_id, nome, whatsapp, aniv_dia, aniv_mes, aniv_ano, observacoes, origem, vendedora_id, etapa_manual)
  on public.mizloja_clientes to authenticated;
grant update (nome, whatsapp, aniv_dia, aniv_mes, aniv_ano, observacoes, origem, etapa_manual, recado_transferencia)
  on public.mizloja_clientes to authenticated;
grant delete on public.mizloja_clientes to authenticated;

-- Vendas (sem DELETE: exclusão é lógica)
grant insert (cliente_id, vendedora_id, data_venda, valor_total, forma_pagamento) on public.mizloja_vendas to authenticated;
grant update (cliente_id, vendedora_id, data_venda, valor_total, forma_pagamento, excluida, motivo_exclusao)
  on public.mizloja_vendas to authenticated;

-- Itens da venda (loja, cópias do catálogo e datas preenchidos pelo gatilho)
grant insert (venda_id, tipo, peca_id, peca_cor_id, cor, cor_hex, tamanho, quantidade) on public.mizloja_venda_itens to authenticated;
grant update (tipo, peca_id, peca_cor_id, cor, cor_hex, tamanho, quantidade) on public.mizloja_venda_itens to authenticated;
grant delete on public.mizloja_venda_itens to authenticated;

-- Metas
grant insert (loja_id, mes, valor_loja, status, premio_descricao, premio_condicao_pct, premio_extra_descricao, premio_extra_pct)
  on public.mizloja_metas to authenticated;
grant update (mes, valor_loja, status, premio_descricao, premio_condicao_pct, premio_extra_descricao, premio_extra_pct)
  on public.mizloja_metas to authenticated;
grant delete on public.mizloja_metas to authenticated;
grant insert (meta_id, usuaria_id, valor, premio_elegivel) on public.mizloja_metas_vendedoras to authenticated;
grant update (valor, premio_elegivel) on public.mizloja_metas_vendedoras to authenticated;
grant delete on public.mizloja_metas_vendedoras to authenticated;

-- Contatos e "Pular hoje" (loja, usuária e data preenchidas pelo gatilho)
grant insert (cliente_id, pasta) on public.mizloja_contatos to authenticated;
grant insert (cliente_id) on public.mizloja_pulos to authenticated;
grant delete on public.mizloja_pulos to authenticated;

-- Mensagens e configurações da loja (ADM)
grant update (texto) on public.mizloja_mensagens to authenticated;
grant update (dias_pos_venda, dias_pos_venda_limite, dias_comprou, dias_recompra, dias_sumida, dias_inativa,
              dias_followup_conversa, dias_followup_recontato, visibilidade_vendedora, ranking_visivel)
  on public.mizloja_config to authenticated;

-- Transferências e alterações: só leitura (escrita pelas funções e gatilhos)
