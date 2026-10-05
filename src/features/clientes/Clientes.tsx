import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { UsersThree } from '@phosphor-icons/react'
import {
  Button,
  Card,
  CardCliente,
  ChipFiltro,
  ChipGroup,
  EmptyState,
  SearchField,
  SegmentedControl,
  Selo,
  SkeletonCard,
  Tabs,
  TopBar,
  useToast,
} from '@/components/ui'
import { BotaoWhatsapp } from '@/components/shared/BotaoWhatsapp'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { useCaminhos } from '@/hooks/useCaminhos'
import { useConfigLoja } from '@/hooks/useDadosLoja'
import { usePressionarLongo } from '@/hooks/usePressionarLongo'
import { useTelaGrande } from '@/hooks/useTelaGrande'
import { cn } from '@/lib/cn'
import { mensagemDeErro } from '@/lib/erros'
import { formatarMoeda, haDias } from '@/lib/formatadores'
import { ETAPAS_QUADRO, atualizarCliente, listarClientes, type ClienteView, type EtapaKanban, type EtapaManual } from './api'
import { agruparPorEtapa, fazAniversario, filtrarClientes, type SeloFiltro } from './kanban'
import { FolhaMover } from './FolhaMover'

/** Cartões por "página" de cada coluna (o resto aparece em "Mostrar mais"). */
const PAGINA = 50
const CHAVE_LISTA = ['clientes', 'lista']
const COLUNAS_MANUAIS: EtapaKanban[] = ['novas', 'em_conversa']

/**
 * /clientes — kanban (especificação, seção 8). Celular: abas roláveis e uma coluna por vez;
 * computador: 6 colunas lado a lado, arrastando entre Novas e Em conversa.
 * "Sem interesse" fica fora do quadro, num filtro.
 */
