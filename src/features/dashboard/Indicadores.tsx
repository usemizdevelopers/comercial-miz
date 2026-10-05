import { CardKpi, Skeleton } from '@/components/ui'
import { formatarMoeda, formatarNumero } from '@/lib/formatadores'
import { variacao } from '@/lib/periodo'
import type { Indicadores as Ind, Resumo } from './api'

type Chave = keyof Ind

interface Definicao {
  chave: Chave
  rotulo: string
  formatar: (v: number | null) => string
  tipo: 'valor' | 'pontos'
}

const moeda = (v: number | null) => (v === null ? '—' : formatarMoeda(v, { destaque: true }))
const numero = (v: number | null) => (v === null ? '—' : formatarNumero(v))
const pct = (v: number | null) => (v === null ? '—' : `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`)

const DEFINICOES: Record<Chave, Definicao> = {
  faturamento: { chave: 'faturamento', rotulo: 'Faturamento', formatar: moeda, tipo: 'valor' },
  vendas: { chave: 'vendas', rotulo: 'Vendas', formatar: numero, tipo: 'valor' },
  ticket_medio: { chave: 'ticket_medio', rotulo: 'Ticket médio', formatar: moeda, tipo: 'valor' },
  pecas: { chave: 'pecas', rotulo: 'Peças vendidas', formatar: numero, tipo: 'valor' },
  clientes_novas: { chave: 'clientes_novas', rotulo: 'Clientes novas', formatar: numero, tipo: 'valor' },
  taxa_recompra: { chave: 'taxa_recompra', rotulo: 'Taxa de recompra', formatar: pct, tipo: 'pontos' },
  clientes_ativas: { chave: 'clientes_ativas', rotulo: 'Clientes ativas (90 dias)', formatar: numero, tipo: 'valor' },
  pct_miz: { chave: 'pct_miz', rotulo: '% em peças Miz', formatar: pct, tipo: 'pontos' },
}

const TODAS: Chave[] = ['faturamento', 'vendas', 'ticket_medio', 'pecas', 'clientes_novas', 'taxa_recompra', 'clientes_ativas', 'pct_miz']

/** Faixa de indicadores com a variação contra o período anterior (texto + ou −, sem seta colorida). */
export function Indicadores({ resumo, carregando, quais = TODAS, extras = [] }: { resumo?: Resumo; carregando?: boolean; quais?: Chave[]; extras?: Array<{ rotulo: string; valor: string; detalhe?: string }> }) {
  if (carregando || !resumo) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: quais.length + extras.length }).map((_, i) => (
          <Skeleton key={i} className="h-pasta" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {quais.map((k) => {
        const d = DEFINICOES[k]
        return <CardKpi key={k} rotulo={d.rotulo} valor={d.formatar(resumo.atual[k])} variacao={variacao(resumo.atual[k], resumo.anterior[k], d.tipo)} />
      })}
      {extras.map((e) => (
        <CardKpi key={e.rotulo} rotulo={e.rotulo} valor={e.valor} variacao={e.detalhe} />
      ))}
    </div>
  )
}
