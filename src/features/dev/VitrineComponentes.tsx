import { useState, type ReactNode } from 'react'
import {
  ChartBar,
  ClipboardText,
  Gear,
  House,
  Receipt,
  Storefront,
  Target,
  User,
  UsersThree,
  Sparkle,
} from '@phosphor-icons/react'
import {
  BottomNav,
  BottomSheet,
  Button,
  Card,
  CardCliente,
  CardKpi,
  CardMeta,
  CardPasta,
  CardPeca,
  CardPremio,
  CardVenda,
  ChipCor,
  ChipFiltro,
  ChipGroup,
  ChipPagamento,
  ChipTamanho,
  ChoiceCard,
  ConfirmSheet,
  DateParts,
  EmptyState,
  FabVenda,
  ItemLinha,
  MoneyField,
  Overline,
  PasswordField,
  PhoneField,
  ProgressBar,
  QuantityStepper,
  SearchField,
  SegmentedControl,
  Selo,
  Sidebar,
  Skeleton,
  SkeletonCard,
  StatusBadge,
  StepIndicator,
  Tabs,
  TextArea,
  TextField,
  TopBar,
  useToast,
  type DataPartes,
  type StatusCliente,
} from '@/components/ui'

/**
 * /dev/componentes — vitrine de todos os componentes e estados do design system.
 * Só existe em desenvolvimento (npm run dev). Revise em 375 px e em 1280 px.
 */

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border-subtle pt-6">
      <h2 className="text-h2">{titulo}</h2>
      {children}
    </section>
  )
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Overline>{rotulo}</Overline>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

const CORES_PECA = [
  { id: '1', nome: 'Preto', hex: '#000000' },
  { id: '2', nome: 'Off White', hex: '#f1eef1' },
  { id: '3', nome: 'Gelo', hex: '#eae0dc' },
  { id: '4', nome: 'Caqui', hex: '#b79a85' },
  { id: '5', nome: 'Verde Musgo', hex: '#82654c' },
  { id: '6', nome: 'Marrom Cacau', hex: '#4c2e26' },
  { id: '7', nome: 'Azul Marinho', hex: '#2e2c41' },
]

const TOKENS_COR = [
  'surface',
  'background',
  'background-muted',
  'border-subtle',
  'border',
  'border-strong',
  'icon-muted',
  'text-placeholder',
  'text-tertiary',
  'text-secondary',
  'primary-hover',
  'surface-inverse',
  'primary',
  'pressed',
  'success',
  'warning',
  'danger',
]

