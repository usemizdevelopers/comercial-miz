import { useMemo, useState } from 'react'
import { endOfMonth } from 'date-fns'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { CaretLeft, CaretRight, Copy } from '@phosphor-icons/react'
import {
  Button,
  Card,
  ChipFiltro,
  ChipGroup,
  EmptyState,
  MoneyField,
  Overline,
  ProgressBar,
  SegmentedControl,
  Selo,
  SkeletonCard,
  TextField,
  useToast,
} from '@/components/ui'
import { CabecalhoPagina } from '@/components/shared/CabecalhoPagina'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { buscarPainelMeta, buscarSeries, usePainelMeta, type PainelMeta } from '@/features/dashboard/api'
import { usePessoas } from '@/features/equipe/api'
import { supabase } from '@/lib/supabase'
import { mensagemDeErro } from '@/lib/erros'
import { formatarMoeda } from '@/lib/formatadores'
import { hojeIso, iso, lerIso, mesIso, nomeMes } from '@/lib/periodo'
import { dividirIgualmente, somar } from './divisao'

interface MetaBanco {
  id: string
  mes: string
  valor_loja: number
  status: string
  premio_descricao: string | null
  premio_condicao_pct: number
  premio_extra_descricao: string | null
  premio_extra_pct: number | null
  individuais: Array<{ id: string; usuaria_id: string; valor: number | null; premio_elegivel: boolean }>
}

async function buscarMeta(mes: string): Promise<MetaBanco | null> {
  const { data, error } = await supabase
    .from('mizloja_metas')
    .select('id, mes, valor_loja, status, premio_descricao, premio_condicao_pct, premio_extra_descricao, premio_extra_pct, individuais:mizloja_metas_vendedoras(id, usuaria_id, valor, premio_elegivel)')
    .eq('mes', mes)
    .maybeSingle()
  if (error) throw error
  return data as MetaBanco | null
}

