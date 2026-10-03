# MIZ Loja · Especificação do Sistema v1

Oct 3, 2026 · @Miz

## 1. Introdução

O MIZ Loja (nome provisório) é um micro SaaS para a lojista Miz organizar clientes, vendas e equipe em dois painéis: o da dona da loja (ADM) e o da vendedora. Substitui a planilha: o que lá dependia de disciplina (anotar contato, atualizar status) aqui acontece sozinho.

**O problema que resolve.** A lojista multimarcas vende pelo WhatsApp e pelo Instagram, mas a base de clientes vive no celular de cada vendedora. Ela não sabe quem comprou, de quanto em quanto tempo, em qual tamanho e cor, nem quanto cada vendedora vendeu no mês. Cliente que não é chamada esfria, e venda que não é medida não tem meta.

**Para quem.** Lojistas com CNPJ que compram da Miz (S3 e S1 primeiro), suas vendedoras e a própria dona quando também vende. Uma conta = uma loja.

**Por que a Miz faz isso.** Lojista que vende mais rápido recompra antes. O sistema ataca o sell-out: cliente chamada no dia certo, mensagem pronta, meta visível, venda medida. Cada venda com peça Miz registra referência, cor e tamanho, o que diz à lojista o que repor e reforça a reposição mensal.

**Três promessas de produto:**

1. Lançar uma venda de cliente antiga com 1 peça Miz em até 20 segundos.
2. Abrir a conversa certa no WhatsApp em 1 toque, com a mensagem pronta.
3. A dona ver a loja inteira (faturamento, equipe, clientes) numa tela só.

## 2. Visão geral

Dois perfis, uma base de dados por loja. A vendedora opera; a dona configura e acompanha. A dona também pode lançar vendas, porque em loja pequena ela vende.

| Perfil | Quem é | Faz | Não faz | Onde usa |
| --- | --- | --- | --- | --- |
| ADM (dona) | Dona ou gerente da loja; 1 por loja na v1 | Tudo da vendedora + cria acessos da equipe, metas, prêmios, dashboard da loja, todas as vendas, transferências, configurações | — | Navegador no computador e no celular |
| Vendedora | Equipe de venda; criada pela ADM | Lança venda, cadastra cliente, move o kanban, abre WhatsApp, transfere atendimento, vê a própria meta | Não vê faturamento da loja, metas das colegas nem configurações | Navegador no celular |
| Admin Miz | Time Miz (tabela própria de admins) | Cria lojas e a ADM de cada uma, outros Admin Miz e mantém o catálogo de peças Miz | Não vê clientes, vendas nem metas das lojas; o que mais verá fica para uma fase futura | Navegador no computador |

**Princípios de produto**

- **Acesso web, sem instalação.** Abre por um link no navegador; nada para baixar em loja de aplicativos.
- **Celular primeiro para a vendedora.** Polegar alcança tudo; botão "+ Venda" sempre visível.
- **Nada obrigatório que não seja essencial.** Cliente: nome e WhatsApp. Venda: cliente, itens, valor total e forma de pagamento.
- **Toque em vez de digitação.** Peças e cores Miz, tamanhos e pagamento são chips e cartões. Só a cor de peça de outra marca é digitada.
- **O sistema registra sozinho.** Tocar em WhatsApp registra o contato; lançar venda move a cliente no kanban; o tempo muda o status.
- **Linguagem de loja.** "Falta R$ 1.200 para a meta", não "Gap de atingimento".

**Escopo da v1**

| Painel | Páginas |
| --- | --- |
| Vendedora | Hoje · Clientes (kanban) · + Venda · Ficha da cliente · Metas · Perfil |
| ADM | Visão geral · Vendas · Clientes · Equipe · Metas e prêmios · Configurações · Modo vendedora |
| Admin Miz | Lojas · Catálogo · Admins Miz |
| Comum | Entrar · Troca de senha no primeiro acesso · Esqueci a senha |

O MIZ Loja é um site próprio, independente do app MIZ, acessado por link no navegador.

Fora da v1: estoque, pagamentos, nota fiscal, integração com a API do WhatsApp (seção 18).

## 3. Mapa do sistema e como as páginas se ligam

A vendedora alimenta os dados; a dona lê e configura. O ponto central é a venda lançada: ela atualiza a ficha, move o kanban, soma na meta e aparece no painel da dona na hora.

&#91;embedded content: mapa do sistema · 2 painéis, 4 tipos de dado\]

Equipe e Configurações não recebem dados das vendedoras: a primeira cria os acessos, a segunda define as mensagens e os prazos que mudam Hoje e o kanban.

**Fluxos principais**

1. **Venda:** Hoje ou Ficha → + Venda → cliente (nova / já é / não sei, busca na base inteira da loja) → peças (Miz ou não) → valor e pagamento → salvar.
2. **Contato do dia:** Hoje → pasta (Follow-up, Pós-venda, Aniversário) → cartão → toque em WhatsApp → conversa aberta (com mensagem pronta em Pós-venda e Aniversário) → contato registrado → cartão sai da pasta.
3. **Meta:** ADM cria e publica a meta → vendedora vê em Hoje e Metas → cada venda soma → prêmio conquistado aparece para as duas.
4. **Nova vendedora:** ADM em Equipe → sistema gera usuário e senha provisória → envio pelo WhatsApp (link, usuário, senha) → no primeiro acesso a vendedora troca a senha → cai em Hoje.

