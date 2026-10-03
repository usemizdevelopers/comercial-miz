# MIZ Loja · regras do projeto

## O produto
Micro SaaS web (acesso por link, sem instalação) para lojistas que compram da Miz, marca de moda feminina do Grupo Mark. A lojista organiza clientes, vendas, equipe e metas.

- **Painel ADM (dona da loja):** cria acessos das vendedoras, define metas e prêmios, vê desempenho da equipe e da loja, vê todas as clientes e vendas, configura mensagens e prazos.
- **Painel da vendedora (celular):** lança vendas em até 20 segundos, vê quem chamar hoje em pastas (Follow-up, Pós-venda, Aniversário), abre o WhatsApp da cliente em 1 toque, move clientes no kanban, vê quanto falta para a meta e o prêmio.
- **Admin Miz (time da Miz):** cria as contas das lojas e da dona e mantém o catálogo de peças.

Toda venda registra se teve peça Miz e quais (peça, cor, tamanho, quantidade). Todas as lojas usam o mesmo banco; o isolamento entre lojas é feito por `loja_id` + Row Level Security.

Documentos de referência:
- `docs/especificacao.md` — especificação do sistema v1 (ler antes de planejar qualquer página).
- `docs/design-system.md` — design system v1 (cores, tipografia, componentes, voz).
- `docs/BANCO.md` — banco de dados completo (tabelas, funções, RLS, diagrama).

## Etapas
1. Banco de dados ✅ · 2. Fundação do app + painel Admin Miz (lojas, catálogo, admins), Loja Demonstração e deploy ✅ (testes com rede pendentes: `docs/TESTES-PENDENTES.md`) · 3. ADM: Equipe e Configurações · 4. Clientes (kanban e ficha) e Lançar venda · 5. Hoje e Metas (vendedora e ADM) · 6. ADM: Visão geral e Vendas · depois: revisão final.
Pendências e decisões em aberto: `docs/PENDENCIAS.md`.

## Independência do app MIZ (REGRA ABSOLUTA)
O projeto Supabase `usemizdigitalAPP` (id `ldlwdxgjiohuvionihhv`, sa-east-1) é **compartilhado** com outro produto, o app MIZ. As 28 tabelas sem prefixo do schema `public` (profiles, pecas, peca_cores, pedidos, cursos etc.) são **de outro projeto**.

- **Nunca** criar, alterar, apagar ou renomear tabela, coluna, função, gatilho, política, índice ou permissão que não comece com `mizloja_`.
- **Nunca** criar chave estrangeira, view ou função do MIZ Loja que dependa de tabela do app MIZ. O MIZ Loja tem as próprias tabelas para tudo: lojas, usuárias, Admin Miz (`mizloja_admins`) e catálogo (`mizloja_pecas` e afins).
- O catálogo foi **copiado** de `public.pecas` uma vez (carga inicial). `origem_id` guarda o id de lá só como referência, sem vínculo. Ler o app MIZ é permitido apenas para cópias/sincronizações explícitas e aprovadas.
- Único ponto de contato inevitável: o Auth (`auth.users`) é um só por projeto. O gatilho do app MIZ (`on_auth_user_created`) cria um `profile` para todo usuário novo; o gatilho próprio `mizloja_auth_limpar_profile` (adiado para o fim da transação) apaga esse profile quando `raw_user_meta_data->>'app' = 'mizloja'`. O gatilho do app MIZ não foi alterado.

## Convenções
- Todo objeto do MIZ Loja começa com `mizloja_` (tabelas, views, funções, gatilhos, políticas, índices). Tabelas no plural, minúsculas, sem acento, snake_case.
- Schemas: objetos em `public`; as funções de apoio do RLS ficam em `mizloja_interno` (não exposto pela API).
- Toda tabela de dado de loja tem `loja_id uuid not null` e RLS ligado. Nenhuma tabela `mizloja_` é acessível por `anon`.
- Chaves `uuid` com `gen_random_uuid()`. Datas em `timestamptz`. Valores em `numeric(12,2)`.
- **Fuso:** "hoje" sempre em `America/Sao_Paulo` — usar `mizloja_hoje()` e `mizloja_data_local(ts)`, nunca `current_date`.
- Telefones só com dígitos e DDI 55 (`mizloja_normalizar_whatsapp`).
- Funções `SECURITY DEFINER` sempre com `set search_path = ''` e nomes totalmente qualificados. Views com `security_invoker = true`.
- Mudança de estrutura: sempre por migration (`apply_migration`), uma por assunto, nome `mizloja_<assunto>`. Salvar o mesmo SQL em `supabase/migrations/<versão>_<nome>.sql`. `execute_sql` só para consultas e testes.
- Testes de banco: dentro de um bloco `do $$ ... raise exception 'RELATORIO%' ... $$` (rollback garantido), simulando usuárias com `set local role authenticated` + `request.jwt.claims`. Não usar `DELETE` nos testes via MCP (a ferramenta pede confirmação e trava).
- Depois de mudar o banco: rodar os advisors de segurança e desempenho, regenerar `types/supabase.ts` e **atualizar `docs/BANCO.md`**.

