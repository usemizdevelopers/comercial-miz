import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChartBar } from '@phosphor-icons/react'
import { BarrasHorizontais, BolinhaCor, Button, Card, Colunas, EmptyState, Overline, ProgressBar, Selo, SkeletonCard } from '@/components/ui'
import { CabecalhoPagina } from '@/components/shared/CabecalhoPagina'
import { FiltroPeriodo } from '@/components/shared/FiltroPeriodo'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { ETAPAS_QUADRO } from '@/features/clientes/api'
import { useHexDasCores } from '@/hooks/useDadosLoja'
import { usePeriodo } from '@/hooks/usePeriodo'
import { mensagemDeErro } from '@/lib/erros'
import { formatarMoeda, formatarNumero } from '@/lib/formatadores'
import { hojeIso, lerIso, mesIso } from '@/lib/periodo'
import { rotuloTamanho } from '@/lib/vendas'
import { primeiroNome } from '@/lib/whatsapp'
import { usePainelMeta, useResumo, useSeries, type PainelMeta, type Series } from './api'
import { Indicadores } from './Indicadores'

const moeda = (n: number) => formatarMoeda(n, { destaque: true })

/** /adm — Visão geral da loja (especificação, seção 11). Todos os blocos respondem aos filtros. */
export default function VisaoGeral() {
  const navegar = useNavigate()
  const { usuaria } = useSessao()
  const { preset, periodo, vendedora, escolherPreset, escolherDatas, escolherVendedora } = usePeriodo('mes')
  const resumo = useResumo(periodo, vendedora)
  const series = useSeries(periodo, vendedora)
  const meta = usePainelMeta()

  const baseVazia =
    !!series.data && !!resumo.data && Object.values(series.data.saude).reduce<number>((s, n) => s + (n ?? 0), 0) === 0 && resumo.data.atual.vendas === 0

  return (
    <div className="mx-auto flex w-full max-w-conteudo flex-col gap-8 px-gutter pb-10">
      <CabecalhoPagina titulo="Visão geral" subtitulo={usuaria?.lojaNome ?? undefined} />
      <FiltroPeriodo preset={preset} periodo={periodo} onPreset={escolherPreset} onDatas={escolherDatas} vendedora={vendedora} onVendedora={escolherVendedora} />

      {resumo.error || series.error ? (
        <Card>
          <EmptyState texto={mensagemDeErro(resumo.error ?? series.error)} acao={<Button variante="secundario" onClick={() => void Promise.all([resumo.refetch(), series.refetch()])}>Tentar de novo</Button>} />
        </Card>
      ) : baseVazia ? (
        <Card>
          <EmptyState
            icone={<ChartBar weight="light" />}
            texto="A loja ainda não tem vendas. Lance a primeira ou crie os acessos da equipe para começar."
            acao={
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => navegar('/adm/venda/nova')}>Lançar venda</Button>
                <Button variante="secundario" onClick={() => navegar('/adm/equipe')}>
                  Equipe
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          {/* Faixa 1 */}
          <section className="flex flex-col gap-3" aria-label="Números do período">
            <Indicadores resumo={resumo.data} carregando={resumo.isLoading} />
          </section>

          {/* Faixa 2 */}
          <FaixaMeta meta={meta.data} carregando={meta.isLoading} destaque={vendedora} />

          {/* Faixa 3 */}
          {series.isLoading || !series.data ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <SkeletonCard linhas={5} />
              <SkeletonCard linhas={5} />
            </div>
          ) : (
            <Graficos series={series.data} vendedora={vendedora} onVendedora={escolherVendedora} />
          )}

          {/* Faixas 4 e 5 */}
          {series.data && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Perfil perfil={series.data.perfil} vendedora={vendedora} />
              <Saude saude={series.data.saude} vendedora={vendedora} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FaixaMeta({ meta, carregando, destaque }: { meta?: PainelMeta; carregando: boolean; destaque: string | null }) {
  if (carregando) return <SkeletonCard linhas={3} />
  if (!meta) return null
  const linhas = meta.vendedoras.filter((v) => v.perfil === 'vendedora' || v.vendas > 0)
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Overline>Meta do mês</Overline>
        <Link to="/adm/metas" className="foco sublinhado rounded-sm text-label">
          {meta.valor_loja ? 'Ver metas' : 'Criar meta'}
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          {meta.valor_loja ? (
            <>
              {meta.status === 'rascunho' && <Selo className="self-start">Rascunho, ainda não publicada</Selo>}
              <ProgressBar percentual={(meta.vendido / meta.valor_loja) * 100} rotulo="Meta da loja" />
              <p className="numeros text-body">
                Vendido {moeda(meta.vendido)} de {moeda(meta.valor_loja)}
              </p>
              <p className="numeros text-body-sm text-text-secondary">
                {meta.falta ? `Faltam ${moeda(meta.falta)}` : 'Meta batida'}
                {meta.por_dia ? ` · ${moeda(meta.por_dia)} por dia (${meta.dias_restantes} ${meta.dias_restantes === 1 ? 'dia' : 'dias'})` : ''}
              </p>
            </>
          ) : (
            <p className="numeros text-body">Vendido no mês: {moeda(meta.vendido)} · sem meta definida</p>
          )}
        </Card>
        <Card className="flex flex-col gap-4">
          {linhas.length === 0 ? (
            <p className="text-body-sm text-text-secondary">Nenhuma vendedora ativa.</p>
          ) : (
            linhas.map((v) => (
              <div key={v.usuaria_id} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <Link to={`/adm/equipe/${v.usuaria_id}`} className={`foco sublinhado truncate rounded-sm ${destaque === v.usuaria_id ? 'text-label' : 'text-body-sm'}`}>
                    {v.nome}
                  </Link>
                  <span className="numeros shrink-0 text-body-sm text-text-secondary">
                    {moeda(v.vendido)}
                    {v.percentual !== null ? ` · ${Math.round(v.percentual)}%` : ''}
                  </span>
                </div>
                {v.meta ? <ProgressBar percentual={v.percentual ?? 0} rotulo={`Meta de ${v.nome}`} /> : <p className="text-caption text-text-tertiary">Sem meta individual</p>}
                {v.premio === 'conquistado' && <Selo tom="sucesso" className="self-start">Prêmio conquistado</Selo>}
              </div>
            ))
          )}
        </Card>
      </div>
    </section>
  )
}

function Graficos({ series, vendedora, onVendedora }: { series: Series; vendedora: string | null; onVendedora: (id: string | null) => void }) {
  const hex = useHexDasCores()
  const hoje = hojeIso()
  const mesAtual = mesIso(hoje)
  const porDia = series.agrupamento === 'dia'
  return (
    <section className="flex flex-col gap-3">
      <Overline>O que vendeu</Overline>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <p className="text-h3">Faturamento por {porDia ? 'dia' : 'mês'}</p>
          <Colunas
            rotulo={`Faturamento por ${porDia ? 'dia' : 'mês'}`}
            formatar={moeda}
            itens={series.faturamento.map((f) => {
              const d = lerIso(f.data)
              return {
                id: f.data,
                rotulo: porDia ? format(d, 'd') : format(d, 'MMM', { locale: ptBR }),
                descricao: `${porDia ? format(d, "d 'de' MMM", { locale: ptBR }) : format(d, "MMMM 'de' yyyy", { locale: ptBR })} · ${moeda(f.valor)} · ${f.vendas} ${f.vendas === 1 ? 'venda' : 'vendas'}`,
                valor: f.valor,
                destaque: porDia ? f.data === hoje : f.data === mesAtual,
              }
            })}
          />
        </Card>
        <Card className="flex flex-col gap-3">
          <p className="text-h3">Vendas por vendedora</p>
          <BarrasHorizontais
            rotulo="Vendas por vendedora"
            itens={series.por_vendedora.map((v) => ({
              id: v.usuaria_id,
              rotulo: primeiroNome(v.nome),
              rotuloTexto: v.nome,
              valor: v.faturamento,
              texto: `${moeda(v.faturamento)} · ${v.vendas}`,
              destaque: vendedora === v.usuaria_id,
              onClick: () => onVendedora(vendedora === v.usuaria_id ? null : v.usuaria_id),
            }))}
          />
          <p className="text-caption text-text-tertiary">Toque numa vendedora para filtrar o painel por ela.</p>
        </Card>
        <Card className="flex flex-col gap-3">
          <p className="text-h3">Peças Miz mais vendidas</p>
          <BarrasHorizontais
            rotulo="Peças Miz mais vendidas"
            vazio="Nenhuma peça Miz no período."
            itens={series.pecas_miz.map((p) => ({ id: p.peca_id, rotulo: `${p.codigo} · ${p.nome}`, valor: p.quantidade, texto: `${p.quantidade}` }))}
          />
        </Card>
        <Card className="flex flex-col gap-4">
          <p className="text-h3">Cores e tamanhos (todas as marcas)</p>
          <BarrasHorizontais
            rotulo="Cores mais vendidas"
            itens={series.cores.map((c) => ({ id: c.cor, rotulo: c.cor, valor: c.quantidade, texto: `${c.quantidade}`, hex: c.hex ?? hex(c.cor) }))}
          />
          <BarrasHorizontais
            rotulo="Tamanhos mais vendidos"
            itens={series.tamanhos.map((t) => ({ id: t.tamanho, rotulo: rotuloTamanho(t.tamanho), valor: t.quantidade, texto: `${t.quantidade}` }))}
          />
        </Card>
      </div>
    </section>
  )
}

function Perfil({ perfil, vendedora }: { perfil: Series['perfil']; vendedora: string | null }) {
  const hex = useHexDasCores()
  const filtro = vendedora ? `&vendedora=${vendedora}` : ''
  return (
    <section className="flex flex-col gap-3">
      <Overline>A preferência da maioria</Overline>
      <Card className="flex flex-col gap-3">
        <Item rotulo="Tamanho mais vendido">{perfil.tamanho ? rotuloTamanho(perfil.tamanho) : '—'}</Item>
        <Item rotulo="Cores campeãs">
          {perfil.cores.length === 0 ? (
            '—'
          ) : (
            <span className="flex flex-wrap justify-end gap-x-3 gap-y-1">
              {perfil.cores.map((c) => (
                <span key={c.cor} className="inline-flex items-center gap-1">
                  <BolinhaCor hex={c.hex ?? hex(c.cor)} />
                  {c.cor}
                </span>
              ))}
            </span>
          )}
        </Item>
        <Item rotulo="Peça Miz campeã">{perfil.peca ? `${perfil.peca.nome} (${perfil.peca.quantidade})` : '—'}</Item>
        <Item rotulo="Ticket médio">{perfil.ticket_medio ? moeda(perfil.ticket_medio) : '—'}</Item>
        <Item rotulo="Compra a cada">{perfil.intervalo_medio ? `${perfil.intervalo_medio} dias` : '—'}</Item>
        <Item rotulo="Aniversariantes do mês">
          <Link to={`/adm/clientes?aniversario=mes${filtro}`} className="foco sublinhado rounded-sm text-label">
            {formatarNumero(perfil.aniversariantes_mes)}
          </Link>
        </Item>
      </Card>
    </section>
  )
}

function Item({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border-subtle pb-3 last:border-b-0 last:pb-0">
      <span className="text-body-sm text-text-secondary">{rotulo}</span>
      <span className="text-right text-body">{children}</span>
    </div>
  )
}

function Saude({ saude, vendedora }: { saude: Series['saude']; vendedora: string | null }) {
  const navegar = useNavigate()
  const filtro = vendedora ? `&vendedora=${vendedora}` : ''
  return (
    <section className="flex flex-col gap-3">
      <Overline>Saúde da base</Overline>
      <Card className="flex flex-col gap-3">
        <BarrasHorizontais
          rotulo="Clientes por etapa do kanban"
          itens={ETAPAS_QUADRO.map((e) => ({
            id: e.id,
            rotulo: e.rotulo,
            valor: saude[e.id] ?? 0,
            texto: formatarNumero(saude[e.id] ?? 0),
            onClick: () => navegar(`/adm/clientes?etapa=${e.id}${filtro}`),
          }))}
        />
        <p className="text-caption text-text-tertiary">Toque numa etapa para ver as clientes. A base não depende do período.</p>
      </Card>
    </section>
  )
}
