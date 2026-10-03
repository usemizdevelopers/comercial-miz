-- MIZ Loja · sem fotos de peça (decisão da etapa 2) — PENDENTE DE APLICAR
-- Não foi aplicada pelo conector: comandos que apagam (drop) pedem confirmação extra e a chamada expira.
-- Aplicar no SQL Editor do Supabase ou na sessão de testes (ver docs/TESTES-PENDENTES.md, item 0)
-- e depois mover este arquivo para supabase/migrations/<versão>_mizloja_sem_imagens.sql.
-- Conferido antes: nenhuma função, view, política ou chave estrangeira do MIZ Loja depende dela.
-- As 4 políticas da própria tabela saem junto.
drop table public.mizloja_peca_imagens;
