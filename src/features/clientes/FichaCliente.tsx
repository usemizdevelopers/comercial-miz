import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowsLeftRight, ChatCircleText, PencilSimple, Plus, Trash, UsersThree } from '@phosphor-icons/react'
import { BolinhaCor, Button, Card, ConfirmSheet, EmptyState, Overline, SkeletonCard, StatusBadge, TextArea, TopBar, useToast } from '@/components/ui'
import { BotaoWhatsapp } from '@/components/shared/BotaoWhatsapp'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { useCaminhos } from '@/hooks/useCaminhos'
import { useHexDasCores, useNomesEquipe } from '@/hooks/useDadosLoja'
import { mensagemDeErro } from '@/lib/erros'
import { formatarAniversario, formatarData, formatarMoeda, formatarNumero, haDias } from '@/lib/formatadores'
import { primeiroNome } from '@/lib/whatsapp'
import { rotuloTamanho } from '@/lib/vendas'
import { atualizarCliente, buscarCliente, linhaDoTempo, vendasDaCliente, type EventoLinhaTempo } from './api'
import { FolhaEditarCliente } from './FolhaEditarCliente'
import { FolhaTransferir } from './FolhaTransferir'
import { FolhaMesclar } from './FolhaMesclar'
import { excluirCliente } from './admApi'
import { HistoricoCompras } from './HistoricoCompras'

const PASTAS: Record<string, string> = { follow_up: 'Follow-up', pos_venda: 'Pós-venda', aniversario: 'Aniversário' }

