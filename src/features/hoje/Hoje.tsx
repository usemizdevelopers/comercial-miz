import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CaretRight } from '@phosphor-icons/react'
import { Button, Card, CardCliente, CardPasta, CardVenda, Deslizavel, EmptyState, Overline, ProgressBar, Skeleton, SkeletonCard, useToast } from '@/components/ui'
import { BotaoWhatsapp } from '@/components/shared/BotaoWhatsapp'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { faltaParaMeta, faltaParaPremio, useResumoMes, type ResumoMes } from '@/features/metas/api'
import type { Pasta } from '@/features/clientes/api'
import { useAoVoltarParaAba } from '@/hooks/useAoVoltarParaAba'
import { useMensagens } from '@/hooks/useDadosLoja'
import { mensagemDeErro } from '@/lib/erros'
import { formatarDiaPorExtenso, formatarMoeda, formatarHora, haDias, saudacao } from '@/lib/formatadores'
import { resumirItens, rotuloPagamento } from '@/lib/vendas'
import { montarMensagem, primeiroNome } from '@/lib/whatsapp'
import { desfazerPulo, listarTarefas, minhasVendasHoje, pularHoje, type Tarefa, type VendaDeHoje } from './api'

const PASTAS: Array<{ id: Pasta; nome: string }> = [
  { id: 'follow_up', nome: 'Follow-up' },
  { id: 'pos_venda', nome: 'Pós-venda' },
  { id: 'aniversario', nome: 'Aniversário' },
]
const CHAVE_TAREFAS = ['hoje', 'tarefas']