/** /adm/metas — Metas e prêmios (especificação, seção 13). */
export default function MetasAdm() {
  const atual = mesIso(hojeIso())
  const [mes, setMes] = useState(atual)
  const passado = mes < atual

  const meta = useQuery({ queryKey: ['adm', 'meta', mes], queryFn: () => buscarMeta(mes) })
  const anterior = useQuery({ queryKey: ['adm', 'meta', mesIso(mes, -1)], queryFn: () => buscarMeta(mesIso(mes, -1)) })
  const acompanhamento = usePainelMeta(mes)
  // referência: faturamento dos 12 meses anteriores
  const referencia = useQuery({
    queryKey: ['painel', 'series', 'referencia-meta', mes],
    queryFn: () => buscarSeries({ inicio: mesIso(mes, -12), fim: iso(endOfMonth(lerIso(mesIso(mes, -1)))) }),
  })
  const mesPassadoValor = referencia.data?.faturamento.find((f) => f.data === mesIso(mes, -1))?.valor ?? null
  const melhorMes = referencia.data?.faturamento.reduce((m, f) => (f.valor > m ? f.valor : m), 0) ?? null

  const historicoMeses = useMemo(() => Array.from({ length: 6 }, (_, i) => mesIso(atual, -(i + 1))), [atual])
  const historico = useQueries({ queries: historicoMeses.map((m) => ({ queryKey: ['painel', 'meta', m], queryFn: () => buscarPainelMeta(m) })) })

  return (
    <div className="mx-auto flex w-full max-w-form flex-col gap-6 px-gutter pb-10">
      <CabecalhoPagina titulo="Metas e prêmios" subtitulo="Uma meta por mês. As vendedoras veem assim que você publica." />

      <div className="flex items-center justify-between gap-3">
        <Button variante="secundario" tamanho="pequeno" icone={<CaretLeft weight="light" className="h-icone w-icone" />} onClick={() => setMes(mesIso(mes, -1))}>
          Anterior
        </Button>
        <div className="text-center">
          <p className="text-h2">{nomeMes(mes)}</p>
          {mes === atual && <p className="text-caption text-text-tertiary">Mês atual</p>}
        </div>
        <Button variante="secundario" tamanho="pequeno" disabled={mes >= mesIso(atual, 1)} onClick={() => setMes(mesIso(mes, 1))}>
          Próximo
          <CaretRight weight="light" className="h-icone w-icone" />
        </Button>
      </div>

      {meta.isLoading ? (
        <SkeletonCard linhas={5} />
      ) : meta.error ? (
        <Card>
          <EmptyState texto={mensagemDeErro(meta.error)} />
        </Card>
      ) : passado ? (
        <Card className="flex flex-col gap-2">
          <Overline>Meta do mês</Overline>
          <p className="text-body">
            {meta.data ? `Loja: ${formatarMoeda(meta.data.valor_loja, { destaque: true })} · ${meta.data.status === 'publicada' ? 'publicada' : 'rascunho'}` : 'Sem meta neste mês.'}
          </p>
          {meta.data?.premio_descricao && <p className="text-body-sm text-text-secondary">Prêmio: {meta.data.premio_descricao}</p>}
          <p className="text-caption text-text-tertiary">Meses anteriores ficam só para consulta.</p>
        </Card>
      ) : (
        <FormularioMeta
          key={`${mes}-${meta.dataUpdatedAt}`}
          mes={mes}
          meta={meta.data ?? null}
          anterior={anterior.data ?? null}
          mesPassadoValor={mesPassadoValor}
          melhorMes={melhorMes}
        />
      )}

      <Acompanhamento dados={acompanhamento.data} carregando={acompanhamento.isLoading} />

      <section className="flex flex-col gap-3">
        <Overline>Meses anteriores</Overline>
        <Card semPadding>
          <ul>
            {historicoMeses.map((m, i) => {
              const d = historico[i]?.data
              const pct = d?.valor_loja ? Math.round((d.vendido / d.valor_loja) * 100) : null
              return (
                <li key={m}>
                  <button type="button" onClick={() => setMes(m)} className="foco flex w-full items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 text-left last:border-b-0 hover:bg-background-muted">
                    <span className="flex flex-col">
                      <span className="text-label">{nomeMes(m)}</span>
                      <span className="numeros text-body-sm text-text-secondary">
                        {d ? `${formatarMoeda(d.vendido, { destaque: true })}${d.valor_loja ? ` de ${formatarMoeda(d.valor_loja, { destaque: true })}` : ' · sem meta'}` : '…'}
                      </span>
                    </span>
                    {pct !== null && <Selo tom={pct >= 100 ? 'sucesso' : 'neutro'}>{pct}%</Selo>}
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ Formulário */

function FormularioMeta({
  mes,
  meta,
  anterior,
  mesPassadoValor,
  melhorMes,
}: {
  mes: string
  meta: MetaBanco | null
  anterior: MetaBanco | null
  mesPassadoValor: number | null
  melhorMes: number | null
}) {
  const { usuaria } = useSessao()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data: pessoas } = usePessoas()
  const vendedoras = useMemo(() => (pessoas ?? []).filter((p) => p.perfil === 'vendedora' && p.situacao === 'ativa'), [pessoas])

  const inicial = (fonte: MetaBanco | null) => ({
    valorLoja: fonte?.valor_loja ?? null,
    individuais: Object.fromEntries((fonte?.individuais ?? []).map((i) => [i.usuaria_id, i.valor])) as Record<string, number | null>,
    premio: fonte?.premio_descricao ?? '',
    condicao: String(fonte?.premio_condicao_pct ?? 100),
    extra: fonte?.premio_extra_descricao ?? '',
    extraPct: fonte?.premio_extra_pct ? String(fonte.premio_extra_pct) : '120',
    paraTodas: !fonte || fonte.individuais.every((i) => i.premio_elegivel),
    elegiveis: new Set((fonte?.individuais ?? []).filter((i) => i.premio_elegivel).map((i) => i.usuaria_id)),
  })
  const [f, setF] = useState(() => inicial(meta))
  const [salvando, setSalvando] = useState<null | 'publicada' | 'rascunho'>(null)
  const [erro, setErro] = useState<string | null>(null)

  const soma = somar(vendedoras.map((v) => f.individuais[v.id] ?? null))
  const diferenca = f.valorLoja !== null && soma > 0 ? f.valorLoja - soma : null
  const condicaoOk = /^\d+$/.test(f.condicao) && Number(f.condicao) > 0
  const extraOk = !f.extra.trim() || (/^\d+$/.test(f.extraPct) && Number(f.extraPct) > 0)
  const pode = !!f.valorLoja && f.valorLoja > 0 && (!f.premio.trim() || condicaoOk) && extraOk

  const salvar = async (status: 'publicada' | 'rascunho') => {
    if (!pode || !f.valorLoja || !usuaria?.lojaId) return
    setSalvando(status)
    setErro(null)
    try {
      const dados = {
        valor_loja: f.valorLoja,
        status,
        premio_descricao: f.premio.trim() || null,
        premio_condicao_pct: condicaoOk ? Number(f.condicao) : 100,
        premio_extra_descricao: f.premio.trim() && f.extra.trim() ? f.extra.trim() : null,
        premio_extra_pct: f.premio.trim() && f.extra.trim() ? Number(f.extraPct) : null,
      }
      let metaId = meta?.id
      if (metaId) {
        const { error } = await supabase.from('mizloja_metas').update(dados).eq('id', metaId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('mizloja_metas').insert({ ...dados, loja_id: usuaria.lojaId, mes }).select('id').single()
        if (error) throw error
        metaId = data.id
      }
      // metas individuais: atualiza as existentes, cria as novas (vazio = sem meta individual)
      const existentes = new Map((meta?.individuais ?? []).map((i) => [i.usuaria_id, i]))
      for (const v of vendedoras) {
        const valor = f.individuais[v.id] ?? null
        const elegivel = f.paraTodas || f.elegiveis.has(v.id)
        const ex = existentes.get(v.id)
        if (ex) {
          if (ex.valor !== valor || ex.premio_elegivel !== elegivel) {
            const { error } = await supabase.from('mizloja_metas_vendedoras').update({ valor, premio_elegivel: elegivel }).eq('id', ex.id)
            if (error) throw error
          }
        } else if (valor !== null || !elegivel) {
          const { error } = await supabase
            .from('mizloja_metas_vendedoras')
            .insert({ meta_id: metaId, usuaria_id: v.id, valor, premio_elegivel: elegivel } as never)
          if (error) throw error
        }
      }
      toast.mostrar(status === 'publicada' ? 'Meta publicada. As vendedoras já veem.' : 'Rascunho salvo')
      void queryClient.invalidateQueries({ queryKey: ['adm', 'meta'] })
      void queryClient.invalidateQueries({ queryKey: ['painel'] })
      void queryClient.invalidateQueries({ queryKey: ['metas'] })
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {meta && (
        <Selo tom={meta.status === 'publicada' ? 'sucesso' : 'neutro'} className="self-start">
          {meta.status === 'publicada' ? 'Publicada' : 'Rascunho (as vendedoras ainda não veem)'}
        </Selo>
      )}
      {!meta && anterior && (
        <Button variante="secundario" className="self-start" icone={<Copy weight="light" className="h-icone w-icone" />} onClick={() => setF(inicial(anterior))}>
          Repetir o mês passado
        </Button>
      )}

      <section className="flex flex-col gap-3">
        <Overline>1 · Meta da loja</Overline>
        <Card className="flex flex-col gap-3">
          <MoneyField rotulo="Valor da meta" obrigatorio value={f.valorLoja} onChange={(valorLoja) => setF((x) => ({ ...x, valorLoja }))} />
          <p className="numeros text-caption text-text-tertiary">
            Mês passado: {mesPassadoValor === null ? '…' : formatarMoeda(mesPassadoValor, { destaque: true })} · melhor mês:{' '}
            {melhorMes === null ? '…' : formatarMoeda(melhorMes, { destaque: true })}
          </p>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Overline>2 · Metas individuais (opcional)</Overline>
          <Button
            variante="texto"
            disabled={!f.valorLoja || vendedoras.length === 0}
            onClick={() => {
              const partes = dividirIgualmente(f.valorLoja ?? 0, vendedoras.length)
              setF((x) => ({ ...x, individuais: Object.fromEntries(vendedoras.map((v, i) => [v.id, partes[i] ?? null])) }))
            }}
          >
            Dividir igualmente
          </Button>
        </div>
        <Card className="flex flex-col gap-4">
          {vendedoras.length === 0 ? (
            <p className="text-body-sm text-text-secondary">Nenhuma vendedora ativa. Crie acessos em Equipe.</p>
          ) : (
            vendedoras.map((v) => (
              <MoneyField
                key={v.id}
                rotulo={v.nome}
                value={f.individuais[v.id] ?? null}
                onChange={(valor) => setF((x) => ({ ...x, individuais: { ...x.individuais, [v.id]: valor } }))}
              />
            ))
          )}
          {soma > 0 && (
            <p className={diferenca ? 'numeros text-body-sm text-warning' : 'numeros text-body-sm text-text-secondary'}>
              Soma {formatarMoeda(soma, { destaque: true })} · loja {formatarMoeda(f.valorLoja ?? 0, { destaque: true })}
              {diferenca ? ` · diferença ${formatarMoeda(Math.abs(diferenca), { destaque: true })}` : ' · bate com a loja'}
            </p>
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <Overline>3 · Prêmio (opcional)</Overline>
        <Card className="flex flex-col gap-4">
          <TextField rotulo="Prêmio" placeholder="R$ 200 em compras na loja" value={f.premio} onChange={(e) => setF((x) => ({ ...x, premio: e.target.value }))} />
          {f.premio.trim() && (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-label text-text-secondary">Para quem vale</p>
                <SegmentedControl
                  rotulo="Para quem vale o prêmio"
                  valor={f.paraTodas ? 'todas' : 'escolhidas'}
                  onMudar={(v) => setF((x) => ({ ...x, paraTodas: v === 'todas' }))}
                  opcoes={[
                    { valor: 'todas', rotulo: 'Todas' },
                    { valor: 'escolhidas', rotulo: 'Escolhidas' },
                  ]}
                />
                {!f.paraTodas && (
                  <ChipGroup rotulo="Vendedoras com prêmio">
                    {vendedoras.map((v) => (
                      <ChipFiltro
                        key={v.id}
                        rotulo={v.nome}
                        selecionado={f.elegiveis.has(v.id)}
                        onClick={() =>
                          setF((x) => {
                            const s = new Set(x.elegiveis)
                            if (s.has(v.id)) s.delete(v.id)
                            else s.add(v.id)
                            return { ...x, elegiveis: s }
                          })
                        }
                      />
                    ))}
                  </ChipGroup>
                )}
                <p className="text-caption text-text-tertiary">O prêmio vale sobre a meta individual de cada uma.</p>
              </div>
              <TextField
                rotulo="Condição"
                inputMode="numeric"
                sufixo="% da meta"
                value={f.condicao}
                onChange={(e) => setF((x) => ({ ...x, condicao: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                erro={condicaoOk ? undefined : 'Use um número maior que zero'}
              />
              <TextField rotulo="Prêmio extra (opcional)" placeholder="Folga no sábado" value={f.extra} onChange={(e) => setF((x) => ({ ...x, extra: e.target.value }))} />
              {f.extra.trim() && (
                <TextField
                  rotulo="Condição do extra"
                  inputMode="numeric"
                  sufixo="% da meta"
                  value={f.extraPct}
                  onChange={(e) => setF((x) => ({ ...x, extraPct: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                />
              )}
            </>
          )}
          <p className="text-caption text-text-tertiary">O prêmio é só registro e motivação: o sistema não paga nem calcula comissão.</p>
        </Card>
      </section>

      {erro && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">{erro}</p>}
      <div className="flex flex-wrap gap-3">
        <Button disabled={!pode} carregando={salvando === 'publicada'} onClick={() => void salvar('publicada')}>
          Publicar
        </Button>
        <Button variante="secundario" disabled={!pode} carregando={salvando === 'rascunho'} onClick={() => void salvar('rascunho')}>
          {meta?.status === 'publicada' ? 'Voltar para rascunho' : 'Salvar rascunho'}
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Acompanhamento */

function Acompanhamento({ dados, carregando }: { dados?: PainelMeta; carregando: boolean }) {
  if (carregando) return <SkeletonCard linhas={4} />
  if (!dados) return null
  const linhas = dados.vendedoras.filter((v) => v.perfil === 'vendedora' || v.vendas > 0)
  return (
    <section className="flex flex-col gap-3">
      <Overline>Acompanhamento</Overline>
      <Card className="flex flex-col gap-3">
        {dados.valor_loja ? (
          <>
            <ProgressBar percentual={(dados.vendido / dados.valor_loja) * 100} rotulo="Meta da loja" />
            <p className="numeros text-body">
              {formatarMoeda(dados.vendido, { destaque: true })} de {formatarMoeda(dados.valor_loja, { destaque: true })}
              {dados.falta ? ` · faltam ${formatarMoeda(dados.falta, { destaque: true })}` : ''}
              {dados.por_dia ? ` · ${formatarMoeda(dados.por_dia, { destaque: true })} por dia` : ''}
            </p>
          </>
        ) : (
          <p className="numeros text-body">Vendido no mês: {formatarMoeda(dados.vendido, { destaque: true })} · sem meta</p>
        )}
      </Card>
      {linhas.length > 0 && (
        <Card semPadding className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="bg-background-muted text-label text-text-secondary">
              <tr>
                <th className="px-4 py-3">Vendedora</th>
                <th className="px-4 py-3 text-right">Meta</th>
                <th className="px-4 py-3 text-right">Vendido</th>
                <th className="px-4 py-3 text-right">%</th>
                <th className="px-4 py-3 text-right">Falta</th>
                <th className="px-4 py-3">Prêmio</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((v) => (
                <tr key={v.usuaria_id} className="border-t border-border-subtle">
                  <td className="px-4 py-3">{v.nome}</td>
                  <td className="numeros px-4 py-3 text-right">{v.meta ? formatarMoeda(v.meta, { destaque: true }) : '—'}</td>
                  <td className="numeros px-4 py-3 text-right">{formatarMoeda(v.vendido, { destaque: true })}</td>
                  <td className="numeros px-4 py-3 text-right">{v.percentual !== null ? `${Math.round(v.percentual)}%` : '—'}</td>
                  <td className="numeros px-4 py-3 text-right">{v.falta ? formatarMoeda(v.falta, { destaque: true }) : v.meta ? 'Bateu' : '—'}</td>
                  <td className="px-4 py-3">
                    {v.premio === 'conquistado' ? <Selo tom="sucesso">Conquistado</Selo> : v.premio === 'a_caminho' ? <Selo>A caminho</Selo> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  )
}
