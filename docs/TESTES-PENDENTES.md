# Testes pendentes (dependem de rede)

Este container de desenvolvimento não acessa `ldlwdxgjiohuvionihhv.supabase.co` (só o conector do Supabase funciona). Tudo abaixo foi escrito e conferido no código, mas precisa rodar numa sessão com rede liberada para o Supabase. **Rodar na ordem**: cada item usa o anterior.

Marque `[x]` e anote o resultado ao lado de cada item.

## Preparação (terminal)

```bash
export SUPABASE_URL=https://ldlwdxgjiohuvionihhv.supabase.co
export ANON=<anon key do .env>
export FN=$SUPABASE_URL/functions/v1

# Entra com usuário + senha e devolve o token de acesso (access_token)
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

## 0. Aplicar a migration `mizloja_sem_imagens`

Não foi aplicada pelo conector (comando de apagar pede confirmação extra e a chamada expira).

1. Supabase → SQL Editor → colar `supabase/migrations-pendentes/mizloja_sem_imagens.sql` (uma linha: `drop table public.mizloja_peca_imagens;`) → Run.
2. Conferir: `select to_regclass('public.mizloja_peca_imagens');` → **null**. E `select count(*) from information_schema.tables where table_schema='public' and table_name not like 'mizloja_%';` → **28** (o app MIZ intacto).
3. Mover o arquivo para `supabase/migrations/<AAAAMMDDHHMMSS>_mizloja_sem_imagens.sql` (versão = data/hora da aplicação), regenerar `types/supabase.ts`, tirar a tabela de `docs/BANCO.md` e rodar os advisors.

**Esperado:** tabela some; nada mais muda; `npm run check` continua passando (o site não usa essa tabela).

## 1. Criar o Admin Miz (`mizloja-primeiro-admin`, uso único)

O repositório tem só a versão **desligada** (`CODIGO_USO_UNICO = ''` → sempre responde 410). O código de uso único **nunca** vai para o GitHub.

1. Gerar um código na hora: `openssl rand -hex 24` (48 caracteres).
2. Numa **cópia local, fora do git**, de `supabase/functions/mizloja-primeiro-admin/index.ts`, colocar o código em `CODIGO_USO_UNICO`.
3. Publicar essa cópia com o nome `mizloja-primeiro-admin` e **`verify_jwt = false`** (ainda não existe admin para ter token). Junto vão os arquivos de `_shared/` que ela importa.
4. Chamar uma vez:
   ```bash
   curl -s -X POST "$FN/mizloja-primeiro-admin" -H "apikey: $ANON" \
     -H "x-mizloja-codigo: <código>" -H "Content-Type: application/json" -d '{}'
   ```
5. **Na hora**, publicar de novo a versão desligada do repositório (mesmo nome). Apagar a cópia local.
6. Conferir: chamar de novo → **410** "Função desligada.".

**Esperado:**
- resposta `{ "usuario": "5531984810586", "senha": "<provisória>", "admin_id": "…", "vinculos_antigos_removidos": 1 }`;
- `mizloja_admins` com 1 linha ativa, `usuario = 5531984810586`, `precisa_trocar_senha = true`;
- a linha antiga sem usuário (conta `usemizdigital@gmail.com`) fora de `mizloja_admins`, **e a conta no Auth intacta**: `select email, raw_user_meta_data from auth.users where email = 'usemizdigital@gmail.com';` igual a antes; o `profile` dela no app MIZ igual a antes;
- `select count(*) from public.profiles where id = '<admin_id>';` → **0** (o gatilho `mizloja_auth_limpar_profile` apagou o profile que o app MIZ criaria);
- chamada com código errado → 403; segunda chamada com o código certo (antes de desligar) → 410 "Já existe Admin Miz".

Guardar a senha provisória: ela vai no relatório para a dona do projeto.

## 2. Testes das Edge Functions (permissões)

Preparar uma loja de teste pelo terminal (o item 5 repete pelo painel):

```bash
ADMIN=$(token 5531984810586 '<senha do admin, já trocada no item 4 ou a provisória>')
fn mizloja-criar-loja $ADMIN '{"loja":{"nome":"Loja Teste API","cnpj":"11222333000181","cidade":"Belo Horizonte","uf":"MG"},"dona":{"nome":"Dona Teste","whatsapp":"31911110001"}}'
# guarde loja_id e a senha da dona
DONA=$(token 5531911110001 '<senha>')
fn mizloja-criar-usuaria $DONA '{"nome":"Vendedora Teste","whatsapp":"31911110002"}'
VEND=$(token 5531911110002 '<senha>')
```

| # | Teste | Comando | Esperado |
| --- | --- | --- | --- |
| 2.1 | Sem token | `curl -s -w '%{http_code}' -X POST "$FN/mizloja-criar-usuaria" -H "apikey: $ANON" -d '{}'` | **401** (o próprio gateway recusa: `verify_jwt = true`) |
| 2.2 | Vendedora criando usuária em outra loja | `fn mizloja-criar-usuaria $VEND '{"loja_id":"<id de outra loja>","perfil":"vendedora","nome":"X","whatsapp":"31911110009"}'` | **403** "Só a dona da loja pode criar acessos." e nenhuma conta criada |
| 2.3 | ADM criando ADM | `fn mizloja-criar-usuaria $DONA '{"perfil":"adm","nome":"Outra Dona","whatsapp":"31911110008"}'` | **403** "A dona da loja cria só vendedoras." |
| 2.4 | Desativar com sessão aberta | 1) `fn mizloja-alterar-situacao $DONA '{"tipo":"usuaria","id":"<id da vendedora>","situacao":"inativa"}'` → 200; 2) com o **mesmo** `$VEND`: `curl -s "$SUPABASE_URL/rest/v1/mizloja_clientes?select=id" -H "apikey: $ANON" -H "Authorization: Bearer $VEND"`; 3) `token 5531911110002 '<senha>'`; 4) renovar a sessão com o refresh token dela | 2) **`[]`** (RLS: `mizloja_minha_loja()` nulo); 3) login recusado (**null**, "User is banned"); 4) renovação recusada. No site: a vendedora logada cai na tela de entrada com o aviso de acesso desativado em até 60 s ou ao voltar para a aba |

Extra (mesma lógica): desativar a **loja** pelo Admin Miz → dona e vendedora perdem o acesso; reativar → voltam (a reativação de usuária desbloqueia o login).

## 3. Buscas da service role

Já feitas neste container em 03/10/2026 (código, `dist` e histórico). Repetir depois do merge, na `main`:

```bash
grep -rnE "service_role|SERVICE_ROLE" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git .
npm run build && grep -rlE "service_role|SERVICE_ROLE" dist || echo "dist limpo"
git log --all -p | grep -nE "^\+.*(service_role|SERVICE_ROLE)"
git log --all -p | grep -c "eyJhbGciOi"   # chaves JWT coladas no código
```

**Esperado:** no código e no histórico, só `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` em `supabase/functions/_shared/supabase.ts` e os `grant … to service_role` das migrations; `dist` limpo; **0** chaves JWT. No site publicado, abrir o DevTools → Sources e procurar `service_role`: nada.

## 4. Login e troca de senha

1. `npm run dev`, abrir `http://localhost:5173`.
2. Entrar com `5531984810586` (ou `(31) 98481-0586`) + senha provisória.
   **Esperado:** vai direto para **Trocar senha** (não deixa abrir outra página, nem digitando a URL).
