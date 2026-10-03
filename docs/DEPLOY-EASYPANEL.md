# Publicar o site no Easypanel

O site é estático (React + Vite). A imagem Docker faz o build com Node 22 e serve os arquivos com nginx na porta 80. O banco e as Edge Functions continuam no Supabase; o Easypanel hospeda só o site.

Arquivos: `Dockerfile`, `nginx.conf`, `.dockerignore`.

## Antes de publicar (obrigatório)

- [ ] **Trocar o WhatsApp de suporte provisório.** Hoje é `5531999999999` (número de mentira). Pegar com a Miz o número oficial (só dígitos, com 55) e usá-lo no build arg `VITE_WHATSAPP_SUPORTE_MIZ`. Sem isso, o botão "Falar com a Miz" da tela de entrada abre um número que não existe.
- [ ] Ter o Admin Miz criado e testado ([TESTES-PENDENTES.md](TESTES-PENDENTES.md), itens 1 e 4).

## 1. Criar o serviço

1. No Easypanel, abrir o projeto → **+ Service** → **App**.
2. **Source:** GitHub, repositório `usemizdevelopers/comercial-miz`, branch `main` (depois do merge).
3. **Build:** tipo **Dockerfile**, caminho `Dockerfile`.

## 2. Build args

Em **Build → Build Arguments** (não em "Environment": o Vite grava esses valores no JavaScript durante o build):

| Nome | Valor |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://ldlwdxgjiohuvionihhv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | a chave **anon / publishable** (Supabase → Project Settings → API) |
| `VITE_WHATSAPP_SUPORTE_MIZ` | o número oficial de suporte da Miz |

- O build para com erro se faltar qualquer um dos três.
- A chave anon é pública por natureza (vai para o navegador de qualquer pessoa); a proteção dos dados é o RLS. O Docker mostra um aviso genérico de "segredo em ARG", que pode ser ignorado **só para a anon key**.
- **Nunca** colocar a service role key aqui nem em nenhuma variável do site.

## 3. Porta, domínio e HTTPS

1. **Domains → Add Domain:** o domínio do site (ex.: `loja.usemiz.app`), **porta 80**.
2. Ligar **HTTPS** (o Easypanel emite o certificado Let's Encrypt sozinho). No DNS, apontar o domínio (registro A) para o IP do servidor do Easypanel.
3. Verificação de saúde: `GET /saude` responde `ok` (já está no `nginx.conf` e no `HEALTHCHECK` da imagem).
4. **Deploy.**

## 4. Depois do primeiro deploy (Supabase)

Com o endereço final em mãos (ex.: `https://loja.usemiz.app`):

1. **Edge Functions → Secrets** (Supabase → Edge Functions → Secrets), criar ou ajustar:
   | Nome | Valor | Para quê |
   | --- | --- | --- |
   | `APP_URL` | `https://loja.usemiz.app` | link "Entre em …/entrar" da mensagem de acesso enviada pelo WhatsApp |
   | `ALLOWED_ORIGINS` | `https://loja.usemiz.app` (para manter o teste local: `https://loja.usemiz.app,http://localhost:5173`) | CORS: só esse endereço consegue chamar as funções pelo navegador |

   As funções leem os secrets a cada chamada; não precisa republicar.
2. **Authentication → URL Configuration → Site URL:** `https://loja.usemiz.app`. Em **Redirect URLs**, incluir o mesmo endereço.
3. Testar no celular: entrar como Admin Miz, criar uma loja de teste, abrir o link da mensagem de acesso.

## O que a imagem faz

- Rotas do React Router (`/entrar`, `/miz/lojas`, `/hoje` …) caem no `index.html` (sem 404 ao recarregar a página).
- `/assets/*` (arquivos com hash no nome): cache de 1 ano. `index.html`: sem cache, então a versão nova chega assim que o deploy termina.
- gzip ligado; cabeçalhos `X-Content-Type-Options`, `X-Frame-Options: DENY` e `Referrer-Policy`.
- A vitrine `/dev/componentes` não entra no build de produção.

## Testar a imagem no computador

```bash
docker build -t mizloja-site \
  --build-arg VITE_SUPABASE_URL=https://ldlwdxgjiohuvionihhv.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=<anon key> \
  --build-arg VITE_WHATSAPP_SUPORTE_MIZ=<número> .
docker run --rm -p 8080:80 mizloja-site
# abrir http://localhost:8080
```

Para o login funcionar a partir de `http://localhost:8080`, incluir esse endereço em `ALLOWED_ORIGINS` (só durante o teste).

## Atualizar

Cada push na `main` → **Deploy** no Easypanel (ou ligar o deploy automático pelo webhook do GitHub). Trocar um build arg exige novo deploy.