## 4. Entidades e campos (para aprovação)

Oito entidades. Campos marcados "Auto" o sistema preenche; ninguém digita. Aprove ou comente campo por campo. O nome de cada tabela no banco está no fim desta seção.

**Loja**

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| Nome da loja | Texto | Sim | Aparece nas mensagens (\[LOJA\]) |
| CNPJ | Número | Sim | Vínculo com o cadastro da Miz; validado no formato |
| Cidade / UF | Texto | Sim |  |
| WhatsApp da loja | Telefone | Não |  |
| Data de criação | Data | Auto |  |

**Usuária (ADM ou vendedora)**

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| Nome | Texto | Sim |  |
| WhatsApp | Telefone | Sim | Para onde vão as credenciais |
| Usuário | Texto | Auto | O número de WhatsApp, só dígitos; é o login |
| Senha | Senha | Auto | Provisória ao criar; troca obrigatória no primeiro acesso |
| Precisa trocar a senha? | Sim / Não | Auto | Sim ao criar ou ao gerar nova senha |
| E-mail | E-mail | Só ADM | Recuperação de acesso da dona |
| Perfil | Admin Miz / ADM / Vendedora | Auto | Definido por quem cria |
| Situação | Ativa / Inativa | Auto | Inativa não entra, mas o histórico fica |
| Último acesso | Data/hora | Auto |  |

**Cliente**

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| Nome | Texto | Sim |  |
| WhatsApp | Telefone | Sim | Único por loja; chave contra duplicidade |
| Data de nascimento | Data | Não | Dia e mês bastam; ano opcional |
| Observações | Texto curto | Não | Só na ficha, nunca no cadastro rápido |
| Vendedora responsável | Usuária | Auto | Quem cadastrou; passa para quem lançar a próxima venda; pode ser transferida |
| Data de cadastro | Data | Auto |  |
| Etapa do kanban | Lista | Auto / manual | Seção 8 |
| Último contato | Data/hora | Auto | Registrado ao tocar no botão WhatsApp |
| Nº de compras, total gasto, ticket médio | Número | Auto | Calculados das vendas |
| Primeira e última compra | Data | Auto |  |
| Intervalo médio entre compras | Dias | Auto | A partir da 2ª compra |
| Tamanho, cores e peças Miz preferidas | Lista | Auto | Os mais comprados |
| Status | Nova / Ativa / VIP / Esfriando / Sumida / Inativa | Auto | Regras na seção 17 |

**Venda**

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| Cliente | Cliente | Sim |  |
| Tem peça Miz? | Sim / Não | Sim | Abre os itens Miz |
| Itens | Lista de itens | Sim (mín. 1) |  |
| Valor total do pedido | R$ | Sim | Um valor para o pedido inteiro, não por peça |
| Forma de pagamento | PIX / Cartão de crédito / Cartão de débito / Dinheiro / Crediário | Sim | Chips, 1 toque |
| Data da venda | Data/hora | Auto | Agora; editável para lançar venda de até 7 dias atrás |
| Vendedora | Usuária | Auto | Quem lançou; ADM pode trocar |

**Item da venda**

| Campo | Peça Miz | Outra marca | Observação |
| --- | --- | --- | --- |
| Referência | Sim: busca por código ou nome | — | Digitar "MZ012" ou "mia" puxa a mesma peça |
| Cor | Sim: chips só com as cores daquela peça, 1 toque | Sim: campo de texto livre |  |
| Tamanho | Sim (a grade cadastrada da peça: P / M / G, PP/P, M/G…) | Sim (PP a GG, Único) | Chips |
| Quantidade | Sim, padrão 1 | Sim, padrão 1 | Botões − / + |

**Catálogo Miz** (próprio do MIZ Loja, igual para todas as lojas, mantido pela Admin Miz no painel Catálogo): peça (nome, código único, base/composição, ativa), cores (nome e hex da bolinha) e tamanhos. **Sem fotos:** o MIZ Loja não guarda imagens de peça; a peça é reconhecida pelo nome, código e bolinhas de cor. Carga inicial: cópia das 18 peças do app MIZ, sem vínculo com ele. Peça ou cor já usada em venda não se apaga, só se desativa.

**Meta e prêmio**

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| Mês | Mês/ano | Sim | Uma meta por mês |
| Meta da loja | R$ | Sim |  |
| Meta de cada vendedora | R$ | Não | Sem meta individual, a vendedora vê só a da loja |
| Prêmio | Texto | Não | Ex.: "R$ 200 em compras na loja" |
| Para quem vale | Todas / vendedoras escolhidas | Se houver prêmio |  |
| Condição | % da meta individual | Se houver prêmio | Padrão 100% |
| Prêmio extra | Texto + % | Não | Ex.: 120% da meta → folga no sábado |

