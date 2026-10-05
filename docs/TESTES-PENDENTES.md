# Roteiro de testes do MIZ Loja (sessão única)

Tudo o que não deu para testar no container de desenvolvimento (ele não acessa `ldlwdxgjiohuvionihhv.supabase.co`; só o conector do Supabase funciona). As funções do banco já foram testadas pelo conector, em transações desfeitas. Aqui ficam o login, as telas, as Edge Functions pela rede e o Docker.

**Rode na ordem:** cada parte usa a anterior. Marque cada caixa e anote o que for diferente do esperado.

Contas usadas:
- **Admin Miz:** `5531984810586`, senha provisória gerada no passo 2.
- **Loja Demonstração:** Mariana Souza (ADM) `5531900001001`, Júlia Lima `5531900001002`, Paula Ribeiro `5531900001003`, senhas geradas no passo 3.

---

## 0. Preparação

- [ ] `.env` com `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_WHATSAPP_SUPORTE_MIZ`; `npm install`; `npm run check` passando.
- [ ] Atalhos no terminal:

```bash
export SUPABASE_URL=https://ldlwdxgjiohuvionihhv.supabase.co
export ANON=<anon key do .env>
export FN=$SUPABASE_URL/functions/v1

# Entra com usuário + senha e devolve o token de acesso
token() {
  curl -s "$SUPABASE_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1@mizloja.usemiz.app\",\"password\":\"$2\"}" | jq -r .access_token
}
# Chama uma Edge Function: fn <nome> <token> '<json>'
fn() {
  curl -s -w '  [HTTP %{http_code}]\n' -X POST "$FN/$1" \
    -H "apikey: $ANON" -H "Authorization: Bearer $2" -H "Content-Type: application/json" -d "$3"
}
```

---

## 1. Aplicar a migration 3 (`mizloja_sem_imagens`)

O conector não aplica `drop table` (pede confirmação e a chamada expira).

- [ ] Supabase → SQL Editor → colar `supabase/migrations-pendentes/mizloja_sem_imagens.sql` (`drop table public.mizloja_peca_imagens;`) → Run.
- [ ] `select to_regclass('public.mizloja_peca_imagens');` → **null**.
- [ ] `select count(*) from information_schema.tables where table_schema = 'public' and table_name not like 'mizloja_%';` → **28** (app MIZ intacto).
- [ ] Mover o arquivo para `supabase/migrations/<AAAAMMDDHHMMSS>_mizloja_sem_imagens.sql`, regenerar `types/supabase.ts`, tirar a tabela de `docs/BANCO.md` e rodar `npm run check`.

**Esperado:** só a tabela de fotos some; o site continua igual (não usa fotos).

## 2. Criar o Admin Miz (`mizloja-primeiro-admin`, uso único)

No repositório só existe a versão **desligada** (`CODIGO_USO_UNICO = ''` → sempre 410). O código **nunca** vai para o GitHub.

- [ ] Gerar um código: `openssl rand -hex 24`.
- [ ] Numa **cópia local fora do git** de `supabase/functions/mizloja-primeiro-admin/index.ts`, colocar o código em `CODIGO_USO_UNICO`.
- [ ] Publicar essa cópia com o nome `mizloja-primeiro-admin` e **`verify_jwt = false`**, junto com os arquivos de `_shared/`.
- [ ] Chamar uma vez:
  ```bash
  curl -s -X POST "$FN/mizloja-primeiro-admin" -H "apikey: $ANON" \
    -H "x-mizloja-codigo: <código>" -H "Content-Type: application/json" -d '{}'
  ```
  **Esperado:** `{ "usuario": "5531984810586", "senha": "<provisória>", "admin_id": "…", "vinculos_antigos_removidos": 1 }`. **Guarde a senha.**
- [ ] Na hora, publicar de novo a versão desligada do repositório (mesmo nome) e apagar a cópia local. Chamar de novo → **410** "Função desligada.".
- [ ] Conferir no SQL Editor:
  - `mizloja_admins`: 1 linha ativa, `usuario = 5531984810586`, `precisa_trocar_senha = true`;
  - a conta `usemizdigital@gmail.com` continua igual no Auth (`select email, raw_user_meta_data from auth.users where email = 'usemizdigital@gmail.com';`) e no app MIZ, e saiu só de `mizloja_admins`;
  - `select count(*) from public.profiles where id = '<admin_id>';` → **0**.