/** /hoje — página inicial da vendedora (especificação, seção 6). */
export default function Hoje() {
  const { usuaria } = useSessao()
  const queryClient = useQueryClient()
  const [agora] = useState(() => new Date())

  const resumo = useResumoMes()
  const tarefas = useQuery({ queryKey: CHAVE_TAREFAS, queryFn: listarTarefas })
  const vendas = useQuery({ queryKey: ['hoje', 'vendas'], queryFn: minhasVendasHoje })

  useAoVoltarParaAba(() => {
    void queryClient.invalidateQueries({ queryKey: ['hoje'] })
    void queryClient.invalidateQueries({ queryKey: ['metas', 'resumo'] })
  })

  return (
    <div className="mx-auto flex w-full max-w-form flex-col gap-6 px-gutter pb-10 pt-6 lg:max-w-conteudo lg:pt-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1">
          {saudacao(agora)}, {primeiroNome(usuaria?.nome)}
        </h1>
        <p className="text-body text-text-secondary">{formatarDiaPorExtenso(agora)}</p>
      </header>

      <FaixaMeta resumo={resumo.data} carregando={resumo.isLoading} />

      <Pastas tarefas={tarefas.data} carregando={tarefas.isLoading} erro={tarefas.error} onTentar={() => void tarefas.refetch()} />

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <Overline>Minhas vendas de hoje</Overline>
          {vendas.data && <span className="numeros text-h3">{formatarMoeda(vendas.data.total_dia)}</span>}
        </div>
        {vendas.isLoading ? (
          <SkeletonCard linhas={2} />
        ) : vendas.error ? (
          <p className="text-body-sm text-danger">{mensagemDeErro(vendas.error)}</p>
        ) : !vendas.data || vendas.data.num_vendas === 0 ? (
          <p className="text-body-sm text-text-secondary">Nenhuma venda hoje ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {vendas.data.ultimas.map((v) => (
              <VendaHoje key={v.id} venda={v} />
            ))}
            {vendas.data.num_vendas > vendas.data.ultimas.length && (
              <p className="text-caption text-text-tertiary">
                {vendas.data.num_vendas} vendas hoje · mostrando as {vendas.data.ultimas.length} últimas
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ Faixa da meta */

function FaixaMeta({ resumo, carregando }: { resumo: ResumoMes | null | undefined; carregando: boolean }) {
  if (carregando) return <Skeleton className="h-pasta w-full" />
  const vendido = resumo?.vendido ?? 0
  const meta = resumo?.meta_individual ?? null
  const falta = faltaParaMeta(resumo)
  const faltaPremio = faltaParaPremio(resumo)

  return (
    <Link to="/metas" className="foco block rounded-lg" aria-label="Ver minhas metas">
      <Card tocavel className="flex flex-col gap-3">
        {meta ? (
          <>
            <ProgressBar percentual={(vendido / meta) * 100} />
            <div className="flex items-center justify-between gap-3">
              <p className="numeros text-body">
                Vendido {formatarMoeda(vendido, { destaque: true })}
                {falta ? ` · Faltam ${formatarMoeda(falta, { destaque: true })}` : ''}
              </p>
              <CaretRight weight="light" className="h-icone w-icone shrink-0 text-text-secondary" aria-hidden="true" />
            </div>
            {resumo?.premio_descricao &&
              (resumo.premio_conquistado ? (
                <p className="text-body-sm text-success">Prêmio conquistado: {resumo.premio_descricao}</p>
              ) : (
                faltaPremio !== null && <p className="numeros text-body-sm text-text-secondary">Faltam {formatarMoeda(faltaPremio, { destaque: true })} para o seu prêmio</p>
              ))}
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="numeros text-body">Vendido no mês: {formatarMoeda(vendido, { destaque: true })}</p>
            <CaretRight weight="light" className="h-icone w-icone shrink-0 text-text-secondary" aria-hidden="true" />
          </div>
        )}
      </Card>
    </Link>
  )
}

/* ------------------------------------------------------------------ Pastas */

function Pastas({ tarefas, carregando, erro, onTentar }: { tarefas: Tarefa[] | undefined; carregando: boolean; erro: unknown; onTentar: () => void }) {
  const [escolhida, setEscolhida] = useState<Pasta | null>(null)
  const porPasta = useMemo(() => {
    const g: Record<Pasta, Tarefa[]> = { follow_up: [], pos_venda: [], aniversario: [] }
    for (const t of tarefas ?? []) g[t.pasta]?.push(t)
    return g
  }, [tarefas])

  if (carregando) {
    return (
      <div className="flex gap-3">
        <Skeleton className="h-pasta flex-1" />
        <Skeleton className="h-pasta flex-1" />
        <Skeleton className="h-pasta flex-1" />
      </div>
    )
  }
  if (erro) {
    return (
      <Card>
        <EmptyState texto={mensagemDeErro(erro)} acao={<Button variante="secundario" onClick={onTentar}>Tentar de novo</Button>} />
      </Card>
    )
  }

  const total = (tarefas ?? []).length
  // sem escolha: abre a primeira pasta com alguém
  const aberta = escolhida && porPasta[escolhida].length > 0 ? escolhida : (PASTAS.find((p) => porPasta[p.id].length > 0)?.id ?? null)

  return (
    <section className="flex flex-col gap-4" aria-label="Chamar hoje">
      <Overline>Chamar hoje</Overline>
      <div className="flex gap-3">
        {PASTAS.map((p) => (
          <CardPasta key={p.id} nome={p.nome} quantidade={porPasta[p.id].length} ativa={aberta === p.id} onClick={() => setEscolhida(p.id)} />
        ))}
      </div>
      {total === 0 ? (
        <Card>
          <EmptyState
            texto="Ninguém para chamar agora. Que tal revisar as clientes que estão esfriando?"
            acao={
              <Link to="/clientes?coluna=recompra" className="foco sublinhado rounded-sm text-label">
                Ver Hora da recompra
              </Link>
            }
          />
        </Card>
      ) : (
        aberta && (
          <ul className="flex flex-col gap-3" aria-label={PASTAS.find((p) => p.id === aberta)?.nome}>
            {porPasta[aberta].map((t) => (
              <li key={t.cliente_id}>
                <CartaoTarefa tarefa={t} />
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  )
}

function CartaoTarefa({ tarefa: t }: { tarefa: Tarefa }) {
  const { usuaria } = useSessao()
  const navegar = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { data: mensagens } = useMensagens()

  const tirarDaLista = () =>
    queryClient.setQueryData<Tarefa[]>(CHAVE_TAREFAS, (lista) => (lista ?? []).filter((x) => x.cliente_id !== t.cliente_id))

  const pular = async () => {
    const anterior = queryClient.getQueryData<Tarefa[]>(CHAVE_TAREFAS)
    tirarDaLista()
    try {
      await pularHoje(t.cliente_id)
      toast.mostrar(`${primeiroNome(t.nome)} pulada até amanhã`, {
        rotulo: 'Desfazer',
        onClick: () => {
          if (!usuaria) return
          void desfazerPulo(t.cliente_id, usuaria.id)
            .then(() => queryClient.invalidateQueries({ queryKey: CHAVE_TAREFAS }))
            .catch((e: unknown) => toast.mostrar(mensagemDeErro(e)))
        },
      })
    } catch (e) {
      if (anterior) queryClient.setQueryData(CHAVE_TAREFAS, anterior)
      toast.mostrar(mensagemDeErro(e))
    }
  }

  // Mensagem pronta só em Pós-venda e Aniversário; Follow-up abre a conversa em branco
  const modelo = t.pasta === 'follow_up' ? undefined : mensagens?.[t.pasta]
  const texto = modelo ? montarMensagem(modelo, { nome: t.nome, loja: usuaria?.lojaNome }) : undefined

  return (
    <Deslizavel rotulo="Pular hoje" onDeslizar={() => void pular()}>
      <CardCliente
        nome={t.nome}
        linha2={
          <>
            {t.motivo}
            {t.ultima_compra_em ? ` · última compra ${haDias(t.ultima_compra_em)}` : ''}
          </>
        }
        onClick={() => navegar(`/clientes/${t.cliente_id}`)}
        acoes={
          <>
            <BotaoWhatsapp clienteId={t.cliente_id} whatsapp={t.whatsapp} pasta={t.pasta} texto={texto} onAberto={tirarDaLista} />
            <Button variante="texto" onClick={() => void pular()}>
              Pular hoje
            </Button>
          </>
        }
      />
    </Deslizavel>
  )
}

/* ------------------------------------------------------------------ Vendas de hoje */

function VendaHoje({ venda: v }: { venda: VendaDeHoje }) {
  const navegar = useNavigate()
  return (
    <CardVenda
      cliente={v.cliente_nome}
      valor={v.valor_total}
      itens={resumirItens(v.itens)}
      rodape={`${formatarHora(v.data_venda)} · ${rotuloPagamento(v.forma_pagamento)}`}
      onClick={() => navegar(`/clientes/${v.cliente_id}`)}
    />
  )
}