**Tabelas no Supabase**

Todas as lojistas Miz usam o mesmo banco. Por isso, toda tabela deste sistema leva o prefixo `mizloja_`, para não se misturar com outras tabelas do projeto, e toda linha de dado de loja leva o `loja_id`, que separa uma loja da outra.

| Tabela | Guarda | Separada por loja |
| --- | --- | --- |
| `mizloja_admins` | Time Miz com acesso ao painel Admin Miz | Não |
| `mizloja_lojas` | Uma linha por loja | É a própria loja |
| `mizloja_usuarias` | ADM e vendedoras de cada loja | Sim |
| `mizloja_config` | Prazos e preferências da loja | Sim |
| `mizloja_mensagens` | Textos de Aniversário e Pós-venda da loja | Sim |
| `mizloja_pecas` | Catálogo: peças Miz | Não, comum a todas |
| `mizloja_peca_cores` | Cores de cada peça, com hex | Não, comum a todas |
| `mizloja_peca_tamanhos` | Grade de tamanhos de cada peça | Não, comum a todas |
| `mizloja_clientes` | Cadastro e campos calculados da cliente | Sim |
| `mizloja_vendas` | Cabeçalho da venda: cliente, vendedora, valor, pagamento, data | Sim |
| `mizloja_venda_itens` | Peças de cada venda | Sim, via venda |
| `mizloja_metas` | Meta do mês da loja e prêmio | Sim |
| `mizloja_metas_vendedoras` | Meta e prêmio de cada vendedora no mês | Sim |
| `mizloja_contatos` | Cada toque no botão WhatsApp | Sim |
| `mizloja_pulos` | "Pular hoje" das pastas | Sim |
| `mizloja_transferencias` | Quem passou qual cliente para quem, e quando | Sim |
| `mizloja_alteracoes` | Registro de edições e exclusões de vendas | Sim |

O MIZ Loja usa o mesmo projeto Supabase do app MIZ, mas não lê nem altera nenhuma tabela do app: tudo é independente. A view `mizloja_v_clientes` entrega cada cliente com status, etapa do kanban e próximo aniversário.

Nomes em minúsculas, sem acento, palavras separadas por `_`, tabelas no plural. Regras de acesso por loja (quem lê e escreve o quê) ficam no documento de desenvolvimento.

## 5. Acesso e primeiro uso

Acesso 100% web, por link no navegador, sem instalação. Ninguém se cadastra sozinho: a Miz cria a loja e a dona; a dona cria as vendedoras. Em todos os casos, as credenciais chegam prontas pelo WhatsApp e a senha é trocada no primeiro acesso.

1. **Admin Miz cria a loja** (nome, CNPJ, cidade, nome e WhatsApp da dona). O sistema gera o usuário (WhatsApp da dona) e uma senha provisória, e mostra o botão \[Enviar acesso pelo WhatsApp\].
2. **A dona entra** com usuário e senha provisória, cria a senha dela e informa o e-mail de recuperação. Cai na Visão geral vazia, com um guia de 3 passos: cadastrar vendedoras → definir a meta do mês → lançar a primeira venda.
3. **A dona cria cada vendedora** em Equipe (nome e WhatsApp). O sistema gera usuário e senha provisória e abre o WhatsApp da vendedora com a mensagem abaixo pronta para enviar.
4. **A vendedora entra** com usuário e senha provisória, cria a senha dela (tela única, obrigatória, sem como pular) e cai em Hoje.

Mensagem de acesso (gerada pelo sistema, enviada pela dona):

```text
Oi, [NOME DA VENDEDORA]! Seu acesso ao MIZ Loja da [LOJA] está pronto.

Link de acesso: [LINK]
Usuário: [USUÁRIO]
Senha: [SENHA PROVISÓRIA]

No primeiro acesso você vai criar a sua senha.
```

**Entrar**

- Dois campos: usuário (número de WhatsApp, aceito com ou sem formatação) e senha.
- Senha nova: mínimo 6 caracteres; o sistema não deixa repetir a provisória.
- Sessão fica aberta 30 dias no mesmo navegador; a vendedora não digita senha a cada venda.
- "Esqueci a senha": a dona recupera por e-mail; a vendedora pede à dona, que gera nova senha provisória em Equipe e reenvia pelo WhatsApp (volta a exigir troca no acesso seguinte).
- Vendedora desativada perde o acesso na hora; as vendas e clientes dela continuam na loja.

**Modo vendedora (ADM).** Botão no menu da dona que troca para o painel da vendedora com o nome dela. As vendas lançadas contam para a dona como vendedora.

## 6. Vendedora · Hoje (tela inicial)

A tela que a vendedora abre de manhã: quanto falta para a meta e quem chamar hoje, com o WhatsApp a 1 toque.

**Navegação fixa (rodapé, celular):** Hoje · Clientes · **+ Venda** (botão central, destacado) · Metas · Perfil. No computador, a mesma ordem em barra lateral.

**Blocos, de cima para baixo**