## Papéis e login
- **Admin Miz:** linha ativa em `mizloja_admins` (id = `auth.users.id`). Não usa `profiles` do app MIZ.
- **ADM (dona) e vendedora:** linhas em `mizloja_usuarias` (id = `auth.users.id`), uma loja por usuária.
- **Login:** usuário (WhatsApp só com dígitos, ex.: `5531999998888`) + senha. No Auth, e-mail técnico `<usuario>@mizloja.usemiz.app` (nunca recebe e-mail) e `raw_user_meta_data.app = 'mizloja'`. Contas criadas por Edge Function com service role (etapa 2). Primeiro acesso: `precisa_trocar_senha = true`.
- Usuária inativa ou loja inativa perde todo o acesso imediatamente (`mizloja_minha_loja()` devolve nulo).

## Funções do banco
| Função | Para que serve |
| --- | --- |
| `mizloja_normalizar_whatsapp(text)` | Só dígitos; com 10–11 dígitos prefixa 55 |
| `mizloja_hoje()` / `mizloja_data_local(ts)` | Data de hoje / de um instante em São Paulo |
| `mizloja_sem_acento(text)` | Minúsculas, sem acento (busca) |
| `mizloja_proximo_aniversario(dia, mes, ref)` | Próximo aniversário (virada de ano e 29/02) |
| `mizloja_interno.mizloja_eh_admin_miz()` | Pessoa logada é Admin Miz |
| `mizloja_interno.mizloja_minha_loja()` | Loja da usuária ativa logada |
| `mizloja_interno.mizloja_meu_perfil()` | `adm` ou `vendedora` |
| `mizloja_interno.mizloja_eh_adm(loja)` | Usuária logada é ADM daquela loja |
| `mizloja_recalcular_cliente(cliente)` | Recalcula compras, total, ticket, intervalo, tamanho, cores, peças (interna) |
| `mizloja_lancar_venda(...)` | Grava venda + itens numa transação (Lançar venda) |
| `mizloja_buscar_clientes(termo, limite)` | Busca na base inteira da loja por nome ou dígitos |
| `mizloja_transferir_cliente(cliente, para, recado)` | Troca a responsável e registra |
| `mizloja_transferir_carteira(de, para)` | ADM: passa todas as clientes (desativação) |
| `mizloja_registrar_acesso()` | Grava último acesso |
| `mizloja_senha_trocada()` | Marca senha provisória trocada |
| `mizloja_tarefas_hoje()` | Pastas da tela Hoje com motivo pronto |
| view `mizloja_v_clientes` | Clientes + status + etapa do kanban + aniversário |

Detalhes, parâmetros e regras em `docs/BANCO.md`.

## Site (frontend)
Stack: React 18 + Vite + TypeScript strict · Tailwind (tema = tokens) · React Router · TanStack Query · supabase-js v2 (tipado com `types/supabase.ts`) · react-hook-form + zod · @phosphor-icons/react (peso **light**) · date-fns ptBR · @fontsource/quicksand · Vitest.

Versões fixas do lint (sem `^`): `eslint` 9.39.5, `@eslint/js` 9.39.5, `typescript-eslint` 8.71.0, `eslint-plugin-react-hooks` 5.2.0, `eslint-plugin-react-refresh` 0.4.26. Motivo: `@eslint/js` 10 exige ESLint 10, mas `eslint-plugin-react-hooks` 5 só aceita até ESLint 9; sem fixar, o `npm install` quebra com conflito de dependências. Para atualizar, suba o grupo inteiro junto e rode `npm run check`. O lint roda com `--max-warnings 0` e nenhuma regra foi desligada.

