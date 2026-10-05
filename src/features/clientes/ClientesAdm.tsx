import { lazy, Suspense, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, DownloadSimple, Funnel } from '@phosphor-icons/react'
import {
  BolinhaCor,
  BottomSheet,
  Button,
  Card,
  CardCliente,
  Checkbox,
  ChoiceCard,
  EmptyState,
  MoneyField,
  SearchField,
  SegmentedControl,
  SelectField,
  SkeletonCard,
  StatusBadge,
  TextField,
  useToast,
  type StatusCliente,
} from '@/components/ui'
import { BotaoWhatsapp } from '@/components/shared/BotaoWhatsapp'
import { CabecalhoPagina } from '@/components/shared/CabecalhoPagina'
import { useAtraso } from '@/hooks/useAtraso'
import { useCatalogo, useEquipe, useHexDasCores } from '@/hooks/useDadosLoja'
import { useTelaGrande } from '@/hooks/useTelaGrande'
import { baixarArquivo, gerarCsv } from '@/lib/csv'
import { mensagemDeErro } from '@/lib/erros'
import { formatarData, formatarMoeda, haDias } from '@/lib/formatadores'
import { hojeIso } from '@/lib/periodo'
import { rotuloTamanho } from '@/lib/vendas'
import { formatarWhatsapp } from '@/lib/whatsapp'
import { atualizarCliente, ETAPAS_QUADRO, rotuloEtapa, transferirCliente, type EtapaKanban } from './api'
import { FILTROS_VAZIOS, listarClientesAdm, todasAsClientes, type ColunaOrdem, type FiltrosClientes, type LinhaCliente } from './admApi'

const Kanban = lazy(() => import('./Clientes'))
const POR_PAGINA = 50

const STATUS: Array<{ valor: StatusCliente; rotulo: string }> = [
  { valor: 'vip', rotulo: 'VIP' },
  { valor: 'ativa', rotulo: 'Ativa' },
  { valor: 'nova', rotulo: 'Nova' },
  { valor: 'esfriando', rotulo: 'Esfriando' },
  { valor: 'sumida', rotulo: 'Sumida' },
  { valor: 'inativa', rotulo: 'Inativa' },
]
const TAMANHOS = ['PP', 'PP/P', 'P', 'M', 'M/G', 'G', 'GG', 'Unico']

/** /adm/clientes — a base inteira da loja (especificação, seção 14). */
export default function ClientesAdm() {
  const [params, setParams] = useSearchParams()
  const visao = params.get('visao') === 'kanban' ? 'kanban' : 'tabela'

  return (
    <>
      <div className="mx-auto w-full max-w-conteudo px-gutter">
        <CabecalhoPagina
          titulo="Clientes"
          acao={
            <SegmentedControl
              rotulo="Visão"
              valor={visao}
              onMudar={(v) => {
                const p = new URLSearchParams(params)
                if (v === 'kanban') p.set('visao', 'kanban')
                else p.delete('visao')
                setParams(p, { replace: true })
              }}
              opcoes={[
                { valor: 'tabela', rotulo: 'Tabela' },
                { valor: 'kanban', rotulo: 'Kanban' },
              ]}
            />
          }
        />
      </div>
      {visao === 'kanban' ? (
        <Suspense fallback={<div className="px-gutter"><SkeletonCard /></div>}>
          <Kanban embutido />
        </Suspense>
      ) : (
        <Tabela />
      )}
    </>
  )
}

