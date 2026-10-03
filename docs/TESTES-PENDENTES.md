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