- [ ] Entrar no site (`npm run dev`, `http://localhost:5173`) com `5531984810586` + senha provisória.
  **Esperado:** vai direto para **Crie a sua senha**; menos de 6 letras, confirmação diferente ou senha igual à provisória mostram aviso; ao trocar, cai em `/miz/lojas`.
- [ ] Sair e entrar com a senha nova → `/miz/lojas`. Senha errada → "Usuário ou senha incorretos" (sem dizer qual dos dois). "Esqueci a senha" → folha com o WhatsApp da Miz.

## 3. Carregar a Loja Demonstração

Detalhes em [DEMO.md](DEMO.md).

- [ ] Publicar `supabase/functions/mizloja-seed-demo` com `verify_jwt = true` (com `_shared/`).
- [ ] `ADMIN=$(token 5531984810586 '<senha nova>')` e `fn mizloja-seed-demo $ADMIN '{"acao":"carregar"}'`.
  **Esperado:** as 3 contas com senhas de 10 letras. **Guarde as senhas.**
- [ ] Rodar `supabase/seed-demo/dados.sql` no SQL Editor e depois `verificar.sql`.
  **Esperado:** 40 clientes, ~117 vendas, as 7 etapas do kanban, os 6 status, 2 aniversários na semana, 1 transferência e meta publicada de R$ 30.000 (tabela completa em DEMO.md).
- [ ] Entrar como Júlia e como Mariana: **sem** troca de senha obrigatória.

## 4. Painel Admin Miz

### 4.1 Lojas
- [ ] `/miz/lojas` → **+ Loja** com CNPJ válido (ex.: `11.444.777/0001-61`), cidade, UF e dona.
  **Esperado:** "Acesso criado" com usuário e senha uma vez, **Enviar pelo WhatsApp** (mensagem com `APP_URL/entrar`) e **Copiar**.
- [ ] CNPJ inválido → "Confira o CNPJ."; CNPJ repetido → "Já existe uma loja com esse CNPJ."; WhatsApp já em uso → "Esse WhatsApp já tem acesso ao MIZ Loja.".
- [ ] Na loja: editar nome/cidade; **Gerar nova senha** da dona (aparece uma vez; a dona volta a ter troca obrigatória).
- [ ] **Desativar a loja** → a dona logada perde o acesso; **Reativar** → volta.
- [ ] Busca por nome, cidade e CNPJ (com e sem acento e pontuação).

### 4.2 Catálogo
- [ ] **+ Peça** com 2 cores e 3 tamanhos (ex.: P, M, G) → aparece com as bolinhas e "P · M · G".
- [ ] Desativar uma cor → some do Lançar venda, continua nas vendas antigas.
- [ ] Apagar peça já vendida (uma da demonstração) → "Essa peça já foi vendida. Desative em vez de apagar."; peça nunca vendida → apaga.

### 4.3 Admins
- [ ] **+ Admin** → acesso criado; nova senha; desativar e reativar outro admin (o próprio não aparece para desativar).

### 4.4 Permissões das Edge Functions (terminal)
Use a loja criada em 4.1: `DONA=$(token <whatsapp da dona> '<senha>')`, crie uma vendedora com `fn mizloja-criar-usuaria $DONA '{"nome":"Vendedora Teste","whatsapp":"31911110002"}'` e `VEND=$(token 5531911110002 '<senha>')`.