1. **Saudação e data.** "Bom dia, Carla · sábado, 3 de outubro".
2. **Faixa da meta.** Barra de progresso do mês, "Vendido R$ 4.320 · Faltam R$ 1.680". Se houver prêmio, uma linha: "Faltam R$ 1.680 para o seu prêmio". Toque leva a Metas.
3. **Chamar hoje, em pastas.** Três pastas lado a lado, cada uma com o número de tarefas: **Follow-up · 8**, **Pós-venda · 3**, **Aniversário · 2**. Toque abre a pasta com os cartões daquela atividade (regras na seção 17). Cada cartão: nome, o porquê ("Comprou há 5 dias", "Aniversário em 2 dias", "34 dias sem comprar"), última compra e botão **WhatsApp**. O botão abre a conversa (com a mensagem pronta em Pós-venda e Aniversário) e registra o contato; o cartão sai da pasta. Deslizar para o lado = "Pular hoje".
4. **Minhas vendas de hoje.** Total do dia e as últimas 3 vendas; toque abre a venda.

**Estados**

- Pasta vazia: aparece apagada, com "0", e não abre.
- Todas vazias: "Ninguém para chamar agora. Que tal revisar as clientes que estão esfriando?" com link para o kanban filtrado.
- Sem meta definida: a faixa mostra só "Vendido no mês: R$ X".

**Liga com:** + Venda (rodapé), Ficha da cliente (toque no nome), Metas (faixa), Clientes (estado vazio).

## 7. Vendedora · Lançar venda

Três passos numa tela que avança sozinha: **Cliente → Peças → Valor**. Meta de uso: cliente antiga com 1 peça Miz em até 20 segundos e 8 toques.

Abre pelo botão central "+ Venda" (em qualquer página) ou por "Nova venda" na ficha de uma cliente (nesse caso, pula o passo 1). Um indicador de 3 pontos no topo mostra o passo; "Voltar" nunca apaga o que foi preenchido.

### Passo 1 · Cliente

Pergunta: **"Quem está comprando?"** com três botões grandes:

| Opção | O que acontece |
| --- | --- |
| **Cliente nova** | Abre o cadastro rápido: Nome\*, WhatsApp\*, Data de nascimento (opcional). Ao sair do campo WhatsApp, o sistema verifica o número na base inteira da loja. Se existir: "Esse número já é da Ana Paula Ribeiro. Usar ela?" \[Usar Ana Paula\] \[Corrigir número\]. Nunca cria duplicada. |
| **Já é cliente** | Abre a busca com o teclado aberto, sempre na base inteira da loja (clientes de todas as vendedoras). Busca por nome ou WhatsApp a partir de 2 letras/dígitos, sem acento e sem diferenciar maiúscula. Resultados: nome, final do WhatsApp, última compra ("há 18 dias") e vendedora responsável. Toque seleciona. |
| **Não sei** | A mesma busca na base inteira. Se não encontrar: "Não encontramos 'Fernanda'." \[Cadastrar agora\] \[Buscar de novo\]. "Cadastrar agora" abre o cadastro rápido com o termo já preenchido no nome (ou no WhatsApp, se foram números). |

Se a cliente escolhida for de outra vendedora, aparece um aviso discreto: "Cliente da Júlia. Ao salvar a venda, ela passa a ser sua." A troca de responsável acontece ao salvar e fica registrada no histórico de transferências.

Cliente escolhida aparece num cartão fixo no topo dos próximos passos: nome, nº de compras, tamanho preferido e as 2 cores que mais compra. Serve de cola para a vendedora sugerir peça. Toque em "Trocar" volta ao passo 1.

### Passo 2 · Peças

Pergunta: **"Tem peça Miz neste pedido?"** \[Sim\] \[Não\]

**Se Sim**

1. Campo de busca da peça no topo: digitar o **código** (ex.: "MZ012") ou parte do **nome** ("mia") filtra na hora. Abaixo, a lista de cartões das peças Miz ativas (sem foto): nome, código e as bolinhas das cores disponíveis. Toque escolhe a peça.
2. Aparecem só as cores ativas daquela peça (chips com bolinha de cor + nome, 1 toque) e os tamanhos da grade dela (P / M / G, ou PP/P e M/G).
3. Quantidade com − / +, padrão 1.
4. &#91;Adicionar peça\] fecha o item numa linha-resumo ("Blusa Mia · Preta · M · 1", com lixeira) e reabre a busca para a próxima.
5. Abaixo, uma pergunta discreta: "Tem peça de outra marca também?" Se sim, abre o bloco "Outras peças" (abaixo).

**Se Não (ou outras peças junto)**

- Cor: campo de texto livre ("azul bebê", "estampado"), com sugestão das cores já digitadas na loja para não escrever a mesma cor de jeitos diferentes.
- Tamanho: PP · P · M · G · GG · Único.
- Quantidade: − / +, padrão 1.
- &#91;Adicionar peça\] fecha o item, como acima.

Cor e tamanho também nas outras marcas porque alimentam a preferência da cliente e o painel da dona.