3. Testar erros: senha com menos de 6 → aviso; confirmação diferente → aviso; senha igual à provisória → "A nova senha precisa ser diferente da senha provisória."
4. Trocar a senha. **Esperado:** cai em `/miz/lojas`; `precisa_trocar_senha = false` e `ultimo_acesso_em` preenchido em `mizloja_admins`.
5. Sair e entrar com a senha nova → `/miz/lojas`. Senha errada → "Usuário ou senha incorretos" (sem dizer qual dos dois).
6. "Esqueci a senha" → folha com o botão do WhatsApp da Miz (número provisório por enquanto).
7. Repetir com a dona e a vendedora do item 2: dona vai para `/adm`, vendedora para `/hoje`; a dona, na troca de senha, também informa o e-mail.

## 5. Loja de teste pelo painel

1. `/miz/lojas` → **+ Loja**: nome, CNPJ válido (ex.: `11.444.777/0001-61`), cidade, UF, dona (nome + WhatsApp).
   **Esperado:** tela "Acesso criado" com usuário e senha, botões **Enviar pelo WhatsApp** (mensagem com o link `APP_URL/entrar`) e **Copiar**; a senha não aparece de novo depois de fechar.
2. CNPJ inválido → "Confira o CNPJ."; CNPJ repetido → "Já existe uma loja com esse CNPJ."; WhatsApp já em uso → "Esse WhatsApp já tem acesso ao MIZ Loja.", nada criado.
3. Abrir a loja: editar nome/cidade (salva), **Gerar nova senha** da dona (nova senha uma vez; a dona volta a ter troca obrigatória).
4. **Desativar a loja** → confirmação → dona logada perde o acesso; na lista, selo "Inativa". **Reativar** → volta.
5. Busca da lista por nome, cidade e CNPJ (com e sem acento/pontuação).

