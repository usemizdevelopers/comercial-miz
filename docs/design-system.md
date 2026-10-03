# MIZ Loja · Design System v1

Oct 3, 2026 · @Miz

A interface do MIZ Loja deve parecer uma extensão da marca: editorial, silenciosa e precisa, como a etiqueta de uma peça premium, e rápida como um aplicativo de caixa. Este documento dá ao time de design e desenvolvimento as regras para construir as telas da Especificação do Sistema v1.

## 1. Princípios visuais

A referência é o showroom da Miz e não um painel de software: fundo off white, tipografia com respiro, poucas cores, nada gritando. O luxo vem do que se tira, não do que se coloca.

| Princípio | Na prática |
| --- | --- |
| **Silêncio que deixa o número falar** | Uma informação principal por tela, em tamanho grande ("Faltam R$ 1.680"). O resto é apoio, em tom mais claro. |
| **Monocromático e quente** | A interface inteira vive nos 14 tons da paleta, do off white ao quase preto. Cor só aparece na bolinha de cor da peça. |
| **Linha em vez de sombra** | Separação por bordas de 1 px e espaço em branco. Sombra só em elementos que flutuam (folha inferior, menu). |
| **Editorial** | Rótulos pequenos em caixa alta e espaçados, títulos firmes, alinhamento à esquerda, divisores finos. Como uma ficha técnica de coleção. |
| **Um toque resolve** | Alvos grandes (48 px), chips em vez de listas suspensas, botão principal sempre no alcance do polegar. |
| **Consistência acima de criatividade** | Um único botão primário por tela, os mesmos cards em todas as páginas, os mesmos espaçamentos. A variedade cansa quem usa o sistema 40 vezes por dia. |

**Teste de aprovação de qualquer tela:** se tirar o logo, ainda parece Miz? Se colocar o logo de uma startup de tecnologia, parece estranho? Se a resposta for sim às duas, está no caminho.

## 2. Cores

Cada um dos 14 tons tem uma função fixa. O time nunca escolhe cor "de olho": usa o token da função.

| Tom | Token | Função |
| --- | --- | --- |
| #FFFFFF | `surface` | Fundo de cards, campos, folhas inferiores |
| #F7F6F3 | `background` | Fundo de todas as páginas (o off white da marca) |
| #EEECE7 | `background-muted` | Faixas de seção, cabeçalho de tabela, hover de linha, fundo de chip não selecionado |
| #E6E3DB | `border-subtle` | Borda de cards e divisores |
| #D1CCC7 | `border` | Borda de campos, chips e botão secundário |
| #BEB8B1 | `border-strong` | Borda de campo em foco suave, trilho da barra de progresso |
| #ABA49B | `icon-muted` | Ícones inativos, texto desabilitado |
| #999085 | `text-placeholder` | Placeholder e legendas de gráfico (só texto grande ou decorativo) |
| #7A7266 | `text-tertiary` | Texto de apoio sobre branco (datas, "há 18 dias") |
| #645D54 | `text-secondary` | Texto de apoio sobre off white, ícones ativos, rótulos |
| #4E4841 | `primary-hover` | Hover e toque do botão primário |
| #38332E | `surface-inverse` | Barra lateral da ADM, toast, tooltip |
| #221F1C | `primary` / `text-primary` | Botão primário, títulos, texto principal, chip selecionado |
| #000000 | `pressed` | Só estado pressionado do primário e o logo |

**Proporção na tela:** cerca de 70% fundos claros (`background`, `surface`), 20% bordas e textos médios, 10% `primary`. Se uma tela ficar escura, há botão primário demais.

**Contraste (WCAG AA, texto normal pede 4,5:1)**

| Combinação | Contraste aprox. | Uso permitido |
| --- | --- | --- |
| `text-primary` sobre `background` | 16:1 | Qualquer texto |
| Branco sobre `primary` | 16:1 | Texto de botão primário |
| `text-secondary` sobre `background` | 6:1 | Texto de apoio |
| `text-tertiary` sobre `surface` | 4,7:1 | Texto de apoio, só sobre branco |
| `text-tertiary` sobre `background` | 4,4:1 | Só texto de 18 px ou mais |
| `text-placeholder` sobre `surface` | 2,9:1 | Só placeholder e elementos decorativos; nunca informação |