Comandos: `npm run dev` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run build` · `npm run check` (os quatro juntos, rodar antes de todo commit).

Variáveis (`.env`, nunca commitado; modelo em `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WHATSAPP_SUPORTE_MIZ`. **Nunca** usar a service role key no site.

### Pastas
```
src/app/              rotas, providers, guardas
src/layouts/          layouts dos 3 painéis
src/components/ui/    design system (importar de '@/components/ui')
src/components/shared/ peças compostas reutilizáveis
src/features/<assunto>/ admin-miz, auth, equipe, vendas, clientes, metas, hoje, config, dashboard, dev
src/lib/              supabase, whatsapp, formatadores, cnpj, erros, cn, acesso, funcoes, cores
src/hooks/            hooks genéricos
src/styles/           tokens.css (todos os tokens) e globals.css
```

### Regras do design system no código
- Cores, raios, espaços, fontes, sombras e durações vêm **só** do tema (`tailwind.config.ts` ← `src/styles/tokens.css`). As paletas e escalas padrão do Tailwind foram removidas: `bg-blue-500`, `text-sm`, `rounded-xl`, `p-7` não existem. Não usar valores arbitrários (`[13px]`, `#fff`); se faltar algo, criar token.
- Única exceção: a bolinha de cor da peça usa o hex do catálogo (`BolinhaCor`).
- Classes de texto: `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-body-sm`, `text-label`, `text-overline` (+ `uppercase`), `text-caption`. Mudam de tamanho sozinhas no computador (≥ 1200 px).
- Breakpoints: `md` = 768 (tablet), `lg` = 1200 (computador). Celular primeiro.
- Utilitários próprios: `foco` (anel de foco), `alvo-48` (área de toque mínima), `sublinhado`, `numeros` (tabular), `area-segura-baixo/topo`, `acima-do-rodape`.
- Ícones Phosphor sempre `weight="light"`, tamanhos `h-icone` (20) ou `h-icone-nav` (24).

### Componentes (`src/components/ui`)
Vitrine viva em `/dev/componentes` (só em `npm run dev`).
| Componente | Uso |
| --- | --- |
| `Button` | `variante`: primario, secundario, texto, whatsapp, destrutivo · `tamanho`: grande 56, medio 48, pequeno 36 · `carregando`, `icone`, `larguraTotal` |
| `FabVenda` | "+ Venda" do rodapé |
| `TextField`, `PasswordField` | campo base (forwardRef, funciona com `register`) |
| `PhoneField` | máscara (31) 99999-9999 — guardar com `normalizarWhatsapp` |
| `MoneyField` | R$ em reais (`number \| null`), digitação estilo caixa |
| `SearchField`, `TextArea` (3→6 linhas), `DateParts` + `lerDataPartes` | |
| `ChipTamanho`, `ChipCor`, `ChipPagamento`, `ChipFiltro`, `ChipGroup`, `BolinhaCor` | |
| `ChoiceCard`, `QuantityStepper`, `StepIndicator` | |
| `Card`, `Overline`, `ValorDestaque`, `CardKpi`, `CardPasta`, `CardMeta`, `CardPremio`, `CardPeca` (sem foto), `ItemLinha`, `CardCliente`, `CardVenda` | |
| `StatusBadge` (6 status), `Selo`, `ProgressBar`, `Skeleton`, `SkeletonCard`, `EmptyState` | |
| `BottomSheet` (`computador`: central ou lateral), `ConfirmSheet` | |
| `ToastProvider` + `useToast().mostrar(texto, acao?)` | |
| `Tabs`, `SegmentedControl`, `TopBar`, `BottomNav`, `Sidebar`, `Logo` | |
| `SelectField` | lista de opções nativa com o visual dos campos |

### Utilitários (`src/lib`, com testes)
`normalizarWhatsapp`, `mascararWhatsapp`, `formatarWhatsapp`, `whatsappValido`, `linkWhatsapp`, `montarMensagem`, `primeiroNome` · `formatarMoeda` (`{destaque}`), `formatarValor`, `formatarData`, `formatarDataHora`, `formatarDiaPorExtenso`, `dataRelativa`, `haDias` (sempre no fuso de São Paulo) · `validarCnpj`, `mascararCnpj` · `mensagemDeErro` (traduz erros do Supabase para a voz da seção 11).

### Rotas (`src/app/rotas.tsx`)
Páginas carregadas sob demanda (`lazy`). As que ainda não existem usam `PaginaEmConstrucao` ("Em construção · Etapa X"): cada etapa troca o elemento pela página real.
| Rota | Quem | Página / etapa |
| --- | --- | --- |
| `/entrar`, `/trocar-senha` | deslogada / troca obrigatória | `features/auth` |
| `/hoje` · `/metas` | vendedora (e ADM em modo vendedora) | etapa 5 |
| `/clientes`, `/clientes/:id`, `/venda/nova` | vendedora | etapa 4 |
| `/perfil` | vendedora | provisória com "Sair" |
| `/adm` · `/adm/vendas` | ADM | etapa 6 |
| `/adm/clientes` | ADM | etapa 4 |
| `/adm/equipe` · `/adm/config` | ADM | etapa 3 |
| `/adm/metas` | ADM | etapa 5 |
| `/miz/lojas`, `/miz/lojas/:id`, `/miz/catalogo`, `/miz/catalogo/:id` (`nova` = peça nova), `/miz/admins` | Admin Miz | prontas (`features/admin-miz`) |
| `/dev/componentes` | só em `npm run dev` | vitrine |