### Passo 3 · Valor e confirmação

- **Valor total do pedido**\* em teclado numérico, formatado em R$ enquanto digita.
- **Forma de pagamento**\*: chips PIX · Cartão de crédito · Cartão de débito · Dinheiro · Crediário (1 toque).
- Data: "Hoje" por padrão; toque permite escolher outra data (até 7 dias para trás).
- Resumo: cliente, itens, total, pagamento. Botão **Salvar venda**.

### Depois de salvar

Tela de sucesso por 2 segundos: "Venda de R$ 289,80 salva · faltam R$ 1.390 para sua meta". Três ações:

- **Abrir WhatsApp da cliente** (conversa sem texto pronto; a mensagem de pós-venda chega na pasta Pós-venda 5 dias depois).
- **Nova venda**.
- **Ir para Hoje**.

**Regras desta página**

- Sem cliente, sem item, sem valor ou sem pagamento, o botão Salvar fica desativado; nunca mensagem de erro em vermelho no meio do fluxo.
- Rascunho salvo no navegador: se a página fechar no meio, ao reabrir "Continuar a venda da Ana Paula?".
- A vendedora edita ou exclui a própria venda por até 24 h; depois, só a ADM.
- Conexão caiu: a venda fica guardada no navegador e sobe quando a conexão voltar, com aviso discreto "1 venda aguardando envio".

**Liga com:** Ficha da cliente (histórico atualizado), Kanban (cliente vai para "Comprou"), Metas (progresso), Visão geral da ADM.

## 8. Vendedora · Clientes (kanban)

Seis colunas que contam a vida da cliente na loja. A vendedora move só as duas primeiras; as outras o sistema move sozinho, pela venda e pelo tempo.

| Coluna | Quem entra | Como entra | Como sai |
| --- | --- | --- | --- |
| **Novas** | Cadastrada, sem compra, sem conversa | Cadastro | Vendedora arrasta para Em conversa, ou toca em WhatsApp (move sozinha) |
| **Em conversa** | Conversando, ainda não comprou | Manual ou toque no WhatsApp | Venda lançada → Comprou; 30 dias sem contato → sugestão "mover para Sem interesse?" |
| **Comprou** | Comprou nos últimos 15 dias | Automático, ao lançar venda | 15 dias depois → Ativa |
| **Ativa** | Última compra entre 16 e 29 dias | Automático | 30 dias sem comprar → Hora da recompra |
| **Hora da recompra** | 30 a 59 dias sem comprar | Automático | Nova venda → Comprou; 60 dias → Sumidas |
| **Sumidas** | 60 dias ou mais sem comprar | Automático | Nova venda → Comprou |

"Sem interesse" fica fora do quadro, num filtro: cliente arquivada que não aparece em Hoje, mas volta para Comprou se comprar.

**Cartão da cliente:** nome · selo (VIP, Aniversário, Nova) · "Última compra há 34 dias · R$ 289" · botão WhatsApp. Toque no cartão abre a Ficha; toque no botão abre a conversa e registra o contato.

**No celular:** uma coluna por vez, com abas roláveis no topo e o número de cartões em cada uma ("Hora da recompra · 12"). Arrastar entre colunas = pressionar o cartão e escolher a coluna; arrastar de verdade só no computador.

**Topo da página:** busca por nome ou WhatsApp · filtro "Minhas clientes / Todas" · filtro por selo.

**Liga com:** Ficha da cliente, WhatsApp, + Venda (botão no cartão aberto).

## 9. Vendedora · Ficha da cliente

Tudo o que a vendedora precisa para sugerir a próxima peça, numa tela rolável. A mesma ficha serve à ADM, com ações a mais (seção 14).

1. **Cabeçalho:** nome, selo de status, aniversário ("6 de outubro"), vendedora responsável. Botões: **WhatsApp** · **Nova venda** · Transferir · Editar.
2. **Resumo em 4 números:** compras · total gasto · ticket médio · compra a cada X dias (a partir da 2ª compra). Embaixo: "Última compra há 18 dias".
3. **Preferências:** tamanho mais comprado · 3 cores mais compradas (bolinhas) · peças Miz já compradas, com quantas vezes.
4. **Histórico de compras:** lista da mais recente para a mais antiga. Cada linha: data, valor, itens resumidos ("Blusa Mia Preta M + 1 peça"), vendedora. Toque expande os itens.
5. **Linha do tempo de contatos:** "WhatsApp aberto por Carla · 28/09". Só registro automático, sem digitação.
6. **Observações:** campo livre curto ("prefere modelagem mais solta"), salvo ao sair.

Editar permite à vendedora: nome, WhatsApp (com checagem de duplicidade), data de nascimento, observações e etapa (Novas, Em conversa, Sem interesse).

**Transferir atendimento.** Botão na ficha (vendedora e ADM): escolhe a colega da lista e, opcional, escreve um recado curto ("ela quer o blazer em caqui, chega dia 15"). A cliente passa para a colega na hora, com o recado no topo da ficha e um cartão na pasta Follow-up dela. Cada transferência fica registrada: de quem, para quem, quando e o recado.