**Cores de estado \[PROPOSTA para aprovação\]**

A paleta é toda neutra, mas três situações precisam ser reconhecidas sem leitura: meta batida, erro de campo e alerta. A proposta usa tons tirados da própria cartela de produto da Miz, apagados para conversar com a paleta, sempre acompanhados de ícone e texto.

| Estado | Tom proposto | Token | Onde aparece |
| --- | --- | --- | --- |
| Sucesso | #5F6B4F (verde musgo) | `success` | Meta batida, prêmio conquistado, venda salva |
| Alerta | #8A6638 (caqui escuro) | `warning` | Cliente esfriando, venda aguardando envio |
| Erro | #9A4A3C (terracota) | `danger` | Erro de campo, excluir venda |

Cada estado tem um fundo claro para faixas e selos: o mesmo tom a 10% de opacidade sobre `surface`. Nunca usar estado como decoração.

**Cor das peças.** A bolinha de cor da peça Miz usa o tom real da cor (preta, off white, gelo, caqui, verde musgo, marrom cacau, verde menta, azul marinho). Esses tons ficam no catálogo, um por cor; é a única cor fora da paleta permitida dentro da interface. **A PREENCHER:** hex oficial de cada cor da cartela Miz.

## 3. Tipografia

Uma família só: Quicksand (Google Fonts). Títulos em Bold 700; texto em Regular 400; rótulos de interface e botões em SemiBold 600, para não sumirem na tela do celular. A forma arredondada da Quicksand fica sofisticada quando ganha espaço e tamanhos contidos; fica infantil quando é usada grande demais e apertada.

**Escala**

| Estilo | Celular (tamanho/entrelinha) | Computador | Peso | Uso |
| --- | --- | --- | --- | --- |
| `display` | 40/44 | 48/52 | 700 | O número da meta, o total da venda salva |
| `h1` | 24/30 | 28/34 | 700 | Título da página ("Hoje", "Clientes") |
| `h2` | 18/24 | 20/26 | 700 | Título de seção dentro da página |
| `h3` | 16/22 | 16/22 | 700 | Nome da cliente no card, título de card |
| `body` | 16/24 | 15/22 | 400 | Texto corrido, conteúdo dos campos |
| `body-sm` | 14/20 | 13/18 | 400 | Texto de apoio, linhas de tabela |
| `label` | 14/20 | 14/20 | 600 | Rótulos de campo, chips, botões |
| `overline` | 11/14, caixa alta, espaçamento +0,08em | 11/14 | 600 | Rótulos editoriais acima de números e seções ("FALTAM", "VENDIDO NO MÊS") |
| `caption` | 12/16 | 12/16 | 400 | Legendas, "há 18 dias", rodapé de gráfico |

**Regras**

- Texto dentro de campo é sempre 16 px no celular: abaixo disso o iPhone dá zoom na página ao tocar.
- Números grandes (`display`) levam espaçamento −0,01em e "R$" em `h2`, alinhado pela base, em `text-secondary`: o valor manda, a moeda acompanha.
- Valores em colunas de tabela alinhados à direita, com números de largura fixa (`tabular-nums`; testar se a Quicksand responde, senão manter o alinhamento à direita).
- Caixa alta só no `overline`. Nunca em botões, títulos ou parágrafos.
- Itálico não existe na Quicksand: ênfase por peso (600) ou por cor (`text-primary` contra `text-secondary`).
- Máximo de 3 tamanhos diferentes por card.

## 4. Espaçamento, grid, raios, bordas, sombras e ícones

Base de 4 px. Todo espaço do sistema sai desta escala: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 · 72.

**Grid**

|  | Celular (até 767 px) | Tablet (768–1199 px) | Computador (1200 px+) |
| --- | --- | --- | --- |
| Margem lateral | 20 | 32 | 40 |
| Colunas | 4 | 8 | 12 |
| Espaço entre colunas | 12 | 16 | 24 |
| Largura máxima do conteúdo | — | — | 1200 (Visão geral); 720 (Lançar venda, formulários) |
| Navegação | Rodapé fixo, 72 de altura | Rodapé fixo | Barra lateral de 248 |