export default function VitrineComponentes() {
  const toast = useToast()
  const [tel, setTel] = useState('')
  const [valor, setValor] = useState<number | null>(289.8)
  const [busca, setBusca] = useState('')
  const [obs, setObs] = useState('')
  const [data, setData] = useState<DataPartes>({ dia: '6', mes: '10', ano: '' })
  const [tam, setTam] = useState('M')
  const [cor, setCor] = useState('1')
  const [pag, setPag] = useState('pix')
  const [filtros, setFiltros] = useState<string[]>(['Minhas clientes'])
  const [qtd, setQtd] = useState(1)
  const [escolha, setEscolha] = useState<string | null>(null)
  const [aba, setAba] = useState('recompra')
  const [periodo, setPeriodo] = useState<'hoje' | '7d' | 'mes' | 'passado'>('mes')
  const [folha, setFolha] = useState(false)
  const [confirma, setConfirma] = useState(false)
  const [pecaSel, setPecaSel] = useState('mia')
  const [carregando, setCarregando] = useState(false)

  const variantes = ['primario', 'secundario', 'texto', 'whatsapp', 'destrutivo'] as const
  const rotulos = { primario: 'Salvar venda', secundario: 'Salvar rascunho', texto: 'Pular hoje', whatsapp: 'WhatsApp', destrutivo: 'Excluir venda' }

  return (
    <div className="pb-40 lg:pb-10 lg:pl-sidebar">
      <Sidebar
        itens={[
          { id: 'g', rotulo: 'Visão geral', icone: <ChartBar weight="light" />, ativo: true, onClick: () => {} },
          { id: 'v', rotulo: 'Vendas', icone: <Receipt weight="light" />, onClick: () => {} },
          { id: 'c', rotulo: 'Clientes', icone: <UsersThree weight="light" />, onClick: () => {} },
          { id: 'e', rotulo: 'Equipe', icone: <User weight="light" />, onClick: () => {} },
          { id: 'm', rotulo: 'Metas e prêmios', icone: <Target weight="light" />, onClick: () => {} },
          { id: 'cfg', rotulo: 'Configurações', icone: <Gear weight="light" />, onClick: () => {} },
          { id: 'mv', rotulo: 'Modo vendedora', icone: <Storefront weight="light" />, onClick: () => {} },
        ]}
        onVenda={() => toast.mostrar('+ Venda')}
        rodape={{ loja: 'Loja Demonstração', pessoa: 'Mariana Dona' }}
        onSair={() => toast.mostrar('Sair')}
      />
      <TopBar titulo="Componentes" acao={<Selo tom="contorno">dev</Selo>} />

      <main className="mx-auto flex max-w-conteudo flex-col gap-10 px-gutter pt-4">
        <p className="text-body text-text-secondary">
          Vitrine do design system (docs/design-system.md). Confira em 375 px e em 1280 px. Só aparece em desenvolvimento.
        </p>

        <Secao titulo="Cores">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {TOKENS_COR.map((t) => (
              <div key={t} className="flex flex-col gap-1">
                <div className="h-14 rounded-md border border-border-subtle" style={{ backgroundColor: `var(--color-${t})` }} />
                <span className="text-caption text-text-tertiary">{t}</span>
              </div>
            ))}
          </div>
        </Secao>

        <Secao titulo="Tipografia">
          <div className="flex flex-col gap-3">
            <p className="text-display">R$ 1.680</p>
            <p className="text-h1">Hoje (h1)</p>
            <p className="text-h2">Título de seção (h2)</p>
            <p className="text-h3">Ana Paula Ribeiro (h3)</p>
            <p className="text-body">Texto corrido em body, 16 no celular e 15 no computador.</p>
            <p className="text-body-sm text-text-secondary">Texto de apoio em body-sm.</p>
            <p className="text-label">Rótulo (label)</p>
            <Overline>Vendido no mês (overline)</Overline>
            <p className="text-caption text-text-tertiary">há 18 dias (caption)</p>
          </div>
        </Secao>

        <Secao titulo="Botões">
          {(['grande', 'medio', 'pequeno'] as const).map((t) => (
            <Linha key={t} rotulo={`Tamanho ${t}`}>
              {variantes.map((v) => (
                <Button key={v} variante={v} tamanho={t}>
                  {v === 'whatsapp' ? undefined : rotulos[v]}
                </Button>
              ))}
            </Linha>
          ))}
          <Linha rotulo="Desabilitado">
            {variantes.map((v) => (
              <Button key={v} variante={v} disabled>
                {v === 'whatsapp' ? undefined : rotulos[v]}
              </Button>
            ))}
          </Linha>
          <Linha rotulo="Carregando (a largura não muda)">
            <Button carregando={carregando} onClick={() => { setCarregando(true); setTimeout(() => setCarregando(false), 1500) }}>
              Salvar venda
            </Button>
            <Button variante="secundario" carregando>
              Salvar rascunho
            </Button>
          </Linha>
          <Linha rotulo="Largura total (grande, preso ao rodapé no celular)">
            <Button tamanho="grande" larguraTotal>
              Salvar venda
            </Button>
          </Linha>
          <Linha rotulo="Dois botões lado a lado">
            <div className="flex w-full max-w-form gap-3">
              <Button variante="secundario" className="flex-1">Salvar rascunho</Button>
              <Button className="flex-1">Publicar meta</Button>
            </div>
          </Linha>
          <Linha rotulo="+ Venda (flutuante)">
            <div className="pt-6">
              <FabVenda onClick={() => toast.mostrar('Nova venda')} />
            </div>
          </Linha>
        </Secao>

        <Secao titulo="Campos">
          <div className="grid max-w-form gap-6">
            <TextField rotulo="Nome" obrigatorio placeholder="Nome da cliente" />
            <TextField rotulo="Nome" obrigatorio erro="Digite o nome da cliente" defaultValue="" />
            <TextField rotulo="Cidade" disabled defaultValue="Belo Horizonte" />
            <PhoneField rotulo="WhatsApp" obrigatorio value={tel} onChange={setTel} ajuda={tel ? `Digitado: ${tel}` : undefined} />
            <MoneyField rotulo="Valor total do pedido" obrigatorio value={valor} onChange={setValor} />
            <PasswordField rotulo="Senha" placeholder="Sua senha" />
            <SearchField value={busca} onChange={setBusca} placeholder="Buscar por nome ou WhatsApp" />
            <TextArea rotulo="Observações" value={obs} onChange={(e) => setObs(e.target.value)} maximo={500} placeholder="Prefere modelagem mais solta" />
            <DateParts value={data} onChange={setData} />
          </div>
        </Secao>

        <Secao titulo="Chips">
          <Linha rotulo="Tamanho">
            <ChipGroup rotulo="Tamanho">
              {['PP', 'P', 'M', 'G', 'GG', 'PP/P', 'M/G', 'Unico'].map((t) => (
                <ChipTamanho key={t} valor={t} selecionado={tam === t} onClick={() => setTam(t)} />
              ))}
            </ChipGroup>
          </Linha>
          <Linha rotulo="Cor Miz">
            <ChipGroup rotulo="Cor">
              {CORES_PECA.slice(0, 5).map((c) => (
                <ChipCor key={c.id} nome={c.nome} hex={c.hex} selecionado={cor === c.id} onClick={() => setCor(c.id)} />
              ))}
            </ChipGroup>
          </Linha>
          <Linha rotulo="Pagamento">
            <ChipGroup rotulo="Pagamento">
              {[
                ['pix', 'PIX'],
                ['cartao_credito', 'Cartão de crédito'],
                ['cartao_debito', 'Cartão de débito'],
                ['dinheiro', 'Dinheiro'],
                ['crediario', 'Crediário'],
              ].map(([v, r]) => (
                <ChipPagamento key={v} rotulo={r!} selecionado={pag === v} onClick={() => setPag(v!)} />
              ))}
            </ChipGroup>
          </Linha>
          <Linha rotulo="Filtro">
            <ChipGroup rotulo="Filtros">
              {['Minhas clientes', 'VIP', 'Aniversário'].map((f) => (
                <ChipFiltro
                  key={f}
                  rotulo={f}
                  selecionado={filtros.includes(f)}
                  onClick={() => setFiltros((x) => (x.includes(f) ? x : [...x, f]))}
                  onRemover={() => setFiltros((x) => x.filter((y) => y !== f))}
                />
              ))}
            </ChipGroup>
          </Linha>
        </Secao>

        <Secao titulo="Escolha grande, quantidade e passos">
          <div className="flex max-w-form flex-col gap-3">
            <StepIndicator atual={2} passos={['Cliente', 'Peças', 'Valor']} />
            {['Cliente nova', 'Já é cliente', 'Não sei'].map((o) => (
              <ChoiceCard key={o} selecionado={escolha === o} onClick={() => setEscolha(o)}>
                {o}
              </ChoiceCard>
            ))}
            <QuantityStepper value={qtd} onChange={setQtd} />
          </div>
        </Secao>

        <Secao titulo="Cards">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <p className="text-h3">Card base</p>
              <p className="text-body-sm text-text-secondary">Surface, borda 1 border-subtle, raio 16, sem sombra.</p>
            </Card>
            <CardKpi rotulo="Faturamento" valor="R$ 18.400" variacao="+12% vs. setembro" />
            <div className="flex gap-3">
              <CardPasta nome="Follow-up" quantidade={8} onClick={() => toast.mostrar('Follow-up')} />
              <CardPasta nome="Pós-venda" quantidade={3} onClick={() => toast.mostrar('Pós-venda')} ativa />
              <CardPasta nome="Aniversário" quantidade={0} />
            </div>
            <CardMeta vendido={4320} meta={6000} />
            <CardMeta vendido={4320} meta={6000} compacto />
            <CardMeta vendido={6720} meta={6000} />
            <CardPremio descricao="R$ 200 em compras na loja" condicao="Ao bater 100% da meta" />
            <CardPremio descricao="R$ 200 em compras na loja" condicao="Meta de outubro batida" conquistado />
            <div className="flex flex-col gap-2">
              <Overline>Peça Miz (sem foto)</Overline>
              {[
                { id: 'mia', nome: 'Blusa Mia', codigo: 'BL0001', cores: CORES_PECA.slice(0, 3) },
                { id: 'zoe', nome: 'Camiseta Manga Curta Zoe', codigo: 'CT0002', cores: CORES_PECA },
                { id: 'liz', nome: 'Camiseta Oversized Liz', codigo: 'CT0001', cores: CORES_PECA.slice(2, 4), inativa: true },
              ].map((p) => (
                <CardPeca key={p.id} nome={p.nome} codigo={p.codigo} cores={p.cores} inativa={p.inativa} selecionado={pecaSel === p.id} onClick={() => setPecaSel(p.id)} />
              ))}
            </div>
            <Card>
              <Overline>Itens adicionados</Overline>
              <ItemLinha hex="#000000" texto="Blusa Mia · Preto · M · 1" onRemover={() => toast.mostrar('Item removido')} />
              <ItemLinha hex="#f1eef1" texto="Camiseta Zoe · Off White · M/G · 2" onRemover={() => {}} />
              <ItemLinha hex={null} texto="Outra marca · azul bebê · G · 1" onRemover={() => {}} />
            </Card>
            <CardCliente
              nome="Ana Paula Ribeiro"
              status="esfriando"
              linha2="34 dias sem comprar · R$ 289"
              acoes={
                <>
                  <Button variante="whatsapp" tamanho="pequeno" />
                  <Button variante="texto">Pular hoje</Button>
                </>
              }
              onClick={() => toast.mostrar('Abrir ficha')}
            />
            <CardVenda cliente="Ana Paula Ribeiro" valor={289.8} itens="Blusa Mia Preta M + 1 peça" rodape="03/10 · Carla · PIX" onClick={() => {}} />
          </div>
        </Secao>

        <Secao titulo="Selos, barra e estados">
          <Linha rotulo="Status da cliente">
            {(['vip', 'ativa', 'nova', 'esfriando', 'sumida', 'inativa'] as StatusCliente[]).map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </Linha>
          <div className="flex max-w-form flex-col gap-4">
            <ProgressBar percentual={72} mostrarPercentual />
            <ProgressBar percentual={100} />
            <ProgressBar percentual={112} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonCard />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-pasta w-full" />
            </div>
          </div>
          <Card>
            <EmptyState
              icone={<Sparkle weight="light" />}
              texto="Nenhuma cliente esfriando. Boa!"
              acao={<Button variante="secundario">Ver todas</Button>}
            />
          </Card>
        </Secao>

        <Secao titulo="Navegação">
          <Tabs
            rotulo="Colunas do kanban"
            ativa={aba}
            onMudar={setAba}
            abas={[
              { id: 'novas', rotulo: 'Novas', contador: 4 },
              { id: 'conversa', rotulo: 'Em conversa', contador: 6 },
              { id: 'comprou', rotulo: 'Comprou', contador: 9 },
              { id: 'ativa', rotulo: 'Ativa', contador: 11 },
              { id: 'recompra', rotulo: 'Hora da recompra', contador: 12 },
              { id: 'sumidas', rotulo: 'Sumidas', contador: 7 },
            ]}
          />
          <SegmentedControl
            rotulo="Período"
            valor={periodo}
            onMudar={setPeriodo}
            opcoes={[
              { valor: 'hoje', rotulo: 'Hoje' },
              { valor: '7d', rotulo: '7 dias' },
              { valor: 'mes', rotulo: 'Este mês' },
              { valor: 'passado', rotulo: 'Mês passado' },
            ]}
          />
          <p className="text-body-sm text-text-secondary">
            Rodapé fixo no celular (abaixo) e barra lateral no computador (à esquerda).
          </p>
        </Secao>

        <Secao titulo="Folhas e avisos">
          <Linha rotulo="Abrir">
            <Button variante="secundario" onClick={() => setFolha(true)}>
              Folha inferior
            </Button>
            <Button variante="destrutivo" onClick={() => setConfirma(true)}>
              Desativar vendedora
            </Button>
            <Button variante="secundario" onClick={() => toast.mostrar('Cliente transferida para Júlia', { rotulo: 'Desfazer', onClick: () => {} })}>
              Toast
            </Button>
          </Linha>
        </Secao>
      </main>

      <BottomSheet aberta={folha} onFechar={() => setFolha(false)} titulo="Transferir atendimento" rodape={<Button larguraTotal onClick={() => setFolha(false)}>Transferir</Button>}>
        <div className="flex flex-col gap-4">
          <p className="text-body-sm text-text-secondary">Escolha a colega que vai atender a Ana Paula.</p>
          <ChoiceCard onClick={() => setFolha(false)}>Júlia Lima</ChoiceCard>
          <ChoiceCard onClick={() => setFolha(false)}>Carla Souza</ChoiceCard>
          <TextArea rotulo="Recado (opcional)" placeholder="Ela quer o blazer em caqui" />
        </div>
      </BottomSheet>
      <ConfirmSheet
        aberta={confirma}
        onFechar={() => setConfirma(false)}
        onConfirmar={() => {
          setConfirma(false)
          toast.mostrar('Vendedora desativada')
        }}
        pergunta="Desativar a Júlia?"
        consequencia="Ela perde o acesso na hora. As 23 clientes dela vão para você."
        textoConfirmar="Desativar"
        destrutivo
      />

      <BottomNav
        onVenda={() => toast.mostrar('Nova venda')}
        itens={[
          { id: 'hoje', rotulo: 'Hoje', icone: <House weight="light" />, ativo: true, onClick: () => {} },
          { id: 'cli', rotulo: 'Clientes', icone: <UsersThree weight="light" />, onClick: () => {} },
          { id: 'met', rotulo: 'Metas', icone: <Target weight="light" />, onClick: () => {} },
          { id: 'per', rotulo: 'Perfil', icone: <ClipboardText weight="light" />, onClick: () => {} },
        ]}
      />
    </div>
  )
}