**Liga com:** + Venda (cliente já preenchida), WhatsApp, Kanban, detalhe da venda.

## 10. Vendedora · Metas

Uma tela, uma pergunta respondida: quanto falta. Com prêmio, mostra também quanto falta para ganhar.

**Com meta individual e prêmio**

- Número grande: **"Faltam R$ 1.680"**.
- Barra de progresso: vendido 4.320 de 6.000 (72%).
- "Faltam 9 dias · R$ 187 por dia".
- Cartão do prêmio: "Bateu 100%: R$ 200 em compras na loja". Se houver extra: "Bateu 120%: folga no sábado · faltam R$ 2.880".
- Ao bater: o cartão muda para "Prêmio conquistado" e a barra fica cheia; sem confete.

**Com meta individual, sem prêmio:** só os três primeiros itens.

**Sem meta individual:** mostra a meta da loja ("A loja vendeu R$ 18.400 de R$ 25.000") e "Você vendeu R$ 4.320 este mês".

**Sem nenhuma meta:** "Vendido no mês: R$ 4.320 · 23 vendas".

**Abaixo, em todos os casos:** nº de vendas no mês, ticket médio e clientes novas; meses anteriores em lista simples (mês · vendido · % da meta · prêmio ganho ou não).

A vendedora não vê valores nem metas das colegas. Ranking da equipe só se a ADM ligar (decisão D4).

**Liga com:** Hoje (faixa da meta), tela de sucesso da venda.

## 11. ADM · Visão geral (dashboard)

A loja inteira numa tela: quanto vendeu, quem vendeu, o que vendeu e como está a base de clientes.

**Navegação ADM:** barra lateral no computador (Visão geral · Vendas · Clientes · Equipe · Metas · Configurações · Modo vendedora); no celular, rodapé com Visão geral · Vendas · Clientes · Equipe · Mais.

**Filtros no topo:** período (Hoje · 7 dias · Este mês · Mês passado · Escolher datas) e vendedora (Todas · uma). Todos os blocos respondem aos filtros.

**Faixa 1 · Números do período** (cartões; cada um com a variação contra o período anterior)

| Indicador | Cálculo |
| --- | --- |
| Faturamento | Soma dos valores das vendas |
| Vendas | Nº de pedidos |
| Ticket médio | Faturamento ÷ vendas |
| Peças vendidas | Soma das quantidades dos itens |
| Clientes novas | Clientes com 1ª compra no período |
| Taxa de recompra | Clientes com 2+ compras ÷ clientes com 1+ compra (base toda) |
| Clientes ativas | Compraram nos últimos 90 dias |
| % em peças Miz | Faturamento de pedidos com peça Miz ÷ faturamento (decisão D6) |

**Faixa 2 · Meta do mês:** barra da loja (vendido, meta, falta, R$ por dia restante) e, ao lado, uma linha por vendedora com barra e %, e o selo do prêmio quando conquistado.

**Faixa 3 · Gráficos**

- Faturamento por dia (mês) ou por mês (ano).
- Vendas por vendedora (barras horizontais, R$ e nº de vendas).
- Peças Miz mais vendidas (referência e quantidade).
- Cores mais vendidas e tamanhos mais vendidos (todas as marcas).

**Faixa 4 · Perfil da cliente da loja ("a preferência da maioria")**

Cartão de leitura rápida: tamanho mais vendido · 3 cores campeãs · peça Miz campeã · ticket médio · intervalo médio entre compras · nº de aniversariantes do mês (link para a lista).

**Faixa 5 · Saúde da base:** quantas clientes em cada coluna do kanban (Novas, Em conversa, Comprou, Ativa, Hora da recompra, Sumidas), com link para a lista filtrada em Clientes.

**Liga com:** Vendas, Clientes (filtrada), Equipe (desempenho individual), Metas.

## 12. ADM · Equipe

Criar vendedoras, acompanhar cada uma e cortar acesso quando alguém sai, sem perder histórico.

**Lista:** uma linha por vendedora com nome, situação, vendido no mês, % da meta, nº de vendas e último acesso. Botão **+ Vendedora**.

**+ Vendedora:** Nome\* e WhatsApp\*. Ao salvar, o sistema gera usuário e senha provisória e mostra \[Enviar acesso pelo WhatsApp\], que abre a conversa com a vendedora e a mensagem de acesso da seção 5 já preenchida (link, usuário, senha). Também há \[Copiar acesso\].

**Página da vendedora (desempenho individual)**

- Mesmos filtros de período da Visão geral.
- Números: faturamento, vendas, ticket médio, peças Miz, clientes novas, clientes atendidas, contatos de WhatsApp feitos.
- Conversão: clientes cadastradas por ela no período ÷ quantas compraram.
- Meta: barra do mês e histórico (mês · vendido · % · prêmio).
- Listas: últimas vendas; clientes dela em "Hora da recompra" e "Sumidas".