## 6. Catálogo

1. `/miz/catalogo` → **+ Peça**: referência, nome, categoria, preço, **2 cores** (nome + hex) e **3 tamanhos** (ex.: P, M, G).
   **Esperado:** peça aparece na lista com as bolinhas das 2 cores e "P · M · G".
2. Editar: **desativar uma cor** → salva; a cor some das opções de venda nova (Lançar venda, etapa 4), mas continua nas vendas antigas.
3. Tentar apagar uma peça **já vendida** (ex.: uma usada pela Loja Demonstração depois do item 7) → aviso "Essa peça já foi vendida. Desative em vez de apagar." (o mesmo vale para apagar uma cor já vendida); peça nunca vendida → apaga.
4. Busca por nome e referência; filtro Ativas / Inativas / Todas.

## 7. Loja Demonstração

Seguir [DEMO.md](DEMO.md): publicar `mizloja-seed-demo` (`verify_jwt = true`), chamar `{"acao":"carregar"}` com o token do Admin Miz, rodar `supabase/seed-demo/dados.sql` e depois `verificar.sql`.

**Esperado:**
- a resposta traz as 3 contas (Mariana Souza ADM `5531900001001`, Júlia Lima `5531900001002`, Paula Ribeiro `5531900001003`) com senhas de 10 caracteres — **guardar para o relatório**;
- `verificar.sql` igual à tabela de [DEMO.md](DEMO.md) (40 clientes, ~117 vendas, kanban com as 7 etapas, 6 status, 2 aniversários na semana, 1 transferência, meta publicada de R$ 30000);
- entrar como Júlia e como Mariana: sem troca de senha obrigatória;
- outra loja (a do item 5) **não vê nada** da demonstração.

Depois de mostrar: `{"acao":"remover"}` e remover a função (ou deixar enquanto a demonstração for útil).

## 8. Docker local

A imagem já foi construída e testada neste container (sem login real): build OK com Node 22, rotas da SPA → 200, `/saude` → `ok`, `HEALTHCHECK` saudável, `/assets` com cache de 1 ano e gzip, `index.html` sem cache, arquivo inexistente em `/assets` → 404, sem `service_role` e sem a vitrine no site da imagem.

Falta, com rede:
1. Construir e rodar como em [DEPLOY-EASYPANEL.md](DEPLOY-EASYPANEL.md) → "Testar a imagem no computador".
2. Incluir `http://localhost:8080` em `ALLOWED_ORIGINS` (Edge Functions → Secrets).
3. Abrir `http://localhost:8080`, entrar como Admin Miz, criar uma loja (Edge Function pelo navegador = CORS OK), recarregar a página em `/miz/lojas/<id>` (não pode dar 404).