Guardas (`src/app/guardas.tsx`): `Protegida papeis={[...]}`, `SoDeslogada`, `SoTrocaDeSenha`, `RedirecionarInicio` (manda cada papel para `paginaInicial`: Admin Miz → `/miz/lojas`, ADM → `/adm`, vendedora → `/hoje`). Com `precisa_trocar_senha`, toda rota leva a `/trocar-senha`.

### Sessão (`src/app/sessao`)
`useSessao()` → `estado`, `usuaria` (`id`, `papel`, `nome`, `lojaId`, `precisaTrocarSenha`…), `ehAdminMiz`, `modoVendedora`, `entrar(usuario, senha)`, `sair()`, `recarregar()`, `alternarModoVendedora(ativo)`.
- `entrar` monta o e-mail técnico (`emailTecnico`), faz `signInWithPassword` e chama `mizloja_registrar_acesso`.
- O papel vem de `mizloja_admins` ou `mizloja_usuarias` (+ situação da loja). Usuária ou loja inativa: sai na hora e a tela de entrada mostra o aviso (`avisos.ts`).
- O acesso é conferido de novo a cada 60 s e ao voltar para a aba.
- Dados de tela: TanStack Query, chaves por assunto (ex.: `['miz', 'lojas']`); depois de gravar, `invalidateQueries`.

### Edge Functions (`supabase/functions`)
Tudo que cria conta no Auth, gera senha ou bloqueia login passa por Edge Function (service role só lá, via `Deno.env`). No site, chamar **sempre** com `chamarFuncao(nome, corpo)` (`src/lib/funcoes.ts`, tipado em `RespostasFuncoes`); erro vem como `ErroFuncao` com mensagem em português (usar `mensagemDeErro`).
| Função | Quem chama | Corpo → resposta |
| --- | --- | --- |
| `mizloja-criar-loja` | Admin Miz | `{loja:{nome,cnpj,cidade,uf,whatsapp?}, dona:{nome,whatsapp}}` → `AcessoCriado` + `loja_id` |
| `mizloja-criar-usuaria` | ADM (vendedora da própria loja) ou Admin Miz (só a dona, `perfil:'adm'`) | `{nome, whatsapp, loja_id?, perfil?}` → `AcessoCriado` |
| `mizloja-nova-senha` | ADM (vendedoras dela) ou Admin Miz | `{usuario_id}` → `AcessoCriado` (volta a exigir troca) |
| `mizloja-alterar-situacao` | ADM (vendedoras) ou Admin Miz (lojas, usuárias, admins) | `{tipo:'usuaria'\|'loja'\|'admin', id, situacao:'ativa'\|'inativa'}` (desativar bloqueia o login no Auth) |
| `mizloja-criar-admin` | Admin Miz | `{nome, whatsapp}` → `AcessoCriado` |
| `mizloja-primeiro-admin` | ninguém (temporária, versão **desligada** no repositório) | ver `docs/TESTES-PENDENTES.md` item 1 |
| `mizloja-seed-demo` | Admin Miz (temporária, não publicada) | `{acao:'carregar'\|'remover'}` — ver `docs/DEMO.md` |

- Código comum em `_shared/` (CORS por `ALLOWED_ORIGINS`, `quemChama`, `exigirAdminMiz`, `gerarSenha`, `criarContaAuth`, `bloquearLogin`).
- Publicar com `verify_jwt = true` (exceto a `primeiro-admin`, no uso único). Secrets: `APP_URL` (link da mensagem de acesso) e `ALLOWED_ORIGINS`.
- `AcessoCriado` mostra usuário e senha **uma vez** (componente `AcessoCriado`, com "Enviar pelo WhatsApp" e "Copiar").

### Componentes compartilhados (`src/components/shared`)
`TelaCarregando`, `PaginaEmConstrucao`, `AcessoCriado`, `CabecalhoPagina` (título, subtítulo, ação), `ListaCarregando` (em `EstadoCarregando`).

### Loja Demonstração e deploy
- Demonstração: `docs/DEMO.md` (função `mizloja-seed-demo` + `supabase/seed-demo/dados.sql` e `verificar.sql`; CNPJ de teste 99.999.999/0001-91).
- Deploy: `Dockerfile` (Node 22 → nginx), `nginx.conf`, guia em `docs/DEPLOY-EASYPANEL.md`. As `VITE_*` são build args.

## Como trabalhar
- **Sempre planejar antes de codar:** apresentar o plano (arquivos, migrations, riscos) e esperar aprovação quando a mudança for estrutural.
- Português do Brasil em tudo que a usuária vê, nos comentários e na documentação.
- Interface segue `docs/design-system.md` (Quicksand, 14 tons, sem degradê, sem emoji, botão de raio 10).