- [ ] Sem token: `curl -s -w '%{http_code}' -X POST "$FN/mizloja-criar-usuaria" -H "apikey: $ANON" -d '{}'` → **401**.
- [ ] Vendedora criando acesso: `fn mizloja-criar-usuaria $VEND '{"nome":"X","whatsapp":"31911110009"}'` → **403**, nada criado.
- [ ] ADM criando ADM: `fn mizloja-criar-usuaria $DONA '{"perfil":"adm","nome":"Outra","whatsapp":"31911110008"}'` → **403** "A dona da loja cria só vendedoras.".
- [ ] ADM trocando login de vendedora de **outra** loja: `fn mizloja-alterar-login $DONA '{"usuario_id":"<id da Júlia da demonstração>","whatsapp":"31911110007"}'` → **403**.
- [ ] Desativar com sessão aberta: `fn mizloja-alterar-situacao $DONA '{"tipo":"usuaria","id":"<id da vendedora>","situacao":"inativa"}'` → 200; com o mesmo `$VEND`, `curl -s "$SUPABASE_URL/rest/v1/mizloja_clientes?select=id" -H "apikey: $ANON" -H "Authorization: Bearer $VEND"` → **`[]`**; `token 5531911110002 '<senha>'` → **null** (bloqueada).
- [ ] Funções da ADM com token de vendedora: `curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/mizloja_painel_resumo" -H "apikey: $ANON" -H "Authorization: Bearer <token da Júlia>" -H "Content-Type: application/json" -d '{"p_inicio":"2026-10-01","p_fim":"2026-10-31"}'` → erro "Só a dona da loja pode ver ou fazer isso.".

### 4.5 Buscas da service role (na `main`, depois do merge)
```bash
grep -rnE "service_role|SERVICE_ROLE" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git .
npm run build && grep -rlE "service_role|SERVICE_ROLE" dist || echo "dist limpo"
git log --all -p | grep -c "eyJhbGciOi"
```
- [ ] **Esperado:** só `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` em `supabase/functions/_shared/supabase.ts` e os `grant … to service_role` das migrations; `dist` limpo; **0** chaves JWT.

## 5. Vendedora (Prompt 3) — entrar como Júlia

### 5.1 Hoje (`/hoje`)
- [ ] Saudação com o primeiro nome e a data por extenso; faixa da meta com barra, "Vendido · Faltam" e "Faltam R$ X para o seu prêmio" (meta da Júlia: R$ 12.000). Tocar na faixa → `/metas`.
- [ ] Pastas Follow-up · Pós-venda · Aniversário com contadores; a primeira com gente já vem aberta; pasta com 0 apagada e sem toque.
- [ ] Aniversário → **WhatsApp** abre o wa.me com "Feliz aniversário, [primeiro nome]! …"; o cartão some na hora. Pós-venda → mensagem de pós-venda. Follow-up → conversa em branco.
- [ ] **Pular hoje** (botão ou deslizar o cartão) → some, com **Desfazer**. Recarregar: quem foi contatada ou pulada não volta.
- [ ] "Minhas vendas de hoje" com total e até 3 vendas (depois do 5.2). Trocar de aba e voltar: atualiza.

### 5.2 Lançar venda (`+ Venda`)
- [ ] **Cliente antiga com 1 peça Miz em até 20 s:** Já é cliente → "ana" → Ana Paula Ribeiro → Sim → peça → cor → tamanho → Adicionar → Continuar → valor → PIX → Salvar.
  **Esperado:** cartão fixo com compras, tamanho e 2 cores; só cores ativas e a grade da peça (inclusive PP/P e M/G); sucesso "Venda de R$ X salva · faltam R$ Y para sua meta".
- [ ] Busca sem acento e por dígitos acha clientes de todas as vendedoras. Cliente da Paula → aviso "Cliente da Paula Ribeiro. Ao salvar a venda, ela passa a ser sua."; depois, a ficha mostra Júlia como responsável.
- [ ] Cliente nova (com aniversário) → vai para **Comprou** no kanban. WhatsApp já existente → "Esse número já é da [nome]. Usar ela?".
- [ ] Não sei + nome inexistente → "Não encontramos…" → **Cadastrar agora** com o nome preenchido (números → WhatsApp preenchido).
- [ ] Outra marca: cor livre com sugestões, PP a GG + Único. Lixeira remove. Botões ficam cinza sem item, valor ou pagamento.
- [ ] Voltar não apaga nada; Outra data até 7 dias; venda de 3 dias atrás não entra em "Minhas vendas de hoje".
- [ ] Rascunho: fechar a aba no meio → "Continuar a venda da [nome]?".
- [ ] **Sem conexão** (DevTools → Network → Offline): salvar → "Venda … guardada" e a faixa "1 venda aguardando envio"; voltar Online → "Venda enviada"; no banco, **uma** venda só.