export default function Clientes({ embutido = false }: { embutido?: boolean } = {}) {
  const { usuaria } = useSessao()
  const minhaId = usuaria?.id ?? ''
  const navegar = useNavigate()
  const caminhos = useCaminhos()
  const toast = useToast()
  const queryClient = useQueryClient()
  const telaGrande = useTelaGrande()
  const [params, setParams] = useSearchParams()
  const { data: config } = useConfigLoja()

  // Vendedora com visibilidade "proprias" vê só as dela; ADM (modo vendedora) pode ver todas
  const soPropriasPelaLoja = usuaria?.papel === 'vendedora' && (config?.visibilidade_vendedora ?? 'proprias') === 'proprias'
  const [escopo, setEscopo] = useState<'minhas' | 'todas'>(embutido ? 'todas' : 'minhas')
  const [busca, setBusca] = useState('')
  const [selo, setSelo] = useState<SeloFiltro | null>(null)
  const [mover, setMover] = useState<ClienteView | null>(null)

  const semInteresse = params.get('filtro') === 'sem_interesse'
  const coluna = (params.get('coluna') as EtapaKanban | null) ?? 'novas'
  const mudarParam = (chave: string, valor: string | null) => {
    const p = new URLSearchParams(params)
    if (valor) p.set(chave, valor)
    else p.delete(chave)
    setParams(p, { replace: true })
  }

  const { data, isLoading, error, refetch } = useQuery({ queryKey: CHAVE_LISTA, queryFn: listarClientes })

  const filtradas = useMemo(
    () => filtrarClientes(data ?? [], { busca, soMinhas: soPropriasPelaLoja || escopo === 'minhas', minhaId, selo }),
    [data, busca, soPropriasPelaLoja, escopo, minhaId, selo],
  )
  const grupos = useMemo(() => agruparPorEtapa(filtradas), [filtradas])

  const moverPara = async (c: ClienteView, etapa: EtapaManual | null) => {
    setMover(null)
    if (etapa !== null && c.etapa_kanban === etapa) return
    const anterior = queryClient.getQueryData<ClienteView[]>(CHAVE_LISTA)
    if (etapa) {
      queryClient.setQueryData<ClienteView[]>(CHAVE_LISTA, (lista) =>
        (lista ?? []).map((x) => (x.id === c.id ? { ...x, etapa_manual: etapa, etapa_kanban: etapa } : x)),
      )
    }
    try {
      await atualizarCliente(c.id, { etapa_manual: etapa })
      toast.mostrar(etapa === 'sem_interesse' ? `${c.nome.split(' ')[0]} foi para Sem interesse` : `${c.nome.split(' ')[0]} movida`)
    } catch (e) {
      if (anterior) queryClient.setQueryData(CHAVE_LISTA, anterior)
      toast.mostrar(mensagemDeErro(e))
    } finally {
      void queryClient.invalidateQueries({ queryKey: ['clientes'] })
      void queryClient.invalidateQueries({ queryKey: ['cliente', c.id] })
      void queryClient.invalidateQueries({ queryKey: ['hoje'] })
    }
  }

  const cartao = (c: ClienteView) => <CartaoKanban key={c.id} cliente={c} onAbrir={() => navegar(caminhos.ficha(c.id))} onMover={() => setMover(c)} />

  const abas = ETAPAS_QUADRO.map((e) => ({ id: e.id, rotulo: e.rotulo, contador: grupos[e.id].length }))

  let conteudo: ReactNode
  if (isLoading) {
    conteudo = (
      <div className="flex flex-col gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  } else if (error) {
    conteudo = (
      <Card>
        <EmptyState texto={mensagemDeErro(error)} acao={<Button variante="secundario" onClick={() => void refetch()}>Tentar de novo</Button>} />
      </Card>
    )
  } else if ((data ?? []).length === 0) {
    conteudo = (
      <Card>
        <EmptyState
          icone={<UsersThree weight="light" />}
          texto="Ainda não há clientes. Elas entram aqui ao lançar a primeira venda."
          acao={<Button onClick={() => navegar(caminhos.novaVenda())}>Lançar venda</Button>}
        />
      </Card>
    )
  } else if (semInteresse) {
    conteudo = <ListaPaginada clientes={grupos.sem_interesse} vazio="Ninguém em Sem interesse." render={cartao} />
  } else if (telaGrande) {
    conteudo = <QuadroComputador grupos={grupos} render={cartao} onSoltar={(c, etapa) => void moverPara(c, etapa)} />
  } else {
    conteudo = (
      <div className="flex flex-col gap-4">
        <Tabs abas={abas} ativa={coluna} onMudar={(id) => mudarParam('coluna', id)} rotulo="Colunas do quadro" />
        <ListaPaginada
          key={coluna}
          clientes={grupos[coluna === 'sem_interesse' ? 'novas' : coluna]}
          vazio="Ninguém nesta coluna agora."
          render={cartao}
        />
      </div>
    )
  }

  return (
    <>
      {!embutido && <TopBar titulo="Clientes" />}
      <div className={cn('mx-auto flex w-full flex-col gap-4 px-gutter pb-10 pt-2', telaGrande && !semInteresse ? 'max-w-none' : 'max-w-conteudo')}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchField value={busca} onChange={setBusca} placeholder="Nome ou WhatsApp" rotuloAcessivel="Buscar cliente" className="lg:max-w-form lg:flex-1" />
          {!soPropriasPelaLoja && (
            <SegmentedControl
              rotulo="Quais clientes"
              valor={escopo}
              onMudar={setEscopo}
              opcoes={[
                { valor: 'minhas', rotulo: 'Minhas clientes' },
                { valor: 'todas', rotulo: 'Todas' },
              ]}
            />
          )}
        </div>
        <ChipGroup rotulo="Filtros">
          {(
            [
              ['vip', 'VIP'],
              ['aniversario', 'Aniversário'],
              ['nova', 'Nova'],
            ] as const
          ).map(([id, rotulo]) => (
            <ChipFiltro
              key={id}
              rotulo={rotulo}
              selecionado={selo === id}
              onClick={() => setSelo(selo === id ? null : id)}
              onRemover={() => setSelo(null)}
            />
          ))}
          <ChipFiltro
            rotulo={`Sem interesse${data ? ` · ${grupos.sem_interesse.length}` : ''}`}
            selecionado={semInteresse}
            onClick={() => mudarParam('filtro', semInteresse ? null : 'sem_interesse')}
            onRemover={() => mudarParam('filtro', null)}
          />
        </ChipGroup>
        {conteudo}
      </div>
      <FolhaMover cliente={mover} onFechar={() => setMover(null)} onMover={(c, etapa) => void moverPara(c, etapa)} />
    </>
  )
}

/* ------------------------------------------------------------------ Cartão */

function CartaoKanban({ cliente: c, onAbrir, onMover }: { cliente: ClienteView; onAbrir: () => void; onMover: () => void }) {
  const longo = usePressionarLongo(onMover)
  const linha = c.ultima_compra_em
    ? `Última compra ${haDias(c.ultima_compra_em)}${c.ultima_compra_valor ? ` · ${formatarMoeda(c.ultima_compra_valor, { destaque: true })}` : ''}`
    : 'Ainda sem compra'
  const { foiLongo, ...gestos } = longo
  return (
    <CardCliente
      nome={c.nome}
      status={c.status}
      selo={fazAniversario(c) ? <Selo tom="alerta">Aniversário</Selo> : undefined}
      linha2={linha}
      onClick={() => {
        if (!foiLongo()) onAbrir()
      }}
      {...gestos}
      acoes={
        <>
          <BotaoWhatsapp clienteId={c.id} whatsapp={c.whatsapp} />
          <Button variante="texto" onClick={onMover}>
            Mover
          </Button>
        </>
      }
    />
  )
}

/* ------------------------------------------------------------------ Lista com "Mostrar mais" */

function ListaPaginada({ clientes, vazio, render }: { clientes: ClienteView[]; vazio: string; render: (c: ClienteView) => ReactNode }) {
  const [limite, setLimite] = useState(PAGINA)
  if (clientes.length === 0) return <p className="py-6 text-center text-body-sm text-text-secondary">{vazio}</p>
  return (
    <div className="flex flex-col gap-3">
      {clientes.slice(0, limite).map(render)}
      {clientes.length > limite && (
        <Button variante="secundario" onClick={() => setLimite((l) => l + PAGINA)}>
          Mostrar mais ({clientes.length - limite})
        </Button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Quadro no computador */

function QuadroComputador({
  grupos,
  render,
  onSoltar,
}: {
  grupos: Record<EtapaKanban, ClienteView[]>
  render: (c: ClienteView) => ReactNode
  onSoltar: (c: ClienteView, etapa: EtapaManual) => void
}) {
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor))
  const soltar = (e: DragEndEvent) => {
    const destino = e.over?.id as EtapaKanban | undefined
    const c = e.active.data.current?.cliente as ClienteView | undefined
    if (!c || !destino || destino === c.etapa_kanban || !COLUNAS_MANUAIS.includes(destino)) return
    onSoltar(c, destino as EtapaManual)
  }
  return (
    <DndContext sensors={sensores} onDragEnd={soltar}>
      <div className="grid grid-cols-6 gap-3">
        {ETAPAS_QUADRO.map((e) => (
          <Coluna key={e.id} id={e.id} rotulo={e.rotulo} manual={e.manual} total={grupos[e.id].length}>
            <ListaPaginada
              clientes={grupos[e.id]}
              vazio="Ninguém aqui."
              render={(c) =>
                e.manual && (c.num_compras ?? 0) === 0 ? (
                  <Arrastavel key={c.id} cliente={c}>
                    {render(c)}
                  </Arrastavel>
                ) : (
                  render(c)
                )
              }
            />
          </Coluna>
        ))}
      </div>
    </DndContext>
  )
}

function Coluna({ id, rotulo, manual, total, children }: { id: EtapaKanban; rotulo: string; manual: boolean; total: number; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !manual })
  return (
    <section
      ref={setNodeRef}
      aria-label={`${rotulo}: ${total}`}
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-lg bg-background-muted p-3 transition-[background-color] duration-fast',
        isOver && 'bg-border-subtle',
      )}
    >
      <header className="flex items-baseline justify-between gap-2 px-1">
        <h2 className="truncate text-label">{rotulo}</h2>
        <span className="numeros text-caption text-text-secondary">{total}</span>
      </header>
      {!manual && <p className="-mt-2 px-1 text-caption text-text-tertiary">Automática</p>}
      {children}
    </section>
  )
}

function Arrastavel({ cliente, children }: { cliente: ClienteView; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: cliente.id, data: { cliente } })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="cartão arrastável"
      className={cn('relative touch-none', isDragging && 'z-10 opacity-80 shadow-float')}
      // posição do arraste (calculada pelo dnd-kit a cada movimento)
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
    >
      {children}
    </div>
  )
}