**Ritmo vertical:** 8 entre itens do mesmo grupo · 16 entre elementos de um card · 24 entre cards · 40 entre seções da página.

**Raios**

| Token | Valor | Onde |
| --- | --- | --- |
| `radius-sm` | 6 | Chips, selos, campos de quantidade |
| `radius-md` | 10 | Botões, campos de texto, busca |
| `radius-lg` | 16 | Cards, folha inferior |
| `radius-full` | 999 | Só bolinha de cor, avatar de iniciais e contador numérico |

Nada de botão em formato de pílula: o raio de 10 é o que separa "sofisticado" de "aplicativo genérico".

**Bordas:** 1 px `border-subtle` em cards; 1 px `border` em campos e chips; 1,5 px `primary` no foco e no item selecionado. Divisores de lista: 1 px `border-subtle`, recuados 20 px da esquerda.

**Sombras:** cards não têm sombra. Só três elementos flutuam:

| Token | Valor | Onde |
| --- | --- | --- |
| `shadow-float` | 0 8px 24px rgba(34, 31, 28, 0.08) | Folha inferior, menu, seletor de data |
| `shadow-fab` | 0 6px 16px rgba(34, 31, 28, 0.18) | Botão "+ Venda" no rodapé |
| `shadow-top` | 0 −1px 0 #E6E3DB | Linha acima do rodapé fixo |

**Ícones:** biblioteca de traço fino (Phosphor Light ou Lucide com traço 1,5), sempre contorno, nunca preenchidos nem coloridos. Tamanhos 20 (dentro de botões e campos) e 24 (navegação). Cor `text-secondary`; `text-primary` quando ativos. Ícone nunca fica sozinho onde o significado não é universal: "WhatsApp", "Transferir" e "Pular hoje" levam texto. Sem emojis na interface.

## 5. Botões

Seis tipos, uma regra: no máximo um botão primário visível por tela.

| Tipo | Aparência | Texto | Uso |
| --- | --- | --- | --- |
| **Primário** | Fundo `primary`, sem borda | Branco, `label` | A ação que conclui: Salvar venda, Publicar meta, Entrar |
| **Secundário** | Fundo `surface`, borda 1 px `border` | `text-primary`, `label` | Ação alternativa ao lado do primário: Salvar rascunho, Buscar de novo |
| **Texto** | Sem fundo nem borda, sublinhado de 1 px a 3 px da base | `text-primary`, `label` | Ações leves: Trocar, Ver todas, Pular hoje |
| **WhatsApp** | Fundo `surface`, borda 1 px `border`, ícone de conversa em traço à esquerda | `text-primary`, "WhatsApp" | Todo botão que abre conversa. Sem o verde do WhatsApp: a marca é a Miz |
| **+ Venda (flutuante)** | Quadrado de 56 com raio 16, fundo `primary`, ícone "+" branco de 24, `shadow-fab`; no rodapé, sobe 16 acima da linha | Rótulo "Venda" em `caption` abaixo | Só no rodapé do celular. No computador vira botão primário no topo da barra lateral |
| **Destrutivo** | Fundo `surface`, borda 1 px `danger`, texto `danger` | `label` | Excluir venda, Desativar vendedora. Sempre pede confirmação |

**Tamanhos**

| Tamanho | Altura | Espaço lateral | Onde |
| --- | --- | --- | --- |
| Grande | 56 | 24 | Botão principal de formulário no celular, de largura total, preso ao rodapé da tela |
| Médio | 48 | 20 | Padrão no celular e no computador |
| Pequeno | 36 | 14 | Dentro de cards (WhatsApp, Transferir), tabelas e filtros. Área de toque continua 48: o espaço extra é invisível |

**Estados**

