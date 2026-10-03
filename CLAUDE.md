# MIZ Loja · regras do projeto

## O produto
Micro SaaS web (acesso por link, sem instalação) para lojistas que compram da Miz, marca de moda feminina do Grupo Mark. A lojista organiza clientes, vendas, equipe e metas.

- **Painel ADM (dona da loja):** cria acessos das vendedoras, define metas e prêmios, vê desempenho da equipe e da loja, vê todas as clientes e vendas, configura mensagens e prazos.
- **Painel da vendedora (celular):** lança vendas em até 20 segundos, vê quem chamar hoje em pastas (Follow-up, Pós-venda, Aniversário), abre o WhatsApp da cliente em 1 toque, move clientes no kanban, vê quanto falta para a meta e o prêmio.
- **Admin Miz (time da Miz):** cria as contas das lojas e da dona e mantém o catálogo de peças.

Toda venda registra se teve peça Miz e quais (peça, cor, tamanho, quantidade). Todas as lojas usam o mesmo banco; o isolamento entre lojas é feito por `loja_id` + Row Level Security.

Documentos de referência:
- `docs/especificacao.md` — especificação do sistema (**ainda não está no repositório**; quando chegar, ler antes de planejar).
- `docs/design-system.md` — design system v1 (cores, tipografia, componentes, voz).
- `docs/BANCO.md` — banco de dados completo (tabelas, funções, RLS, diagrama).

## Etapas
1. Banco de dados ✅ · 2. Fundação do app (projeto web, design system, login, troca de senha, layouts, criação de usuárias, dados de demonstração) · 3. Admin Miz: contas · 4–9. Painel ADM: Equipe, Metas e prêmios, Configurações, Clientes, Vendas, Visão geral · 10–14. Painel da vendedora: Lançar venda, Ficha da cliente, Hoje, Clientes (kanban), Metas e Perfil · 15. Revisão final.

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

## Como trabalhar
- **Sempre planejar antes de codar:** apresentar o plano (arquivos, migrations, riscos) e esperar aprovação quando a mudança for estrutural.
- Português do Brasil em tudo que a usuária vê, nos comentários e na documentação.
- Interface segue `docs/design-system.md` (Quicksand, 14 tons, sem degradê, sem emoji, botão de raio 10).
