import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { BolinhaCor } from './Chips'

/*
 * Gráficos do design system (seção 9), feitos só com tokens:
 * uma série = primary; com destaque, o destaque em primary e o resto em border-strong (#BEB8B1);
 * barras com raio 4 só na ponta, espessura até 24; grade horizontal em border-subtle; valor na ponta em caption.
 * Nunca pizza. Cada gráfico traz uma tabela escondida para leitores de tela.
 */

export interface ItemBarra {
  id: string
  rotulo: ReactNode
  /** texto simples do rótulo (tabela acessível) */
  rotuloTexto?: string
  valor: number
  /** valor escrito na ponta (ex.: "R$ 4.320 · 23") */
  texto?: string
  destaque?: boolean
  /** bolinha de cor antes do nome (gráfico de cores) */
  hex?: string | null
  onClick?: () => void
}

/** Barras horizontais: vendas por vendedora, peças, cores e tamanhos. */
export function BarrasHorizontais({ itens, rotulo, vazio = 'Sem dados no período.' }: { itens: ItemBarra[]; rotulo: string; vazio?: string }) {
  if (itens.length === 0) return <p className="py-6 text-center text-body-sm text-text-secondary">{vazio}</p>
  const max = Math.max(...itens.map((i) => i.valor), 0)
  const temDestaque = itens.some((i) => i.destaque)
  return (
    <figure className="flex flex-col gap-3" aria-label={rotulo}>
      <ul className="flex flex-col gap-3" aria-hidden="true">
        {itens.map((i) => {
          const pct = max > 0 ? (i.valor / max) * 100 : 0
          const conteudo = (
            <>
              <span className="flex w-grafico-rotulo shrink-0 items-center gap-2 truncate text-body-sm">
                {i.hex !== undefined && <BolinhaCor hex={i.hex} />}
                <span className="truncate">{i.rotulo}</span>
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={cn('h-barra-h rounded-r-xs', !temDestaque || i.destaque ? 'bg-primary' : 'bg-border-strong')}
                  // comprimento proporcional ao valor (calculado)
                  style={{ width: `${Math.max(pct, i.valor > 0 ? 2 : 0)}%` }}
                />
                <span className="numeros shrink-0 text-caption text-text-secondary">{i.texto ?? i.valor}</span>
              </span>
            </>
          )
          return (
            <li key={i.id}>
              {i.onClick ? (
                <button type="button" onClick={i.onClick} className="foco flex w-full items-center gap-3 rounded-sm text-left hover:bg-background-muted">
                  {conteudo}
                </button>
              ) : (
                <div className="flex items-center gap-3">{conteudo}</div>
              )}
            </li>
          )
        })}
      </ul>
      <table className="sr-only">
        <caption>{rotulo}</caption>
        <tbody>
          {itens.map((i) => (
            <tr key={i.id}>
              <th scope="row">{i.rotuloTexto ?? (typeof i.rotulo === 'string' ? i.rotulo : i.id)}</th>
              <td>{i.texto ?? i.valor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

export interface ItemColuna {
  id: string
  /** rótulo do eixo (ex.: "3", "out") */
  rotulo: string
  /** rótulo completo para a dica e a tabela (ex.: "3 de out. · R$ 1.200") */
  descricao: string
  valor: number
  destaque?: boolean
}

/** Colunas verticais: faturamento por dia ou por mês. Mostra só alguns rótulos no eixo para não embolar. */
export function Colunas({ itens, rotulo, formatar = String }: { itens: ItemColuna[]; rotulo: string; formatar?: (n: number) => string }) {
  const max = Math.max(...itens.map((i) => i.valor), 0)
  const temDestaque = itens.some((i) => i.destaque)
  const passo = Math.max(1, Math.ceil(itens.length / 7))
  return (
    <figure className="flex flex-col gap-2" aria-label={rotulo}>
      <div className="flex items-baseline justify-between text-caption text-text-tertiary" aria-hidden="true">
        <span className="numeros">{max > 0 ? `máx. ${formatar(max)}` : 'sem vendas no período'}</span>
      </div>
      <div className="relative h-grafico" aria-hidden="true">
        {/* grade horizontal */}
        <div className="absolute inset-0 flex flex-col justify-between">
          <span className="border-t border-border-subtle" />
          <span className="border-t border-border-subtle" />
          <span className="border-t border-border-subtle" />
        </div>
        <div className="relative flex h-full items-end gap-1">
          {itens.map((i) => (
            <div key={i.id} className="flex h-full min-w-0 flex-1 items-end" title={i.descricao}>
              <span
                className={cn('w-full rounded-t-xs', !temDestaque || i.destaque ? 'bg-primary' : 'bg-border-strong')}
                // altura proporcional ao valor (calculada)
                style={{ height: `${max > 0 ? Math.max((i.valor / max) * 100, i.valor > 0 ? 1 : 0) : 0}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-1 text-caption text-text-tertiary" aria-hidden="true">
        {itens.map((i, n) => (
          <span key={i.id} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">
            {n % passo === 0 ? i.rotulo : ''}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{rotulo}</caption>
        <tbody>
          {itens.map((i) => (
            <tr key={i.id}>
              <th scope="row">{i.descricao}</th>
              <td>{formatar(i.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