| Estado | Primário | Secundário / WhatsApp |
| --- | --- | --- |
| Normal | `primary` | Borda `border` |
| Hover (computador) | `primary-hover` | Fundo `background-muted` |
| Pressionado | `pressed`, escala 0,98 | Fundo `background-muted`, borda `border-strong` |
| Foco (teclado) | Anel de 2 px `primary` a 2 px de distância | Igual |
| Desabilitado | Fundo `border-subtle`, texto `icon-muted` | Borda `border-subtle`, texto `icon-muted` |
| Carregando | Texto some, três pontos animados brancos no lugar; largura não muda | Igual, pontos `text-secondary` |

**Regras de uso**

- Texto do botão é verbo + objeto, no máximo 3 palavras: "Salvar venda", não "Clique aqui para salvar".
- Ícone no botão só quando ajuda a reconhecer (WhatsApp, +, lixeira); sempre à esquerda do texto, a 8 px.
- No celular, o botão que conclui um fluxo fica preso no rodapé da tela, acima da área segura do aparelho, com fundo `background` e linha `shadow-top` acima.
- Dois botões lado a lado: secundário à esquerda, primário à direita, mesma altura, 12 de espaço.

## 6. Cards

Todo card nasce da mesma base: fundo `surface`, borda 1 px `border-subtle`, raio 16, espaço interno 16 no celular e 20 no computador, sem sombra. Toque no card inteiro abre o detalhe; botões dentro dele têm a própria ação. Ao tocar: fundo `background-muted` por 150 ms.

| Card | Anatomia (de cima para baixo, da esquerda para a direita) | Onde |
| --- | --- | --- |
| **Cliente** | Linha 1: nome em `h3` + selo de status à direita. Linha 2: motivo ou situação em `body-sm` `text-secondary` ("Comprou há 5 dias · R$ 289"). Linha 3: botão WhatsApp pequeno à esquerda; "Pular hoje" em botão de texto à direita (só nas pastas) | Pastas de Hoje, kanban, busca |
| **Pasta** | Retângulo de 1/3 da largura, altura 104. `overline` com o nome da pasta ("PÓS-VENDA") no alto; contador em `display` 32 embaixo, à esquerda. Pasta vazia: contador em `icon-muted`, sem toque | Hoje |
| **Número (KPI)** | `overline` com o nome ("FATURAMENTO"); valor em `h1` (celular) ou `display` (computador); variação em `caption` ("+12% vs. setembro"), sem seta colorida: sinal + ou − no texto | Visão geral, Metas, Equipe |
| **Peça Miz** | Sem foto (o MIZ Loja não guarda imagens). Altura 64, raio 16, borda 1 px `border-subtle`. À esquerda, nome em `label` e código em `caption` `text-tertiary`; à direita, até 6 bolinhas de 10 px com as cores disponíveis (borda 1 px `border` nas cores claras). Selecionado: borda 1,5 `primary` e fundo `background-muted`. No Lançar venda, as peças aparecem em lista desses cards | Lançar venda, passo 2; Catálogo |
| **Item adicionado** | Linha única sem borda própria, dentro de um card de lista: bolinha de cor de 12 + "Blusa Mia · Preta · M · 1" em `body` + lixeira de 20 à direita. Divisor entre itens | Lançar venda, resumo da venda |
| **Venda** | Linha 1: nome da cliente em `h3` + valor à direita em `h3`. Linha 2: itens resumidos em `body-sm` `text-secondary`. Linha 3: data, vendedora e pagamento em `caption` | Lista de vendas, histórico da ficha |
| **Meta** | `overline` "FALTAM"; valor em `display`; barra de progresso de 8 de altura; linha em `body-sm` com vendido, meta e % | Hoje (versão compacta: sem `display`, só barra e linha), Metas |
| **Prêmio** | Fundo `background-muted`, sem borda. `overline` "PRÊMIO"; descrição em `h3`; condição em `body-sm` ("Ao bater 100% da meta"). Conquistado: fundo `primary`, texto branco, `overline` "CONQUISTADO" | Metas, Hoje |
| **Folha inferior** | Painel que sobe do rodapé no celular, fundo `surface`, raio 16 só em cima, alça de 32×4 `border` centralizada, `shadow-float`. No computador vira janela central de até 560 de largura | Transferir, filtros, confirmações |

