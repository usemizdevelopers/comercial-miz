# Loja Demonstração

Loja fictícia para mostrar o MIZ Loja e testar as telas com dados realistas. Fica no mesmo banco das lojas reais, isolada por `loja_id` + RLS como qualquer outra loja, e é identificada pelo CNPJ de teste **99.999.999/0001-91**.

> **Situação:** a função `mizloja-seed-demo` está escrita, mas **ainda não foi publicada** nem chamada (este container não acessa o Supabase pela rede). Os dados de `dados.sql` foram validados pelo conector numa transação desfeita no fim (resultados abaixo). Passo a passo para carregar de verdade: [TESTES-PENDENTES.md](TESTES-PENDENTES.md), item 7.

## O que tem

| Item | Conteúdo |
| --- | --- |
| Loja | Loja Demonstração · Cidade Demonstração/MG · WhatsApp 5531900001000 |
| ADM (dona) | Mariana Souza · usuário `5531900001001` |
| Vendedora 1 | Júlia Lima · usuário `5531900001002` |
| Vendedora 2 | Paula Ribeiro · usuário `5531900001003` |
| Clientes | 40, distribuídas entre as duas vendedoras e a dona |
| Vendas | cerca de 117 nos últimos 160 dias, com peças reais do catálogo (cor e tamanho da grade da peça) e peças de outras marcas; 5 formas de pagamento; valores entre R$ 89,90 e R$ 899,90 |
| Contatos | toques no WhatsApp em datas variadas (alimentam "Em conversa" e o Follow-up) |
| Transferência | Alice Nogueira passou da Paula para a Júlia, com recado |
| Meta | mês atual publicado: loja R$ 30.000, Júlia R$ 12.000, Paula R$ 10.000; prêmio a 100% e prêmio extra a 120% |

As senhas das 3 contas são geradas pela função na hora (10 caracteres) e aparecem **só na resposta da chamada**. As contas entram **sem** troca obrigatória de senha, para facilitar a demonstração.

## Como carregar

1. Publicar a função `supabase/functions/mizloja-seed-demo` (com `verify_jwt = true`).
2. Entrar no site como Admin Miz, pegar o token da sessão e chamar:
   ```bash
   curl -X POST "$SUPABASE_URL/functions/v1/mizloja-seed-demo" \
     -H "Authorization: Bearer <token do Admin Miz>" \
     -H "apikey: <anon key>" -H "Content-Type: application/json" \
     -d '{"acao":"carregar"}'
   ```
   Resposta: `loja_id`, `contas` (perfil, nome, usuário e senha) e os e-mails técnicos. **Guardar as senhas agora.**
3. Rodar `supabase/seed-demo/dados.sql` no SQL Editor do Supabase (ou pelo conector `execute_sql`). Ele recusa rodar se a loja não existir ou se já tiver clientes.
4. Rodar `supabase/seed-demo/verificar.sql` e comparar com o resultado esperado.

## Resultado esperado (`verificar.sql`)

Validado em 03/10/2026 (os números de vendas variam um pouco com a data, porque tudo é relativo a hoje):

| Item | Esperado |
| --- | --- |
| clientes | 40 |
| vendas | ~117 (~97 com peça Miz) |
| formas de pagamento | cartao_credito, cartao_debito, crediario, dinheiro, pix |
| kanban | ativa 7, comprou 6, em_conversa 4, nova 4, recompra 8, sem_interesse 2, sumida 9 |
| status | ativa 2, esfriando 2, inativa 3, nova 10, sumida 6, vip 17 |
| aniversários em até 7 dias | 2 |
| transferências | 1 |
| meta do mês | publicada · R$ 30000 |

Tela Hoje esperada: Júlia com aniversário 1, follow-up ~11, pós-venda 1; Paula com aniversário 1, follow-up ~10, pós-venda 1.

## Como remover

1. Chamar a mesma função com `{"acao":"remover"}`: apaga a loja (clientes, vendas, metas etc. saem em cascata) e as 3 contas dela no Auth. Não toca em nenhuma outra loja.
2. Quando a demonstração não for mais necessária, remover a função `mizloja-seed-demo` pelo painel do Supabase (Edge Functions).

Para recarregar do zero: remover e carregar de novo.