**Ações:** editar nome e WhatsApp · gerar nova senha provisória e reenviar pelo WhatsApp (esqueceu a senha) · desativar · transferir clientes para outra vendedora, uma a uma ou todas de uma vez (obrigatório oferecer ao desativar).

Não há exclusão de vendedora: desativar preserva vendas e metas para o histórico da loja.

**Liga com:** Visão geral (barra por vendedora), Metas, Clientes (filtro por vendedora).

## 13. ADM · Metas e prêmios

Uma meta por mês, criada em 1 minuto, com prêmio opcional. As vendedoras veem assim que a dona publica.

**Criar meta do mês (formulário em 3 blocos)**

1. **Meta da loja:** mês e valor em R$. Referência ao lado: "Mês passado: R$ 21.300 · melhor mês: R$ 26.800".
2. **Metas individuais (opcional):** lista das vendedoras ativas com campo em R$. Botão "Dividir igualmente". Linha final com a soma das individuais, a meta da loja e a diferença (ex.: soma 24.000 · loja 25.000 · diferença 1.000), como aviso, nunca bloqueio.
3. **Prêmio (opcional):** descrição, para quem vale (todas ou escolhidas), condição (padrão 100% da meta individual) e, opcional, prêmio extra com outra condição (ex.: 120%).

Botões: **Publicar** (vendedoras passam a ver) e Salvar rascunho. Atalho: "Repetir o mês passado".

**Acompanhamento:** tabela do mês com vendedora · meta · vendido · % · falta · prêmio (a caminho / conquistado). Meses anteriores ficam em histórico, só leitura.

**Regras**

- Conta a venda pela data da venda e pela vendedora registrada nela.
- Editar meta publicada é permitido; as vendedoras veem o valor novo, sem aviso intrusivo.
- O prêmio é só registro e motivação: o sistema não paga nem calcula comissão.

**Liga com:** Metas da vendedora, Hoje (faixa), Visão geral (faixa 2), Equipe.

## 14. ADM · Clientes

A base inteira da loja em tabela, com filtros que viram listas de trabalho: quem sumiu, quem faz aniversário, quem veste M e compra preto.

**Topo:** busca por nome ou WhatsApp · contador ("412 clientes") · botão Exportar (planilha) · alternar Tabela / Kanban.

**Filtros (combináveis):** status · coluna do kanban · vendedora · aniversariantes (este mês / próximos 7 dias) · tamanho preferido · cor preferida · comprou peça Miz (sim/não) · sem comprar há mais de X dias · faixa de total gasto.

**Colunas da tabela (ordenáveis)**

| Coluna | Exemplo |
| --- | --- |
| Nome | Ana Paula Ribeiro |
| WhatsApp | botão de conversa |
| Status | Esfriando |
| Compras | 4 |
| Total gasto | 1.186,40 |
| Ticket médio | 296,60 |
| Compra a cada | 27 dias |
| Última compra | há 54 dias |
| Tamanho / cores | M · preta, gelo |
| Vendedora | Carla |

**Ficha completa:** a mesma da vendedora (seção 9) com três ações a mais: trocar vendedora responsável, mesclar duplicadas (escolhe qual nome e WhatsApp ficam; o histórico soma) e excluir cliente (pede confirmação; as vendas ficam como "cliente removida").

**Ações em lote:** selecionar várias clientes → trocar vendedora responsável ou mover para "Sem interesse".

**Liga com:** Visão geral (links da faixa 5), Ficha da cliente, Equipe.

## 15. ADM · Vendas

Todas as vendas da loja, para conferir, corrigir e exportar.

**Lista:** data · cliente · vendedora · itens resumidos · tem Miz (selo) · valor · pagamento. Totais do filtro no rodapé (vendas, peças, faturamento).

**Filtros:** período · vendedora · com/sem peça Miz · referência Miz · cor · tamanho · forma de pagamento.

**Detalhe da venda:** cliente (link para a ficha), vendedora, data e hora do lançamento, itens completos, valor. Ações: editar (todos os campos, inclusive trocar vendedora), excluir com motivo.

**Registro de alterações:** toda edição ou exclusão guarda quem, quando, o que mudou e o motivo. Visível só para a ADM, no detalhe da venda.

A ADM também lança venda daqui (botão + Venda), pelo mesmo fluxo da seção 7.

**Liga com:** Visão geral, Ficha da cliente, Equipe.

## 16. ADM · Configurações

Poucas chaves, todas com valor padrão: a loja funciona sem a dona abrir esta página.

| Grupo | Configuração | Padrão |
| --- | --- | --- |
| Loja | Nome, cidade, WhatsApp da loja | Do cadastro feito pela Miz |
| Mensagens | Texto de Aniversário e de Pós-venda, com \[NOME\] e \[LOJA\] e prévia ao vivo | Textos-modelo da seção 17 |
| Tempo | Dias após a compra para entrar em Pós-venda | 5 |
| Tempo | Dias para "Hora da recompra" | 30 |
| Tempo | Dias para "Sumidas" | 60 |
| Tempo | Dias em "Comprou" | 15 |
| Equipe | Kanban e pastas de Hoje mostram à vendedora: só as clientes dela / todas | Só as dela (a busca no lançamento é sempre na base inteira) |
| Equipe | Ranking da equipe visível para as vendedoras | Desligado |
| Conta | E-mail e senha da dona | — |