**Regras**

- Um card, uma ideia. Se precisar de mais de 3 linhas de informação, a informação vai para o detalhe.
- Cards da mesma lista têm altura igual sempre que possível; texto longo corta com reticências na 1ª linha, nunca quebra o card.
- Nunca card dentro de card. Agrupamento interno é feito com divisor ou espaço.
- Nunca ícone decorativo em círculo colorido no topo do card.

## 7. Campos e seleção

Campos de texto só onde não há como tocar. Tudo que tem lista curta vira chip.

**Campo de texto (base)**

- Altura 52, raio 10, fundo `surface`, borda 1 px `border`, espaço interno 16, texto `body` 16 px.
- Rótulo acima, em `label` `text-secondary`, a 8 px do campo; obrigatório marcado só com "\*" após o rótulo.
- Foco: borda 1,5 px `primary`, sem brilho colorido. Erro: borda 1,5 px `danger` + mensagem em `caption` `danger` abaixo, com ícone de alerta de 16. A mensagem diz o que fazer ("Digite o WhatsApp com DDD").
- Desabilitado: fundo `background-muted`, texto `icon-muted`.

| Campo | Particularidade |
| --- | --- |
| WhatsApp | Teclado numérico; máscara (31) 99999-9999 aplicada enquanto digita |
| Valor em R$ | Teclado numérico; "R$" fixo à esquerda em `text-secondary`; valor em `h2` dentro do campo, alinhado à direita; altura 64 |
| Data de nascimento | Três campos curtos (dia, mês, ano opcional) ou seletor nativo do aparelho; nunca calendário que obriga a navegar por anos |
| Busca | Ícone de lupa de 20 à esquerda, "x" para limpar à direita, raio 10, fundo `background-muted` sem borda; ao focar, fundo `surface` com borda `primary` |
| Observação | Área de texto de 3 linhas, cresce até 6 |
| Cor de outra marca | Campo de texto com sugestões em lista abaixo (cores já usadas na loja) |

**Chips de seleção**

| Chip | Aparência | Selecionado |
| --- | --- | --- |
| **Tamanho** | Quadrado de 48×48, raio 6, borda 1 px `border`, letra em `label` centralizada | Fundo `primary`, letra branca |
| **Cor Miz** | Altura 44, raio 6, borda 1 px `border`; bolinha de 16 com a cor real (borda 1 px `border` para cores claras) + nome em `body-sm` | Borda 1,5 `primary` e fundo `background-muted`; bolinha ganha anel de 2 px `primary` a 2 px |
| **Pagamento** | Altura 44, raio 6, borda 1 px `border`, texto `label` | Fundo `primary`, texto branco |
| **Filtro** | Altura 36, raio 6, fundo `background-muted`, sem borda, texto `body-sm` | Fundo `primary`, texto branco; "x" para remover |

Chips quebram linha com 8 de espaço, nunca rolagem lateral escondida. Escolha única: tocar em outro troca a seleção.

**Escolha grande (pergunta com 2 ou 3 respostas)**

Para "Quem está comprando?" e "Tem peça Miz?": cartões empilhados de largura total, altura 64, raio 16, borda 1 px `border`, texto `h3` à esquerda e seta fina à direita. Toque seleciona e avança, sem botão "Continuar".

**Quantidade:** grupo de 120×44 com "−", número em `label` e "+", raio 6, borda 1 px `border`. Mínimo 1; o "−" fica em `icon-muted` no 1.

**Indicador de passos (Lançar venda):** três traços de 24×3 no topo, a 8 de distância; passo atual e anteriores em `primary`, próximos em `border`. Abaixo, `overline` "PASSO 2 DE 3 · PEÇAS".

## 8. Navegação