**Esperado:** tudo igual ao `npm run dev`. Depois, tirar `localhost:8080` de `ALLOWED_ORIGINS`.

---

# Prompt 3 · Painel da vendedora

Pré-requisitos: itens 1, 4 e 7 acima (Admin Miz criado e **Loja Demonstração carregada**). Entrar no celular (ou no DevTools em modo celular, 390 px) como **Júlia Lima** (`5531900001002`) e, no fim, repetir o essencial no computador (≥ 1200 px). As funções do banco já foram testadas pelo conector (transações desfeitas); aqui é o teste das telas.

## P3.1 Hoje (`/hoje`, abre sozinha depois do login)
1. **Esperado:** "Bom dia/Boa tarde/Boa noite, Júlia" + data por extenso; faixa da meta com barra, "Vendido R$ X · Faltam R$ Y" e "Faltam R$ Z para o seu prêmio" (meta da demonstração: R$ 12.000, prêmio a 100%).
2. Tocar na faixa → abre `/metas`. Voltar.
3. Pastas Follow-up · Pós-venda · Aniversário com contadores (demonstração: ~11 · 1 · 1). A primeira pasta com gente já vem aberta. Tocar em outra pasta troca a lista. Pasta com 0 aparece apagada e não abre.
4. Cartão: nome, motivo ("Transferida pela Paula", "Nova, ainda sem conversa", "40 dias sem comprar"…) e última compra.
5. **Aniversário → WhatsApp:** abre o wa.me com "Feliz aniversário, [primeiro nome]! … [Loja Demonstração]…". O cartão some na hora; o contador cai 1. Na ficha dela, a linha do tempo mostra "WhatsApp aberto por Júlia (Aniversário)".
6. **Pós-venda → WhatsApp:** mesma coisa com a mensagem de pós-venda. **Follow-up → WhatsApp:** abre a conversa sem texto.
7. **Pular hoje** (botão): o cartão some, aviso "… pulada até amanhã" com **Desfazer** → desfazer traz o cartão de volta. **Deslizar** um cartão para o lado (celular) faz o mesmo.
8. Recarregar a página: quem foi contatada ou pulada não volta.
9. "Minhas vendas de hoje": total e até 3 vendas (depois do P3.2). Tocar numa venda abre a ficha da cliente.
10. Trocar de aba do navegador e voltar: a tela atualiza sozinha.
11. Estado vazio (opcional: entrar com uma vendedora sem clientes): "Ninguém para chamar agora…" com o link **Ver Hora da recompra** → `/clientes?coluna=recompra`.

## P3.2 Lançar venda (`+ Venda` no rodapé)
1. **Cliente antiga, 1 peça Miz (meta: até 20 s e 8 toques):** Já é cliente → digitar "ana" → tocar em Ana Paula Ribeiro → Sim → tocar numa peça → cor → tamanho → Adicionar peça → Continuar → valor → PIX → Salvar venda.
   **Esperado:** cartão fixo no topo (nome, nº de compras, tamanho e 2 cores com bolinha); só cores **ativas** da peça e a grade dela (inclusive PP/P ou M/G); tela de sucesso "Venda de R$ X salva · faltam R$ Y para sua meta" com Abrir WhatsApp, Nova venda e Ir para Hoje.