**Liga com:** Hoje e Kanban (regras de tempo), Lançar venda (busca), Metas (ranking).

## 17. Regras de negócio e automações

O que o sistema faz sozinho. Os prazos usam os padrões da seção 16 e mudam se a ADM alterar.

**Pastas de "Chamar hoje"**

Três pastas, poucas mensagens prontas. Cada cliente aparece em uma pasta por vez; se couber em duas, vale a ordem Aniversário → Pós-venda → Follow-up.

| Pasta | Entra quando | Mensagem ao abrir o WhatsApp | Sai quando |
| --- | --- | --- | --- |
| **Aniversário** | Aniversário hoje ou nos próximos 2 dias | Parabéns personalizado com o primeiro nome (abaixo) | WhatsApp aberto ou a data passa |
| **Pós-venda** | Compra feita há 5 dias, sem contato depois dela | Pergunta se já usou, como ficou e se precisa de algo para compor o look (abaixo) | WhatsApp aberto ou 10 dias após a compra |
| **Follow-up** | Nova sem contato · Em conversa sem contato há 15+ dias · Hora da recompra sem contato há 30+ dias · Sumida sem contato há 30+ dias · Recebida por transferência | Nenhuma: abre a conversa em branco | WhatsApp aberto ou nova venda |

No Follow-up, o cartão mostra o motivo em uma linha ("Nova, ainda sem conversa", "34 dias sem comprar", "Transferida pela Júlia").

Mensagens-modelo (a ADM pode reescrever em Configurações):

```text
Aniversário
Feliz aniversário, [NOME]! Hoje o dia é todo seu. Toda a equipe da [LOJA] te deseja um ano lindo. Com carinho!

Pós-venda
Oi, [NOME]! Já usou sua peça nova? Me conta como ficou! Se estiver precisando de algo para compor o look, separo umas opções para você.
```

A vendedora vê as pastas das clientes dela (ou de todas, conforme a seção 16). "Pular hoje" esconde o cartão até o dia seguinte.

**Status da cliente**

| Status | Regra |
| --- | --- |
| Nova | Nenhuma compra |
| VIP | 3+ compras e última compra há menos de 60 dias |
| Ativa | Última compra há menos de 30 dias |
| Esfriando | 30 a 59 dias |
| Sumida | 60 a 90 dias |
| Inativa | Mais de 90 dias |

**WhatsApp**

- Link no formato wa.me com DDI 55 colocado pelo sistema; a vendedora digita o número como quiser.
- Mensagens prontas só em Aniversário e Pós-venda; \[NOME\] = primeiro nome da cliente, \[LOJA\] = nome da loja.
- Tocar no botão = contato registrado (data, hora, vendedora). O sistema não sabe se a mensagem foi enviada; isso basta para tirar o cartão da pasta.

**Cadastro e duplicidade**

- WhatsApp é normalizado (só dígitos, com DDI) e único por loja.
- Toda busca de cliente (lançamento, kanban com filtro "Todas", Clientes da ADM) olha a base inteira da loja.
- Nome é salvo como digitado; a busca ignora acentos e maiúsculas.
- Responsável da cliente: quem cadastrou; muda para a vendedora que lançar a venda seguinte, ou por transferência (vendedora ou ADM). Toda troca vai para o histórico de transferências.

**Vendas e cálculos**

- A venda entra nos números pela data da venda, no fuso de Brasília.
- "Pedido com peça Miz" = ao menos 1 item Miz.
- Intervalo médio entre compras = dias entre a primeira e a última compra ÷ (nº de compras − 1).
- Preferências = tamanho e cores com mais peças compradas; empate, vale a mais recente.
- Excluir venda recalcula cliente, kanban, metas e dashboard na hora.

## 18. Decisões pendentes e fora do escopo

Já decidido nesta revisão: acesso web sem instalação; login com usuário e senha enviados pela dona, com troca no primeiro acesso; forma de pagamento obrigatória; o que a Miz verá das lojas fica para o futuro; site próprio e independente do app MIZ; catálogo e admins próprios. Restam três decisões, cada uma com a minha recomendação.

| # | Decisão | Opções | Recomendação | Por quê |
| --- | --- | --- | --- | --- |
| D2 | Lead Miz entra sozinho? | Manual (vendedora marca a origem) · integração futura com o app MIZ | Sem origem Lead Miz na v1 | Evita campo a mais no cadastro rápido |
| D4 | Ranking entre vendedoras | Sempre · nunca · ADM escolhe | ADM escolhe, padrão desligado | Ranking motiva umas e desmotiva outras; quem conhece a equipe é a dona |
| D6 | Valor das peças Miz no pedido misto | Só o total do pedido · total + valor das peças Miz | Só o total na v1; "% em peças Miz" conta pedidos com Miz | Um campo a menos; precisão por peça entra na v2 se a dona pedir |