| Elemento | Especificação |
| --- | --- |
| **Rodapé (celular)** | Altura 72 + área segura do aparelho; fundo `surface`; linha `shadow-top`. Cinco posições iguais: Hoje · Clientes · + Venda · Metas · Perfil (ADM: Visão geral · Vendas · + Venda · Clientes · Mais). Ícone de 24 em traço + rótulo em `caption`. Ativo: ícone e rótulo `text-primary`, rótulo em 600, traço de 16×2 `primary` acima do ícone. Inativo: `icon-muted`. O + Venda é o botão flutuante da seção 5 |
| **Barra lateral (computador, ADM)** | Largura 248, fundo `surface-inverse`. Logo MIZ em branco no topo (altura 20), a 32 da borda. Botão "+ Venda" primário invertido (fundo branco, texto `primary`) de largura total. Itens com altura 44, raio 10, ícone 20 + texto `label` em #BEB8B1; ativo: fundo #4E4841 e texto branco. Rodapé da barra: nome da loja e da pessoa em `caption`, link Sair |
| **Topo da página** | Altura 64. Celular: título `h1` à esquerda; ação secundária à direita (filtro, busca) como ícone de 24 com área de 48. Páginas de detalhe: seta de voltar + título `h2`. Ao rolar, o título encolhe para `h3` e ganha fundo `background` com linha `border-subtle` embaixo |
| **Abas (colunas do kanban no celular)** | Linha rolável de abas em `label`, com o contador em `caption` ao lado ("Recompra 12"). Ativa: `text-primary` e sublinhado de 2 `primary`; inativas: `text-secondary`. Linha `border-subtle` embaixo de todas |
| **Controle de período (dashboard)** | Grupo segmentado: altura 40, fundo `background-muted`, raio 10; opção ativa em `surface` com borda `border` e texto 600 |

No computador, o painel da vendedora usa a mesma barra lateral, com os itens dela. O Modo vendedora da ADM mostra uma faixa fina no topo, fundo `background-muted`, "Você está no modo vendedora · Voltar ao painel".

## 9. Feedback e dados

**Selos de status da cliente.** Altura 24, raio 6, texto `caption` 600, sem ícone. Monocromáticos, diferenciados por preenchimento, para não virarem um arco-íris na lista:

| Status | Aparência |
| --- | --- |
| VIP | Fundo `primary`, texto branco |
| Ativa | Borda 1 px `primary`, texto `text-primary` |
| Nova | Fundo `background-muted`, texto `text-primary` |
| Esfriando | Fundo `warning` a 10%, texto `warning` |
| Sumida | Borda 1 px `border-strong`, texto `text-secondary` |
| Inativa | Texto `icon-muted`, sem fundo nem borda |

**Barra de progresso (meta).** Altura 8, raio 4, trilho `border-subtle`, preenchimento `primary`. Ao bater 100%, preenchimento `success` e selo "Meta batida". Acima de 100%, a barra fica cheia e o % aparece ao lado ("112%"). Nunca barra em degradê.

**Toast (aviso rápido).** Aparece 16 acima do rodapé, largura total menos as margens, fundo `surface-inverse`, texto branco `body-sm`, raio 10, some em 3 s. Uma ação opcional em texto à direita ("Desfazer"). Ex.: "Venda salva", "Cliente transferida para Júlia".

**Tela de sucesso da venda.** Fundo `background`, ícone de check em traço 48 `success`, valor em `display`, linha "faltam R$ 1.390 para sua meta" em `body` `text-secondary`, três botões empilhados. Sem confete, sem animação de festa.

**Estado vazio.** Texto curto em `body` `text-secondary`, centralizado na área, com uma ação em botão secundário. Sem ilustração genérica; no máximo um ícone em traço de 32 em `icon-muted`. Ex.: "Nenhuma cliente esfriando. Boa!".

**Carregando.** Esqueleto com os mesmos formatos dos cards, em `background-muted`, pulsando suave (opacidade 1 → 0,6). Nunca rodinha girando no meio da tela; nunca tela branca.

**Confirmação.** Folha inferior com pergunta em `h3`, consequência em `body-sm` ("As 23 clientes dela vão para você") e dois botões. Só para ações que não se desfazem.

**Gráficos**