2. Busca: a partir de 2 letras, sem acento ("julia" acha "Júlia"), por dígitos do WhatsApp, e acha clientes **de todas as vendedoras** (resultado mostra a vendedora).
3. **Cliente de outra vendedora:** escolher uma cliente da Paula → aviso "Cliente da Paula Ribeiro. Ao salvar a venda, ela passa a ser sua." Depois de salvar, a ficha mostra Júlia como responsável e a linha do tempo "Passou para Júlia pela venda".
4. **Cliente nova:** Cliente nova → nome, WhatsApp e aniversário (dia/mês) → Continuar → … → Salvar. Ela aparece no kanban em **Comprou**.
5. **Duplicidade:** Cliente nova com o WhatsApp de uma cliente existente → ao sair do campo: "Esse número já é da [nome]. Usar ela?" → **Usar** leva para o passo 2 com ela; **Corrigir número** limpa o campo.
6. **Não sei** com um nome que não existe ("Fernanda Teste") → "Não encontramos…" → **Cadastrar agora** abre o cadastro com o nome preenchido; com números ("98765") preenche o WhatsApp.
7. **Outra marca:** Não → cor livre (as cores já usadas aparecem como sugestão), tamanho PP a GG + Único, quantidade. Com peça Miz, o link "Tem peça de outra marca também?" abre o mesmo bloco. Lixeira remove a linha.
8. **Botões desativados:** Continuar (passo 2) sem item e Salvar venda sem valor ou sem pagamento ficam cinza, sem mensagem vermelha.
9. **Voltar** em qualquer passo e avançar de novo: nada do que foi preenchido se perde. "Trocar" no cartão volta ao passo 1.
10. **Data:** Outra data → lista de ontem até 7 dias atrás. Salvar com 3 dias atrás → a venda aparece na ficha com essa data e **não** entra em "Minhas vendas de hoje".
11. **Rascunho:** começar uma venda (cliente + 1 peça), fechar a aba, abrir de novo `+ Venda` → "Continuar a venda da [nome]?" → Continuar restaura tudo; Começar outra limpa.
12. **Sem conexão:** DevTools → Network → Offline. Lançar uma venda → tela "Venda de R$ X guardada" e, no topo das páginas, "1 venda aguardando envio". Voltar para Online → em segundos aparece "Venda enviada" e a faixa some. Conferir no banco que existe **uma** venda só (sem duplicar) — repetir com Offline → Online várias vezes.
13. **Erro do banco na fila (opcional):** com Offline, lançar venda com uma peça; pelo Admin Miz desativar a cor dessa peça; voltar Online → a faixa mostra "Venda da [nome] … não foi aceita: [motivo]" com **Descartar**.
14. **Nova venda pela ficha:** na ficha de uma cliente → Nova venda → abre direto no passo 2 com ela no cartão.
15. Sucesso → **Abrir WhatsApp da cliente** abre a conversa sem texto e registra contato sem pasta (linha do tempo da ficha).

## P3.3 Ficha da cliente (`/clientes/:id`)
1. Cabeçalho: selo de status, aniversário ("6 de outubro"), responsável; botões WhatsApp, Nova venda, Transferir (só nas clientes dela; a ADM vê sempre) e Editar.
2. Alice Nogueira (demonstração): **recado da transferência** em destaque no topo.
3. 4 números: compras, total gasto, ticket médio, "compra a cada X dias" (só a partir de 2 compras) e "Última compra há N dias".
4. Preferências: tamanho, 3 cores com bolinha, peças Miz com quantas vezes.
5. Histórico: da mais recente para a mais antiga; tocar expande os itens.
6. **Venda própria com menos de 24 h** (a do P3.2): **Editar valor e pagamento** → salva e os números da ficha/meta mudam; **Excluir** exige motivo → a venda some do histórico, da meta e de "Minhas vendas de hoje". Venda de outra pessoa ou com mais de 24 h: sem esses botões.
7. Linha do tempo: "WhatsApp aberto por Júlia · data", transferências com recado.
8. Observações: escrever e sair do campo → "Observação salva"; recarregar mantém.
9. **Editar:** nome, WhatsApp (número de outra cliente → "Esse número já é da …"), aniversário, etapa (sem compra: Novas / Em conversa / Sem interesse; com compra: Automática / Sem interesse).
10. **Transferir:** escolher Paula + recado → aviso "… agora é da Paula"; entrando como Paula, a cliente aparece no Follow-up com "Transferida pela Júlia" e o recado no topo da ficha.

