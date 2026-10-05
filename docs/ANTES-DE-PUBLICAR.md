# Antes de publicar

Lista para a virada do MIZ Loja para uso real. Faça depois de passar pelo [roteiro de testes](TESTES-PENDENTES.md). Marque cada item.

## 1. Dados que só a Miz tem

- [ ] **WhatsApp de suporte real.** Hoje é o provisório `5531999999999`. Ele vai no build arg `VITE_WHATSAPP_SUPORTE_MIZ` (botão "Falar com a Miz" da tela de entrada). Sem isso, o botão abre um número que não existe.
- [ ] **Domínio** do site definido (ex.: `loja.usemiz.app`) e DNS (registro A) apontando para o servidor do Easypanel.

## 2. Supabase

- [ ] **Edge Functions → Secrets**:
  | Nome | Valor |
  | --- | --- |
  | `APP_URL` | `https://<domínio>` (link "Entre em …/entrar" da mensagem de acesso) |
  | `ALLOWED_ORIGINS` | `https://<domínio>` (sem `localhost`) |
  `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já vêm do próprio Supabase; nunca copiar a service role para outro lugar.
- [ ] **Authentication → URL Configuration:** Site URL = `https://<domínio>`; o mesmo endereço em Redirect URLs.
- [ ] **Authentication → Proteção contra senhas vazadas** ligada (aviso do advisor). Vale para o projeto inteiro, inclusive o app MIZ: confirme com quem cuida do app MIZ antes.
- [ ] Edge Functions publicadas e com `verify_jwt = true`: `mizloja-criar-loja`, `mizloja-criar-usuaria`, `mizloja-nova-senha`, `mizloja-alterar-situacao`, `mizloja-criar-admin`, `mizloja-alterar-login`.
- [ ] **`mizloja-primeiro-admin` desligada:** a versão publicada tem que ser a do repositório (`CODIGO_USO_UNICO = ''`, responde 410). Ou remova a função.
- [ ] Migration 3 (`mizloja_sem_imagens`) aplicada e movida para `supabase/migrations/` (roteiro, passo 1).
- [ ] Advisors de segurança e desempenho sem aviso novo do MIZ Loja (os avisos de funções `SECURITY DEFINER` do MIZ Loja são esperados: todas conferem quem chama).

## 3. Limpar a demonstração

- [ ] Remover a **Loja Demonstração**: `fn mizloja-seed-demo <token do Admin Miz> '{"acao":"remover"}'` (apaga a loja, tudo dela e as 3 contas no Auth). Conferir: `select count(*) from mizloja_lojas where cnpj = '99999999000191';` → 0.
- [ ] Remover a função **`mizloja-seed-demo`** pelo painel do Supabase (Edge Functions).
- [ ] Remover as lojas e contas criadas nos testes (loja do 4.1 do roteiro etc.), se não forem usadas.

## 4. Código e publicação

- [ ] `npm run check` passando na branch.
- [ ] Buscas da service role (roteiro, 4.5) limpas.
- [ ] **Merge na `main`** da branch `claude/kind-volta-fewqmc` (depois da sua aprovação).
- [ ] **Easypanel** ([DEPLOY-EASYPANEL.md](DEPLOY-EASYPANEL.md)): app pela `main`, Dockerfile, build args `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_WHATSAPP_SUPORTE_MIZ` (número real), domínio na porta 80 com HTTPS, verificação de saúde em `/saude`.
- [ ] Depois do deploy, no celular: entrar como Admin Miz, criar a primeira loja real e mandar o acesso da dona pelo WhatsApp (o link da mensagem tem que abrir o domínio novo).

## 5. Depois de publicar

- [ ] Logo oficial no lugar do logotipo em texto (`Logo` em `src/components/ui/Navegacao.tsx` e `public/favicon.svg`).
- [ ] Recuperação de senha por e-mail para a dona (precisa de SMTP próprio no Supabase) — hoje "Esqueci a senha" manda falar com a dona ou com a Miz.
- [ ] Ver [PENDENCIAS.md](PENDENCIAS.md) para o resto.