- Séries em tons da paleta, do escuro para o claro: `primary` → #645D54 → #999085 → #BEB8B1 → #E6E3DB. Uma série só = `primary`.
- Destaque (o mês atual, a vendedora selecionada) em `primary`; o resto em #BEB8B1.
- Barras com raio 4 só na ponta, espessura máxima 24, espaço entre barras igual a meia barra.
- Linhas de grade horizontais em `border-subtle`, nada de grade vertical; eixo sem linha.
- Valor escrito na ponta da barra em `caption`; legenda só quando houver mais de uma série.
- Gráfico de cor vendida: barras horizontais com a bolinha da cor real antes do nome. Nunca pizza.

## 10. Movimento e microinterações

Movimento serve para mostrar de onde algo veio e para onde foi. Nada pula, nada quica, nada brilha.

| Token | Duração | Curva | Uso |
| --- | --- | --- | --- |
| `motion-fast` | 120 ms | ease-out | Hover, toque, troca de chip |
| `motion-base` | 200 ms | cubic-bezier(0.2, 0, 0, 1) | Folha inferior subindo, troca de passo, card saindo da pasta |
| `motion-slow` | 320 ms | cubic-bezier(0.2, 0, 0, 1) | Barra de meta enchendo ao abrir a página |

- Card que sai da pasta após o WhatsApp: desliza 24 px para a esquerda e some; os de baixo sobem.
- Troca de passo no Lançar venda: o conteúdo novo entra da direita 16 px com opacidade; voltar faz o inverso.
- Botão pressionado: escala 0,98 por `motion-fast`.
- Respeitar "reduzir movimento" do aparelho: todas as transições viram troca direta de opacidade.

## 11. Voz e microcopy

A interface fala como uma gerente de loja experiente: direta, gentil, sem gíria de tecnologia e sem exagero.

| Em vez de | Escreva |
| --- | --- |
| "Operação realizada com sucesso!" | "Venda salva" |
| "Você atingiu 72% do seu target mensal" | "Faltam R$ 1.680 para a meta" |
| "Nenhum registro encontrado" | "Não encontramos 'Fernanda'." |
| "Erro: campo inválido" | "Digite o WhatsApp com DDD" |
| "Deseja realmente excluir?" | "Excluir esta venda? O valor sai da meta da Carla." |
| "Parabéns!!! 🎉" | "Meta batida" |

- Tratar a usuária por "você"; a cliente pelo primeiro nome.
- Frases de até 12 palavras na interface; títulos sem ponto final.
- Números sempre com o formato brasileiro (R$ 1.680,00 em tabelas; R$ 1.680 em destaques).
- Datas relativas até 7 dias ("há 3 dias", "ontem"); depois, "12 de set.".

## 12. Acessibilidade e responsividade

- Área de toque mínima de 48×48 em tudo que é tocável, mesmo quando o desenho é menor.
- Contraste conforme a tabela da seção 2; nenhuma informação só por cor (status sempre com texto, erro sempre com mensagem).
- Foco visível em toda a navegação por teclado: anel de 2 px `primary` a 2 px.
- Celular primeiro: desenhar em 375 px de largura e testar em 360 (Android de entrada) e 430 (iPhone grande).
- Telas de operação da vendedora (Hoje, Lançar venda, Ficha, Metas) cabem com uma mão: ações principais na metade de baixo da tela.
- Computador: a Visão geral usa o grid de 12 colunas; KPIs em 4 por linha; gráficos em 2 por linha; formulários nunca passam de 720 de largura.
- Fonte com `font-display: swap` e pré-carregamento dos pesos 400, 600 e 700; nada além disso.

## 13. O que nunca fazer

Estes são os sinais que fazem uma tela parecer gerada por ferramenta pronta. Qualquer um deles reprova a tela na revisão.