### 5.3 Ficha, Clientes, Metas e Perfil
- [ ] Ficha: 4 números, preferências, histórico expansível, contatos e transferências, observações salvas ao sair do campo; Alice Nogueira com o **recado** no topo.
- [ ] Venda própria com menos de 24 h: **Editar valor e pagamento** e **Excluir** com motivo; venda antiga ou de outra pessoa: sem esses botões.
- [ ] Editar (WhatsApp de outra cliente → aviso) e Transferir para a Paula com recado (entrando como Paula: Follow-up "Transferida pela Júlia").
- [ ] Kanban no celular: abas com contador; **Mover** (ou pressionar o cartão) entre Novas, Em conversa e Sem interesse; filtro Sem interesse; busca; filtros VIP, Aniversário e Nova. Com `visibilidade_vendedora = 'proprias'` não aparece Minhas/Todas.
- [ ] Metas: "Faltam R$ X", barra, dias e R$ por dia, prêmio e prêmio extra; histórico de 6 meses; ranking só com `ranking_visivel` (sem valores das colegas).
- [ ] Perfil: trocar o nome, trocar a senha, Sair.

## 6. ADM (Prompt 4) — entrar como Mariana

### 6.1 Visão geral (`/adm`)
- [ ] Filtros Hoje · 7 dias · Este mês · Mês passado · Escolher datas e vendedora; todos os blocos mudam juntos e o filtro fica na URL.
- [ ] 8 indicadores (faturamento, vendas, ticket, peças, clientes novas, taxa de recompra, clientes ativas 90 dias, % Miz), cada um com "+X% vs. período anterior" (ou p.p. nos percentuais), sem seta colorida.
- [ ] Meta do mês: barra da loja (vendido, meta, falta, R$ por dia) e uma linha por vendedora, com selo quando o prêmio for conquistado.
- [ ] Gráficos: faturamento por dia (até 62 dias; mais que isso, por mês), vendas por vendedora (tocar filtra o painel), peças Miz, cores (com bolinha) e tamanhos. Nenhuma pizza; cores só da paleta.
- [ ] Perfil da cliente (tamanho, 3 cores, peça campeã, ticket, intervalo, aniversariantes do mês → abre Clientes filtrada).
- [ ] Saúde da base: tocar numa etapa → Clientes filtrada por ela.
- [ ] Loja sem vendas (a loja do 4.1): estado vazio com **Lançar venda** e **Equipe**.

### 6.2 Equipe (`/adm/equipe`)
- [ ] Lista com vendido no mês, % da meta, nº de vendas e último acesso.
- [ ] **+ Vendedora** → "Acesso criado" com Enviar pelo WhatsApp e Copiar; aviso de que a senha não aparece de novo.
- [ ] Página da vendedora: filtros de período; números (faturamento, vendas, ticket, clientes novas, peças Miz, atendidas, contatos de WhatsApp, conversão); meta do mês e histórico; últimas vendas; clientes dela em Hora da recompra e Sumidas.
- [ ] Editar nome; **Trocar WhatsApp** → nova mensagem de acesso; entrar com o número novo e a senha nova (troca obrigatória); o número antigo não entra mais.
- [ ] **Gerar nova senha** → acesso mostrado uma vez.
- [ ] **Desativar** exige escolher para quem vão as clientes → ela perde o acesso e as clientes passam (histórico de transferências com motivo desativação). **Reativar** → volta a entrar.

### 6.3 Configurações (`/adm/config`)
- [ ] Loja: nome, cidade, UF e WhatsApp salvam (toast) e o nome aparece na barra lateral.
- [ ] Mensagens: contador até 300, prévia ao vivo com "Ana Paula Ribeiro", **Restaurar texto padrão**; depois de salvar, o WhatsApp de Aniversário/Pós-venda em Hoje usa o texto novo.
- [ ] Prazos: ordem errada (ex.: Sumidas menor que Hora da recompra) → aviso e botão desativado; salvar → kanban e pastas mudam.
- [ ] Equipe: visibilidade (Júlia passa a ver Minhas/Todas) e ranking (aparece em Metas da vendedora).
- [ ] Conta: e-mail de recuperação e troca de senha.