function Tabela() {
  const navegar = useNavigate()
  const [params] = useSearchParams()
  const toast = useToast()
  const queryClient = useQueryClient()
  const telaGrande = useTelaGrande()
  const hex = useHexDasCores()
  const { data: equipe } = useEquipe()
  const { data: catalogo } = useCatalogo()

  // filtros que chegam por link (Visão geral → saúde da base / aniversariantes)
  const [f, setF] = useState<FiltrosClientes>(() => ({
    ...FILTROS_VAZIOS,
    etapa: (params.get('etapa') as EtapaKanban | null) ?? '',
    aniversario: (params.get('aniversario') as FiltrosClientes['aniversario'] | null) ?? '',
    vendedora: params.get('vendedora') ?? '',
  }))
  const [ordem, setOrdem] = useState<ColunaOrdem>('nome')
  const [crescente, setCrescente] = useState(true)
  const [pagina, setPagina] = useState(0)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [lote, setLote] = useState<null | 'responsavel'>(null)
  const [exportando, setExportando] = useState(false)

  const buscaAtrasada = useAtraso(f.busca, 300)
  const filtros = useMemo(() => ({ ...f, busca: buscaAtrasada }), [f, buscaAtrasada])
  const lista = useQuery({
    queryKey: ['clientes', 'adm', filtros, ordem, crescente, pagina],
    queryFn: () => listarClientesAdm(filtros, ordem, crescente, pagina, POR_PAGINA),
    placeholderData: keepPreviousData,
  })

  const mudar = (parcial: Partial<FiltrosClientes>) => {
    setF((x) => ({ ...x, ...parcial }))
    setPagina(0)
    setSelecionadas(new Set())
  }
  const ordenar = (c: ColunaOrdem) => {
    if (ordem === c) setCrescente(!crescente)
    else {
      setOrdem(c)
      setCrescente(c === 'nome' || c === 'vendedora_nome')
    }
    setPagina(0)
  }

  const linhas = lista.data?.linhas ?? []
  const total = lista.data?.total ?? 0
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const ativos = Object.entries(f).filter(([k, v]) => k !== 'busca' && v !== '' && v !== null).length

  const cores = useMemo(() => {
    const s = new Set<string>()
    for (const p of catalogo ?? []) for (const c of p.cores) s.add(c.nome)
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [catalogo])

  const exportar = async () => {
    setExportando(true)
    try {
      const todas = await todasAsClientes(filtros, ordem, crescente)
      const csv = gerarCsv(todas, [
        { titulo: 'Nome', valor: (c) => c.nome },
        { titulo: 'WhatsApp', valor: (c) => formatarWhatsapp(c.whatsapp) },
        { titulo: 'Status', valor: (c) => STATUS.find((s) => s.valor === c.status)?.rotulo },
        { titulo: 'Etapa', valor: (c) => rotuloEtapa(c.etapa_kanban) },
        { titulo: 'Compras', valor: (c) => c.num_compras },
        { titulo: 'Total gasto', valor: (c) => c.total_gasto },
        { titulo: 'Ticket médio', valor: (c) => c.ticket_medio },
        { titulo: 'Compra a cada (dias)', valor: (c) => (c.intervalo_medio_dias === null ? null : Math.round(c.intervalo_medio_dias)) },
        { titulo: 'Última compra', valor: (c) => (c.ultima_compra_em ? formatarData(c.ultima_compra_em) : '') },
        { titulo: 'Tamanho', valor: (c) => rotuloTamanho(c.tamanho_preferido) },
        { titulo: 'Cores', valor: (c) => (c.cores_preferidas ?? []).join(', ') },
        { titulo: 'Aniversário', valor: (c) => (c.aniv_dia && c.aniv_mes ? `${String(c.aniv_dia).padStart(2, '0')}/${String(c.aniv_mes).padStart(2, '0')}` : '') },
        { titulo: 'Vendedora', valor: (c) => c.vendedora_nome },
      ])
      baixarArquivo(`clientes-${hojeIso()}.csv`, csv)
      toast.mostrar(`${todas.length} clientes exportadas`)
    } catch (e) {
      toast.mostrar(mensagemDeErro(e))
    } finally {
      setExportando(false)
    }
  }

  const moverSemInteresse = async () => {
    const ids = [...selecionadas]
    let ok = 0
    for (const id of ids) {
      try {
        await atualizarCliente(id, { etapa_manual: 'sem_interesse' })
        ok++
      } catch {
        // segue com as outras
      }
    }
    toast.mostrar(`${ok} ${ok === 1 ? 'cliente foi' : 'clientes foram'} para Sem interesse`)
    setSelecionadas(new Set())
    void queryClient.invalidateQueries({ queryKey: ['clientes'] })
  }

  const todasMarcadas = linhas.length > 0 && linhas.every((l) => selecionadas.has(l.id))
  const alternar = (id: string) =>
    setSelecionadas((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const cabecalho = (c: ColunaOrdem, rotulo: string, direita = false) => (
    <th className={direita ? 'px-3 py-3 text-right' : 'px-3 py-3'} aria-sort={ordem === c ? (crescente ? 'ascending' : 'descending') : undefined}>
      <button type="button" onClick={() => ordenar(c)} className="foco inline-flex items-center gap-1 rounded-sm text-label text-text-secondary hover:text-text-primary">
        {rotulo}
        {ordem === c && (crescente ? <ArrowUp weight="light" className="h-icone-sm w-icone-sm" /> : <ArrowDown weight="light" className="h-icone-sm w-icone-sm" />)}
      </button>
    </th>
  )

  return (
    <div className="mx-auto flex w-full max-w-conteudo flex-col gap-4 px-gutter pb-10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchField value={f.busca} onChange={(busca) => mudar({ busca })} placeholder="Nome ou WhatsApp" rotuloAcessivel="Buscar cliente" className="lg:max-w-form lg:flex-1" />
        <div className="flex flex-wrap gap-3">
          <Button variante="secundario" icone={<Funnel weight="light" className="h-icone w-icone" />} onClick={() => setFiltrosAbertos(true)}>
            Filtros{ativos ? ` · ${ativos}` : ''}
          </Button>
          <Button variante="secundario" icone={<DownloadSimple weight="light" className="h-icone w-icone" />} carregando={exportando} disabled={total === 0} onClick={() => void exportar()}>
            Exportar
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="numeros text-body-sm text-text-secondary">
          {lista.isLoading ? 'Carregando…' : `${total.toLocaleString('pt-BR')} ${total === 1 ? 'cliente' : 'clientes'}`}
          {ativos ? ' com os filtros' : ''}
        </p>
        {ativos > 0 && (
          <Button variante="texto" onClick={() => mudar({ ...FILTROS_VAZIOS, busca: f.busca })}>
            Limpar filtros
          </Button>
        )}
      </div>

      {selecionadas.size > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 bg-background-muted">
          <p className="text-label">{selecionadas.size} selecionada{selecionadas.size === 1 ? '' : 's'}</p>
          <div className="flex flex-wrap gap-3">
            <Button tamanho="pequeno" variante="secundario" onClick={() => setLote('responsavel')}>
              Trocar responsável
            </Button>
            <Button tamanho="pequeno" variante="secundario" onClick={() => void moverSemInteresse()}>
              Mover para Sem interesse
            </Button>
            <Button tamanho="pequeno" variante="texto" onClick={() => setSelecionadas(new Set())}>
              Limpar seleção
            </Button>
          </div>
        </Card>
      )}

      {lista.isLoading ? (
        <SkeletonCard linhas={6} />
      ) : lista.error ? (
        <Card>
          <EmptyState texto={mensagemDeErro(lista.error)} acao={<Button variante="secundario" onClick={() => void lista.refetch()}>Tentar de novo</Button>} />
        </Card>
      ) : linhas.length === 0 ? (
        <Card>
          <EmptyState texto={ativos || f.busca ? 'Nenhuma cliente com esses filtros.' : 'Ainda não há clientes. Elas entram ao lançar a primeira venda.'} />
        </Card>
      ) : telaGrande ? (
        <Card semPadding className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="bg-background-muted">
              <tr>
                <th className="w-toque px-2 py-3">
                  <Checkbox
                    rotulo="Selecionar as clientes da página"
                    marcado={todasMarcadas}
                    indeterminado={!todasMarcadas && linhas.some((l) => selecionadas.has(l.id))}
                    onMudar={(v) => setSelecionadas(v ? new Set(linhas.map((l) => l.id)) : new Set())}
                  />
                </th>
                {cabecalho('nome', 'Nome')}
                <th className="px-3 py-3 text-label text-text-secondary">WhatsApp</th>
                {cabecalho('status', 'Status')}
                {cabecalho('num_compras', 'Compras', true)}
                {cabecalho('total_gasto', 'Total gasto', true)}
                {cabecalho('ticket_medio', 'Ticket', true)}
                {cabecalho('intervalo_medio_dias', 'Compra a cada', true)}
                {cabecalho('ultima_compra_em', 'Última compra')}
                <th className="px-3 py-3 text-label text-text-secondary">Tamanho / cores</th>
                {cabecalho('vendedora_nome', 'Vendedora')}
              </tr>
            </thead>
            <tbody>
              {linhas.map((c) => (
                <tr key={c.id} className="cursor-pointer border-t border-border-subtle hover:bg-background-muted" onClick={() => navegar(`/adm/clientes/${c.id}`)}>
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox rotulo={`Selecionar ${c.nome}`} marcado={selecionadas.has(c.id)} onMudar={() => alternar(c.id)} />
                  </td>
                  <td className="px-3 py-2 text-label">{c.nome}</td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <BotaoWhatsapp clienteId={c.id} whatsapp={c.whatsapp} rotulo={formatarWhatsapp(c.whatsapp)} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="numeros px-3 py-2 text-right">{c.num_compras}</td>
                  <td className="numeros px-3 py-2 text-right">{formatarMoeda(c.total_gasto)}</td>
                  <td className="numeros px-3 py-2 text-right">{c.ticket_medio ? formatarMoeda(c.ticket_medio) : '—'}</td>
                  <td className="numeros px-3 py-2 text-right">{c.intervalo_medio_dias ? `${Math.round(c.intervalo_medio_dias)} dias` : '—'}</td>
                  <td className="px-3 py-2">{c.ultima_compra_em ? haDias(c.ultima_compra_em) : '—'}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      {c.tamanho_preferido ? rotuloTamanho(c.tamanho_preferido) : '—'}
                      {(c.cores_preferidas ?? []).slice(0, 2).map((cor) => (
                        <span key={cor} className="inline-flex items-center gap-1">
                          <BolinhaCor hex={hex(cor)} tamanho="pequena" />
                          {cor}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-3 py-2">{c.vendedora_nome ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <SelectField
            aria-label="Ordenar por"
            value={`${ordem}:${crescente ? 'asc' : 'desc'}`}
            onChange={(e) => {
              const [c, d] = e.target.value.split(':')
              setOrdem(c as ColunaOrdem)
              setCrescente(d === 'asc')
              setPagina(0)
            }}
            opcoes={[
              { valor: 'nome:asc', rotulo: 'Nome (A–Z)' },
              { valor: 'total_gasto:desc', rotulo: 'Maior total gasto' },
              { valor: 'num_compras:desc', rotulo: 'Mais compras' },
              { valor: 'ultima_compra_em:desc', rotulo: 'Compra mais recente' },
              { valor: 'ultima_compra_em:asc', rotulo: 'Compra mais antiga' },
            ]}
          />
          {linhas.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Checkbox rotulo={`Selecionar ${c.nome}`} marcado={selecionadas.has(c.id)} onMudar={() => alternar(c.id)} className="mt-4" />
              <div className="min-w-0 flex-1">
                <CardCliente
                  nome={c.nome}
                  status={c.status}
                  linha2={`${c.num_compras} compras · ${formatarMoeda(c.total_gasto, { destaque: true })}${c.ultima_compra_em ? ` · última ${haDias(c.ultima_compra_em)}` : ''} · ${c.vendedora_nome ?? 'sem responsável'}`}
                  onClick={() => navegar(`/adm/clientes/${c.id}`)}
                  acoes={<BotaoWhatsapp clienteId={c.id} whatsapp={c.whatsapp} />}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {paginas > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button variante="secundario" tamanho="pequeno" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>
            Anterior
          </Button>
          <p className="numeros text-body-sm text-text-secondary">
            Página {pagina + 1} de {paginas}
          </p>
          <Button variante="secundario" tamanho="pequeno" disabled={pagina + 1 >= paginas} onClick={() => setPagina(pagina + 1)}>
            Próxima
          </Button>
        </div>
      )}

      <BottomSheet aberta={filtrosAbertos} onFechar={() => setFiltrosAbertos(false)} titulo="Filtros" computador="lateral">
        <div className="flex flex-col gap-5">
          <SelectField rotulo="Status" value={f.status} onChange={(e) => mudar({ status: e.target.value as StatusCliente | '' })} placeholder="Todos" opcoes={STATUS} />
          <SelectField
            rotulo="Etapa do kanban"
            value={f.etapa}
            onChange={(e) => mudar({ etapa: e.target.value as EtapaKanban | '' })}
            placeholder="Todas"
            opcoes={[...ETAPAS_QUADRO.map((e) => ({ valor: e.id, rotulo: e.rotulo })), { valor: 'sem_interesse', rotulo: 'Sem interesse' }]}
          />
          <SelectField
            rotulo="Vendedora"
            value={f.vendedora}
            onChange={(e) => mudar({ vendedora: e.target.value })}
            placeholder="Todas"
            opcoes={(equipe ?? []).map((u) => ({ valor: u.id, rotulo: u.nome }))}
          />
          <SelectField
            rotulo="Aniversariantes"
            value={f.aniversario}
            onChange={(e) => mudar({ aniversario: e.target.value as FiltrosClientes['aniversario'] })}
            placeholder="Qualquer data"
            opcoes={[
              { valor: 'mes', rotulo: 'Este mês' },
              { valor: '7dias', rotulo: 'Próximos 7 dias' },
            ]}
          />
          <SelectField rotulo="Tamanho preferido" value={f.tamanho} onChange={(e) => mudar({ tamanho: e.target.value })} placeholder="Qualquer" opcoes={TAMANHOS.map((t) => ({ valor: t, rotulo: rotuloTamanho(t) }))} />
          <SelectField rotulo="Cor preferida" value={f.cor} onChange={(e) => mudar({ cor: e.target.value })} placeholder="Qualquer" opcoes={cores.map((c) => ({ valor: c, rotulo: c }))} />
          <SelectField
            rotulo="Comprou peça Miz"
            value={f.miz}
            onChange={(e) => mudar({ miz: e.target.value as FiltrosClientes['miz'] })}
            placeholder="Tanto faz"
            opcoes={[
              { valor: 'sim', rotulo: 'Sim' },
              { valor: 'nao', rotulo: 'Não' },
            ]}
          />
          <TextField
            rotulo="Sem comprar há mais de"
            inputMode="numeric"
            sufixo="dias"
            value={f.semComprarDias}
            onChange={(e) => mudar({ semComprarDias: e.target.value.replace(/\D/g, '').slice(0, 4) })}
          />
          <div className="grid grid-cols-2 gap-3">
            <MoneyField rotulo="Total gasto de" value={f.gastoMin} onChange={(gastoMin) => mudar({ gastoMin })} />
            <MoneyField rotulo="até" value={f.gastoMax} onChange={(gastoMax) => mudar({ gastoMax })} />
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => setFiltrosAbertos(false)}>
              Ver {total.toLocaleString('pt-BR')} clientes
            </Button>
            <Button variante="secundario" onClick={() => mudar({ ...FILTROS_VAZIOS, busca: f.busca })}>
              Limpar
            </Button>
          </div>
        </div>
      </BottomSheet>

      <FolhaResponsavelLote
        aberta={lote === 'responsavel'}
        ids={[...selecionadas]}
        linhas={linhas}
        onFechar={() => setLote(null)}
        onPronto={() => {
          setSelecionadas(new Set())
          setLote(null)
          void queryClient.invalidateQueries({ queryKey: ['clientes'] })
        }}
      />
    </div>
  )
}

function FolhaResponsavelLote({ aberta, ids, linhas, onFechar, onPronto }: { aberta: boolean; ids: string[]; linhas: LinhaCliente[]; onFechar: () => void; onPronto: () => void }) {
  const toast = useToast()
  const { data: equipe } = useEquipe()
  const [para, setPara] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const ativas = (equipe ?? []).filter((u) => u.situacao === 'ativa')

  const trocar = async () => {
    if (!para) return
    setSalvando(true)
    let ok = 0
    let iguais = 0
    for (const id of ids) {
      if (linhas.find((l) => l.id === id)?.vendedora_id === para) {
        iguais++
        continue
      }
      try {
        await transferirCliente(id, para, null)
        ok++
      } catch {
        // segue com as outras
      }
    }
    setSalvando(false)
    const nome = ativas.find((u) => u.id === para)?.nome.split(' ')[0] ?? 'a colega'
    toast.mostrar(`${ok} ${ok === 1 ? 'cliente passou' : 'clientes passaram'} para ${nome}${iguais ? ` (${iguais} já eram dela)` : ''}`)
    setPara(null)
    onPronto()
  }

  return (
    <BottomSheet aberta={aberta} onFechar={onFechar} titulo="Trocar responsável" computador="lateral">
      <div className="flex flex-col gap-5">
        <p className="text-body-sm text-text-secondary">
          {ids.length} {ids.length === 1 ? 'cliente vai' : 'clientes vão'} para a pessoa escolhida. Cada troca fica no histórico da cliente.
        </p>
        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Nova responsável">
          {ativas.map((u) => (
            <ChoiceCard key={u.id} selecionado={para === u.id} onClick={() => setPara(u.id)} descricao={u.perfil === 'adm' ? 'Dona da loja' : undefined}>
              {u.nome}
            </ChoiceCard>
          ))}
        </div>
        <Button disabled={!para} carregando={salvando} onClick={() => void trocar()}>
          Trocar responsável
        </Button>
      </div>
    </BottomSheet>
  )
}