## P3.4 Clientes · kanban (`/clientes`)
1. Celular: abas roláveis com contador (Novas, Em conversa, Comprou, Ativa, Hora da recompra, Sumidas); uma coluna por vez.
2. Cartão: nome, selo (VIP / Aniversário / Nova…), "Última compra há N dias · R$ X", WhatsApp. Tocar abre a ficha.
3. **Pressionar e segurar** um cartão (ou o botão **Mover**) → "Mover [nome]" com as opções e a explicação das colunas automáticas. Mover de Em conversa para Novas funciona (mesmo já contatada) e o contador muda na hora.
4. Cliente com compra: Mover só oferece **Sem interesse**; em Sem interesse, **Voltar para o quadro**.
5. Filtro **Sem interesse** mostra só as arquivadas (demonstração: 2); elas não aparecem em Hoje.
6. Busca por nome (sem acento) ou dígitos; filtros VIP, Aniversário (próximos 7 dias) e Nova.
7. **Minhas / Todas:** com `visibilidade_vendedora = 'proprias'` (padrão) o controle não aparece e só vêm as dela; mudar no banco para `'todas'` (`update mizloja_config set visibilidade_vendedora = 'todas' where loja_id = …`) → o controle aparece e "Todas" mostra as da Paula também.
8. Computador (≥ 1200 px): 6 colunas lado a lado; **arrastar** um cartão entre Novas e Em conversa move de verdade; colunas automáticas não aceitam soltar.
9. Coluna com mais de 50 cartões: botão "Mostrar mais (N)".

## P3.5 Metas (`/metas`)
1. **Meta individual com prêmio** (Júlia na demonstração): "FALTAM R$ X" grande, barra "Vendido R$ … de R$ 12.000 · %", "Faltam N dias · R$ Y por dia", cartão do prêmio ("Bateu 100% da meta") e do extra ("Bateu 120% … · faltam R$ Z"). Ao bater (lançar vendas até passar), o cartão muda para "Conquistado", barra cheia com "Meta batida", sem confete.
2. **Sem prêmio:** no banco, `update mizloja_metas set premio_descricao = null, premio_extra_descricao = null …` → só número, barra e dias.
3. **Só meta da loja:** apagar o valor individual (`update mizloja_metas_vendedoras set valor = null …`) → "A loja vendeu R$ X de R$ 30.000" e "Você vendeu R$ Y este mês".
4. **Sem meta:** voltar a meta para `rascunho` → "Vendido no mês R$ X · N vendas".
5. Em todos: Vendas, Ticket médio e Clientes novas; "Meses anteriores" com 6 meses (vendido, % da meta, Prêmio ganho / Sem prêmio).
6. **Ranking:** `update mizloja_config set ranking_visivel = true …` → aparece a lista com posição e nomes (a própria com "Você"), **sem valores das colegas**. Com `false`, some.

## P3.6 Perfil (`/perfil`)
1. Nome editável → "Salvar nome" → "Nome atualizado"; o nome novo aparece na barra lateral e na saudação de Hoje.
2. WhatsApp, usuário e loja só leitura.
3. Trocar senha: menos de 6 → aviso; confirmação diferente → aviso; certo → "Senha trocada". Sair e entrar com a senha nova.
4. **Sair** volta para `/entrar`.
5. **ADM no modo vendedora:** entrar como Mariana (ADM), ir para o modo vendedora → em Perfil aparece **Voltar ao painel** (leva a `/adm`). As vendas lançadas por ela contam para ela (aparecem em "Minhas vendas de hoje" dela, não da Júlia).

## P3.7 Computador (≥ 1200 px)
Repetir rapidamente P3.1, P3.2 (1 venda) e P3.4 (arrastar): barra lateral à esquerda, "Salvar venda" preso no pé da tela ao lado da barra lateral, folhas abrindo como janela ou painel lateral.