| Proibido | Por quê | Fazer no lugar |
| --- | --- | --- |
| Degradês (roxo, azul, "aurora") | Assinatura de template de IA | Cores chapadas da paleta |
| Fonte Inter, Poppins ou do sistema | Cara de painel genérico | Só Quicksand |
| Botões em pílula e tudo arredondado ao máximo | Infantiliza a Quicksand | Raio 10 em botões, 16 em cards |
| Sombras em todos os cards | Visual de "dashboard de SaaS" | Borda de 1 px e espaço |
| Ícone dentro de círculo colorido no topo de cada card | O clichê número 1 de painel feito por IA | Rótulo `overline` + número grande |
| Emojis na interface (✨🚀🎉) | Infantil e fora da marca | Texto direto |
| Vidro fosco, brilho, neon, bordas iluminadas | Tendência passageira, não luxo | Superfície branca e borda fina |
| Ilustrações de bonequinhos em estado vazio | Genérico e sem relação com moda | Texto + ação; no máximo ícone em traço |
| Verde do WhatsApp nos botões | Quebra a paleta; a marca é a Miz | Botão secundário com ícone em traço |
| Tudo centralizado | Parece landing page | Alinhamento à esquerda, grid editorial |
| Cinco cores de status na mesma lista | Ruído visual | Selos monocromáticos (seção 9) |
| Texto em caixa alta em botões | Grita | Caixa alta só no `overline` |
| Confete, fogos, animação de festa | Barateia a conquista | "Meta batida" com selo `success` |

**Referências de clima (não de cópia):** etiquetas e fichas técnicas de coleção, catálogos de marcas de moda europeias, lookbooks, o próprio showroom da Miz em BH. O sistema deve parecer parte desse universo, não de um painel de métricas.

## 14. Telas-chave no celular

As duas telas mais usadas, montadas só com os componentes deste documento. Na tela real, tudo o que aparece com traço de destaque é `primary` (#221F1C) preenchido com texto branco.

&#91;embedded content: wireframe · Hoje e Lançar venda no celular\]

Na tela Hoje, o número da meta e as três pastas cabem sem rolar; no Lançar venda, a cliente fica fixa no topo e o botão de concluir fica preso ao rodapé, no alcance do polegar.

## 15. Tokens para o desenvolvimento

Os nomes abaixo viram variáveis CSS (ex.: `--color-primary`) e, se o time usar Tailwind, as mesmas chaves no tema. Nenhum valor de cor, raio, espaço ou fonte é escrito direto no componente.

```css
:root {
  /* Cores */
  --color-surface: #FFFFFF;
  --color-background: #F7F6F3;
  --color-background-muted: #EEECE7;
  --color-border-subtle: #E6E3DB;
  --color-border: #D1CCC7;
  --color-border-strong: #BEB8B1;
  --color-icon-muted: #ABA49B;
  --color-text-placeholder: #999085;
  --color-text-tertiary: #7A7266;
  --color-text-secondary: #645D54;
  --color-primary-hover: #4E4841;
  --color-surface-inverse: #38332E;
  --color-primary: #221F1C;
  --color-text-primary: #221F1C;
  --color-pressed: #000000;
  --color-success: #5F6B4F;   /* proposta */
  --color-warning: #8A6638;   /* proposta */
  --color-danger: #9A4A3C;    /* proposta */

  /* Tipografia */
  --font-family: 'Quicksand', 'Nunito', sans-serif;
  --font-regular: 400;
  --font-semibold: 600;
  --font-bold: 700;

  /* Espaço */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
  --space-14: 56px; --space-18: 72px;

  /* Raios */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 999px;

  /* Sombras */
  --shadow-float: 0 8px 24px rgba(34, 31, 28, 0.08);
  --shadow-fab: 0 6px 16px rgba(34, 31, 28, 0.18);
  --shadow-top: 0 -1px 0 #E6E3DB;

  /* Movimento */
  --motion-fast: 120ms ease-out;
  --motion-base: 200ms cubic-bezier(0.2, 0, 0, 1);
  --motion-slow: 320ms cubic-bezier(0.2, 0, 0, 1);
}
```

**Componentes a construir primeiro (ordem):** Botão (6 tipos) → Campo de texto e Busca → Chips (tamanho, cor, pagamento, filtro) → Escolha grande → Quantidade → Card base e suas 9 variações → Selo de status → Barra de progresso → Rodapé e barra lateral → Folha inferior → Toast → Esqueleto. Com eles prontos, as telas do Lançar venda e do Hoje se montam sem componente novo.