/** /clientes/:id — Ficha da cliente (especificação, seção 9). */
export default function FichaCliente() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const caminhos = useCaminhos()
  const { usuaria } = useSessao()
  const minhaId = usuaria?.id ?? ''
  const hex = useHexDasCores()
  const [editando, setEditando] = useState(false)
  const [transferindo, setTransferindo] = useState(false)
  const [mesclando, setMesclando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()

  const cliente = useQuery({ queryKey: ['cliente', id], queryFn: () => buscarCliente(id), enabled: !!id })
  const vendas = useQuery({ queryKey: ['cliente', id, 'vendas'], queryFn: () => vendasDaCliente(id), enabled: !!id })
  const linha = useQuery({ queryKey: ['cliente', id, 'linha'], queryFn: () => linhaDoTempo(id), enabled: !!id })

  const voltar = () => (window.history.length > 1 ? navegar(-1) : navegar(caminhos.clientes))

  if (cliente.isLoading) {
    return (
      <>
        <TopBar titulo="Cliente" onVoltar={voltar} />
        <div className="mx-auto flex w-full max-w-form flex-col gap-4 px-gutter pt-2">
          <SkeletonCard linhas={3} />
          <SkeletonCard linhas={4} />
        </div>
      </>
    )
  }

  const c = cliente.data
  if (!c) {
    return (
      <>
        <TopBar titulo="Cliente" onVoltar={voltar} />
        <EmptyState
          texto={cliente.error ? mensagemDeErro(cliente.error) : 'Cliente não encontrada.'}
          acao={<Button variante="secundario" onClick={() => navegar(caminhos.clientes)}>Ver clientes</Button>}
        />
      </>
    )
  }

  const souAdm = usuaria?.papel === 'adm'
  // ações a mais da dona (seção 14), só no painel da ADM
  const painelAdm = souAdm && caminhos.adm
  const podeTransferir = souAdm || !c.vendedora_id || c.vendedora_id === minhaId
  const pecas = Array.isArray(c.pecas_miz_compradas) ? (c.pecas_miz_compradas as Array<{ peca_id: string; nome: string; quantidade: number }>) : []
  const aniversario = formatarAniversario(c.aniv_dia, c.aniv_mes)
  const compras = c.num_compras ?? 0

  return (
    <>
      <TopBar titulo={c.nome} onVoltar={voltar} />
      <div className="mx-auto flex w-full max-w-form flex-col gap-6 px-gutter pb-10 pt-2">
        {/* 1. Cabeçalho */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={c.status} />
            {c.etapa_kanban === 'sem_interesse' && <span className="text-caption text-text-tertiary">Sem interesse</span>}
          </div>
          <div className="flex flex-col gap-1 text-body-sm text-text-secondary">
            {aniversario && <p>Aniversário: {aniversario}</p>}
            <p>Responsável: {c.vendedora_nome ?? 'sem responsável'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <BotaoWhatsapp clienteId={c.id} whatsapp={c.whatsapp} tamanho="medio" />
            <Button icone={<Plus weight="light" className="h-icone w-icone" />} onClick={() => navegar(caminhos.novaVenda(c.id))}>
              Nova venda
            </Button>
            {podeTransferir && (
              <Button variante="secundario" icone={<ArrowsLeftRight weight="light" className="h-icone w-icone" />} onClick={() => setTransferindo(true)}>
                {painelAdm ? 'Trocar responsável' : 'Transferir'}
              </Button>
            )}
            <Button variante="secundario" icone={<PencilSimple weight="light" className="h-icone w-icone" />} onClick={() => setEditando(true)}>
              Editar
            </Button>
            {painelAdm && (
              <>
                <Button variante="secundario" icone={<UsersThree weight="light" className="h-icone w-icone" />} onClick={() => setMesclando(true)}>
                  Mesclar duplicada
                </Button>
                <Button variante="destrutivo" icone={<Trash weight="light" className="h-icone w-icone" />} onClick={() => setExcluindo(true)}>
                  Excluir
                </Button>
              </>
            )}
          </div>
        </section>

        {c.recado_transferencia && (
          <Card className="flex flex-col gap-1 border-0 bg-background-muted">
            <Overline>Recado da transferência</Overline>
            <p className="text-body">{c.recado_transferencia}</p>
          </Card>
        )}

        {/* 2. Resumo em 4 números */}
        <section className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-3">
            <Numero rotulo="Compras" valor={formatarNumero(compras)} />
            <Numero rotulo="Total gasto" valor={formatarMoeda(c.total_gasto ?? 0, { destaque: true })} />
            <Numero rotulo="Ticket médio" valor={c.ticket_medio ? formatarMoeda(c.ticket_medio, { destaque: true }) : '—'} />
            <Numero rotulo="Compra a cada" valor={c.intervalo_medio_dias ? `${Math.round(c.intervalo_medio_dias)} dias` : '—'} />
          </div>
          <p className="text-body-sm text-text-secondary">{c.ultima_compra_em ? `Última compra ${haDias(c.ultima_compra_em)}` : 'Ainda sem compra'}</p>
        </section>

        {/* 3. Preferências */}
        {compras > 0 && (
          <section className="flex flex-col gap-3">
            <Overline>Preferências</Overline>
            <Card className="flex flex-col gap-3">
              <p className="text-body">
                <span className="text-text-secondary">Tamanho: </span>
                {c.tamanho_preferido ? rotuloTamanho(c.tamanho_preferido) : '—'}
              </p>
              {(c.cores_preferidas ?? []).length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {(c.cores_preferidas ?? []).slice(0, 3).map((cor) => (
                    <span key={cor} className="inline-flex items-center gap-2 text-body">
                      <BolinhaCor hex={hex(cor)} /> {cor}
                    </span>
                  ))}
                </div>
              )}
              {pecas.length > 0 && (
                <ul className="flex flex-col gap-1 border-t border-border-subtle pt-3 text-body-sm">
                  {pecas.map((p) => (
                    <li key={p.peca_id} className="flex justify-between gap-3">
                      <span className="truncate">{p.nome}</span>
                      <span className="numeros shrink-0 text-text-secondary">{p.quantidade}×</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        )}

        {/* 4. Histórico de compras */}
        <section className="flex flex-col gap-3">
          <Overline>Histórico de compras</Overline>
          {vendas.isLoading ? <SkeletonCard linhas={2} /> : <HistoricoCompras clienteId={c.id} vendas={vendas.data ?? []} minhaId={minhaId} onAbrirVenda={painelAdm ? (v) => navegar(`/adm/vendas/${v}`) : undefined} />}
        </section>

        {/* 6. Observações */}
        <Observacoes key={c.id} clienteId={c.id} inicial={c.observacoes ?? ''} />

        {/* 5. Linha do tempo */}
        <section className="flex flex-col gap-3">
          <Overline>Contatos e transferências</Overline>
          {linha.isLoading ? <SkeletonCard linhas={2} /> : <LinhaDoTempo eventos={linha.data ?? []} />}
        </section>
      </div>

      <FolhaEditarCliente cliente={c} aberta={editando} onFechar={() => setEditando(false)} />
      <FolhaTransferir cliente={c} aberta={transferindo} onFechar={() => setTransferindo(false)} />
      {painelAdm && (
        <>
          <FolhaMesclar cliente={c} aberta={mesclando} onFechar={() => setMesclando(false)} />
          <ConfirmSheet
            aberta={excluindo}
            onFechar={() => setExcluindo(false)}
            pergunta={`Excluir ${c.nome}?`}
            consequencia={
              compras > 0
                ? 'Ela tem vendas: as vendas continuam nos números da loja como "Cliente removida". Nome, WhatsApp, aniversário e observações são apagados e ela sai das listas e das pastas.'
                : 'Ela não tem vendas e será apagada de vez, com os contatos registrados.'
            }
            textoConfirmar="Excluir cliente"
            destrutivo
            carregando={ocupado}
            onConfirmar={() => {
              setOcupado(true)
              excluirCliente(c.id)
                .then((r) => {
                  toast.mostrar(r === 'apagada' || compras === 0 ? 'Cliente excluída' : 'Cliente removida; as vendas continuam nos números')
                  void queryClient.invalidateQueries({ queryKey: ['clientes'] })
                  navegar('/adm/clientes', { replace: true })
                })
                .catch((e: unknown) => toast.mostrar(mensagemDeErro(e)))
                .finally(() => {
                  setOcupado(false)
                  setExcluindo(false)
                })
            }}
          />
        </>
      )}
    </>
  )
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <Overline>{rotulo}</Overline>
      <p className="numeros text-h2">{valor}</p>
    </Card>
  )
}

/** Observações: salvas ao sair do campo. */
function Observacoes({ clienteId, inicial }: { clienteId: string; inicial: string }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [texto, setTexto] = useState(inicial)
  const [salvo, setSalvo] = useState(inicial)

  const salvar = async () => {
    if (texto.trim() === salvo.trim()) return
    try {
      await atualizarCliente(clienteId, { observacoes: texto.trim() || null })
      setSalvo(texto)
      void queryClient.invalidateQueries({ queryKey: ['cliente', clienteId] })
      toast.mostrar('Observação salva')
    } catch (e) {
      toast.mostrar(mensagemDeErro(e))
    }
  }

  return (
    <TextArea
      rotulo="Observações"
      placeholder="prefere modelagem mais solta"
      maximo={500}
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => void salvar()}
    />
  )
}

function LinhaDoTempo({ eventos }: { eventos: EventoLinhaTempo[] }) {
  const nomes = useNomesEquipe()
  const nome = (id: string | null | undefined) => primeiroNome(id ? nomes.get(id) : null) || 'alguém'

  if (eventos.length === 0) return <p className="text-body-sm text-text-secondary">Nenhum contato registrado ainda.</p>

  return (
    <ul className="flex flex-col">
      {eventos.map((e) => (
        <li key={`${e.tipo}-${e.id}`} className="flex gap-3 border-b border-border-subtle py-3 last:border-b-0">
          {e.tipo === 'contato' ? (
            <ChatCircleText weight="light" className="mt-1 h-icone w-icone shrink-0 text-text-secondary" aria-hidden="true" />
          ) : (
            <ArrowsLeftRight weight="light" className="mt-1 h-icone w-icone shrink-0 text-text-secondary" aria-hidden="true" />
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-body-sm">
              {e.tipo === 'contato'
                ? `WhatsApp aberto por ${nome(e.usuariaId)}${e.pasta ? ` (${PASTAS[e.pasta] ?? e.pasta})` : ''}`
                : e.motivo === 'venda'
                  ? `Passou para ${nome(e.paraId)} pela venda`
                  : e.deId
                    ? `Transferida de ${nome(e.deId)} para ${nome(e.paraId)}`
                    : `Atribuída a ${nome(e.paraId)}`}
              <span className="text-text-tertiary"> · {formatarData(e.quando)}</span>
            </p>
            {e.recado && <p className="text-caption text-text-secondary">"{e.recado}"</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