### 6.4 Metas e prêmios (`/adm/metas`)
- [ ] Mês atual em destaque, setas de mês; referência "Mês passado · melhor mês".
- [ ] Meta da loja, **Dividir igualmente**, soma com aviso de diferença (não bloqueia), prêmio para todas ou escolhidas, condição %, prêmio extra.
- [ ] **Salvar rascunho** → a Júlia não vê; **Publicar** → a Júlia vê em Metas e na faixa de Hoje.
- [ ] Mês seguinte vazio: **Repetir o mês passado** preenche tudo.
- [ ] Acompanhamento (meta, vendido, %, falta, prêmio a caminho/conquistado) e meses anteriores só leitura.

### 6.5 Clientes (`/adm/clientes`)
- [ ] Tabela com contador; ordenar por cada coluna; páginas de 50.
- [ ] Filtros combinados (status, etapa, vendedora, aniversariantes do mês/7 dias, tamanho, cor, comprou Miz, sem comprar há mais de X dias, faixa de total gasto) e **Limpar filtros**.
- [ ] **Exportar** → CSV abre no Excel com acentos certos, separado por ";", com os filtros aplicados.
- [ ] Alternar para **Kanban** (todas as clientes) e voltar.
- [ ] Lote: selecionar 3 → **Trocar responsável** e **Mover para Sem interesse**.
- [ ] Ficha pela ADM: **Trocar responsável**; **Mesclar duplicada** (cadastre antes uma "Ana Paula R." com outro número; escolha nome e WhatsApp que ficam → as compras somam e a outra some); **Excluir**: cliente sem vendas some; cliente com vendas vira "Cliente removida", sai da busca, do kanban e das pastas, e as vendas continuam no faturamento.

### 6.6 Vendas (`/adm/vendas`)
- [ ] Lista com data, cliente, vendedora, itens, selo Miz, valor e pagamento; totais no rodapé (vendas, peças, faturamento).
- [ ] Filtros: período, vendedora, com/sem Miz, peça, cor, tamanho, pagamento, mostrar excluídas (excluídas aparecem mas não somam). **Exportar** CSV.
- [ ] Detalhe: editar valor, pagamento, data (qualquer data passada) e vendedora; adicionar peça (Miz ou outra marca), mudar quantidade, remover (a última não sai); excluir com motivo e **Restaurar**.
- [ ] Registro de alterações com quem, quando e "antes → depois".
- [ ] **+ Venda** da ADM: no passo 3 aparece **Vendedora** (padrão: ela mesma); escolher a Júlia → a venda conta na meta da Júlia e o sucesso volta para a Visão geral.
- [ ] **Modo vendedora** (Mais → Modo vendedora): o campo Vendedora some e a venda conta para a Mariana.

## 7. Celular e computador

- [ ] Celular (aparelho real ou DevTools 390 px): rodapé da vendedora (Hoje · Clientes · + Venda · Metas · Perfil) e da ADM (Visão geral · Vendas · + Venda · Clientes · Mais); "Salvar venda" preso acima do rodapé; folhas sobem de baixo; nada corta na horizontal; tabelas viram cartões (Clientes e Vendas da ADM).
- [ ] Computador (≥ 1200 px): barra lateral; tabela de Clientes e Vendas; kanban com 6 colunas e arrastar entre Novas e Em conversa; gráficos 2 por linha; folhas abrem como janela ou painel lateral.
- [ ] iPhone: campos não dão zoom ao tocar; área segura no rodapé.

## 8. Docker local

Já testado no container sem login: build com Node 22, rotas 200, `/saude` → `ok`, cache de 1 ano em `/assets`, `index.html` sem cache, sem `service_role` e sem a vitrine.

- [ ] Construir e rodar como em [DEPLOY-EASYPANEL.md](DEPLOY-EASYPANEL.md) → "Testar a imagem no computador".
- [ ] Incluir `http://localhost:8080` em `ALLOWED_ORIGINS` (Edge Functions → Secrets).
- [ ] Entrar como Mariana em `http://localhost:8080`, criar uma vendedora (Edge Function pelo navegador = CORS ok) e recarregar em `/adm/clientes` (sem 404).
- [ ] Tirar `localhost:8080` de `ALLOWED_ORIGINS` no fim.

---

Depois deste roteiro: [ANTES-DE-PUBLICAR.md](ANTES-DE-PUBLICAR.md).
