import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardKpi, CardMeta, CardPremio, Overline, ProgressBar, Selo, SkeletonCard, TopBar, EmptyState, Button } from '@/components/ui'
import { mensagemDeErro } from '@/lib/erros'
import { formatarMoeda, formatarNumero } from '@/lib/formatadores'
import { faltaParaPremio, useHistoricoMetas, useRanking, useResumoMes, type ResumoMes } from './api'

function nomeDoMes(mes: string): string {
  const t = format(new Date(`${mes}T12:00:00`), "MMMM 'de' yyyy", { locale: ptBR })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** /metas — quanto falta (especificação, seção 10). A vendedora não vê valores das colegas. */
export default function Metas() {
  const resumo = useResumoMes()
  const historico = useHistoricoMetas()
  const ranking = useRanking()
  const r = resumo.data

  return (
    <>
      <TopBar titulo="Metas" />
      <div className="mx-auto flex w-full max-w-form flex-col gap-6 px-gutter pb-10 pt-2">
        {r && <p className="-mt-2 text-body-sm text-text-secondary">{nomeDoMes(r.mes)}</p>}
        {resumo.isLoading ? (
          <SkeletonCard linhas={4} />
        ) : resumo.error ? (
          <Card>
            <EmptyState texto={mensagemDeErro(resumo.error)} acao={<Button variante="secundario" onClick={() => void resumo.refetch()}>Tentar de novo</Button>} />
          </Card>
        ) : r ? (
          <Principal r={r} />
        ) : null}

        {r && (
          <section className="flex flex-col gap-3">
            <Overline>Números do mês</Overline>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <CardKpi rotulo="Vendas" valor={formatarNumero(r.num_vendas)} />
              <CardKpi rotulo="Ticket médio" valor={r.ticket_medio ? formatarMoeda(r.ticket_medio, { destaque: true }) : '—'} />
              <CardKpi rotulo="Clientes novas" valor={formatarNumero(r.clientes_novas)} />
            </div>
          </section>
        )}

        {(ranking.data ?? []).length > 0 && (
          <section className="flex flex-col gap-3">
            <Overline>Ranking da equipe</Overline>
            <Card semPadding>
              <ol>
                {(ranking.data ?? []).map((p) => (
                  <li key={`${p.posicao}-${p.nome}`} className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0">
                    <span className="numeros w-6 text-label text-text-secondary">{p.posicao}º</span>
                    <span className={p.sou_eu ? 'text-label' : 'text-body'}>{p.nome}</span>
                    {p.sou_eu && <Selo>Você</Selo>}
                  </li>
                ))}
              </ol>
            </Card>
            <p className="text-caption text-text-tertiary">Posição por faturamento no mês. Os valores das colegas não aparecem.</p>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <Overline>Meses anteriores</Overline>
          {historico.isLoading ? (
            <SkeletonCard linhas={3} />
          ) : (
            <Card semPadding>
              <ul>
                {(historico.data ?? []).map((m) => (
                  <li key={m.mes} className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0">
                    <div className="min-w-0">
                      <p className="text-label">{nomeDoMes(m.mes)}</p>
                      <p className="numeros text-body-sm text-text-secondary">
                        {formatarMoeda(m.vendido, { destaque: true })}
                        {m.percentual !== null ? ` · ${Math.round(m.percentual)}% da meta` : ' · sem meta'}
                      </p>
                    </div>
                    {m.premio_ganho === true && <Selo tom="sucesso">Prêmio ganho</Selo>}
                    {m.premio_ganho === false && <Selo tom="contorno">Sem prêmio</Selo>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      </div>
    </>
  )
}

/** Bloco principal nos 4 casos: meta com prêmio, meta sem prêmio, só meta da loja, sem meta. */
function Principal({ r }: { r: ResumoMes }) {
  // Sem meta individual
  if (!r.meta_individual) {
    if (r.meta_loja) {
      const vendidoLoja = r.vendido_loja ?? 0
      return (
        <Card className="flex flex-col gap-4">
          <Overline>Meta da loja</Overline>
          <p className="numeros text-h3">
            A loja vendeu {formatarMoeda(vendidoLoja, { destaque: true })} de {formatarMoeda(r.meta_loja, { destaque: true })}
          </p>
          <ProgressBar percentual={(vendidoLoja / r.meta_loja) * 100} rotulo="Progresso da meta da loja" />
          <p className="numeros text-body text-text-secondary">Você vendeu {formatarMoeda(r.vendido, { destaque: true })} este mês.</p>
        </Card>
      )
    }
    return (
      <Card className="flex flex-col gap-2">
        <Overline>Vendido no mês</Overline>
        <p className="numeros text-h1">{formatarMoeda(r.vendido, { destaque: true })}</p>
        <p className="text-body-sm text-text-secondary">
          {r.num_vendas} {r.num_vendas === 1 ? 'venda' : 'vendas'}
        </p>
      </Card>
    )
  }

  const meta = r.meta_individual
  const falta = Math.max(0, meta - r.vendido)
  const faltaExtra = faltaParaPremio(r, true)

  return (
    <div className="flex flex-col gap-4">
      <CardMeta vendido={r.vendido} meta={meta} />
      {falta > 0 && r.dias_restantes > 0 && (
        <p className="numeros text-body text-text-secondary">
          Faltam {r.dias_restantes} {r.dias_restantes === 1 ? 'dia' : 'dias'}
          {r.valor_por_dia ? ` · ${formatarMoeda(r.valor_por_dia, { destaque: true })} por dia` : ''}
        </p>
      )}
      {r.premio_descricao && (
        <CardPremio
          descricao={r.premio_descricao}
          condicao={r.premio_conquistado ? 'Prêmio conquistado' : `Bateu ${r.premio_condicao_pct ?? 100}% da meta`}
          conquistado={!!r.premio_conquistado}
        />
      )}
      {r.premio_extra_descricao && (
        <CardPremio
          descricao={r.premio_extra_descricao}
          condicao={
            r.premio_extra_conquistado
              ? 'Prêmio conquistado'
              : `Bateu ${r.premio_extra_pct ?? 120}% da meta${faltaExtra ? ` · faltam ${formatarMoeda(faltaExtra, { destaque: true })}` : ''}`
          }
          conquistado={!!r.premio_extra_conquistado}
        />
      )}
    </div>
  )
}
