import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CaretDown, PencilSimple, Trash } from '@phosphor-icons/react'
import {
  BottomSheet,
  Button,
  Card,
  ChipGroup,
  ChipPagamento,
  EmptyState,
  ItemLinha,
  MoneyField,
  Overline,
  TextArea,
  useToast,
} from '@/components/ui'
import { useNomesEquipe } from '@/hooks/useDadosLoja'
import { cn } from '@/lib/cn'
import { mensagemDeErro } from '@/lib/erros'
import { formatarData, formatarMoeda } from '@/lib/formatadores'
import { PAGAMENTOS, resumirItens, rotuloPagamento, textoItem, type FormaPagamento } from '@/lib/vendas'
import { editarVenda, excluirVenda, type VendaDaCliente } from './api'

const VINTE_QUATRO_HORAS = 24 * 60 * 60 * 1000

/** A vendedora edita ou exclui a própria venda por até 24 h após o lançamento (o banco confere de novo). */
function podeMexer(v: VendaDaCliente, minhaId: string, agora: number): boolean {
  return v.vendedora_id === minhaId && agora - new Date(v.created_at).getTime() < VINTE_QUATRO_HORAS
}

/** Histórico de compras: da mais recente para a mais antiga; toque expande os itens. */
export function HistoricoCompras({
  clienteId,
  vendas,
  minhaId,
  onAbrirVenda,
}: {
  clienteId: string
  vendas: VendaDaCliente[]
  minhaId: string
  /** ADM: abre o detalhe da venda (editar tudo, sem limite de 24 h) */
  onAbrirVenda?: (id: string) => void
}) {
  const nomes = useNomesEquipe()
  const [aberta, setAberta] = useState<string | null>(null)
  const [editando, setEditando] = useState<VendaDaCliente | null>(null)
  const [excluindo, setExcluindo] = useState<VendaDaCliente | null>(null)
  // "agora" fixo por montagem: o prazo de 24 h só precisa valer para esta visita
  const [agora] = useState(() => Date.now())

  if (vendas.length === 0) {
    return (
      <Card>
        <EmptyState texto="Ainda sem compras." />
      </Card>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {vendas.map((v) => {
          const expandida = aberta === v.id
          const mexe = podeMexer(v, minhaId, agora)
          return (
            <li key={v.id}>
              <Card semPadding>
                <button
                  type="button"
                  aria-expanded={expandida}
                  onClick={() => setAberta(expandida ? null : v.id)}
                  className="foco flex w-full items-start justify-between gap-3 rounded-lg p-4 text-left lg:p-5"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="numeros text-label">
                      {formatarData(v.data_venda)} · {formatarMoeda(v.valor_total)}
                    </span>
                    <span className="truncate text-body-sm text-text-secondary">{resumirItens(v.itens)}</span>
                    <span className="truncate text-caption text-text-tertiary">
                      {nomes.get(v.vendedora_id) ?? 'Vendedora'} · {rotuloPagamento(v.forma_pagamento)}
                    </span>
                  </span>
                  <CaretDown
                    weight="light"
                    className={cn('mt-1 h-icone w-icone shrink-0 text-text-secondary transition-transform duration-fast', expandida && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>
                {expandida && (
                  <div className="flex flex-col gap-3 border-t border-border-subtle px-4 pb-4 pt-2 lg:px-5">
                    <div>
                      {v.itens.map((i) => (
                        <ItemLinha key={i.id} hex={i.cor_hex} texto={textoItem(i)} />
                      ))}
                    </div>
                    {onAbrirVenda && (
                      <Button variante="secundario" tamanho="pequeno" className="self-start" onClick={() => onAbrirVenda(v.id)}>
                        Abrir venda
                      </Button>
                    )}
                    {mexe && !onAbrirVenda && (
                      <div className="flex flex-wrap gap-3">
                        <Button variante="secundario" tamanho="pequeno" icone={<PencilSimple weight="light" className="h-icone w-icone" />} onClick={() => setEditando(v)}>
                          Editar valor e pagamento
                        </Button>
                        <Button variante="destrutivo" tamanho="pequeno" icone={<Trash weight="light" className="h-icone w-icone" />} onClick={() => setExcluindo(v)}>
                          Excluir
                        </Button>
                      </div>
                    )}
                    {mexe && !onAbrirVenda && <p className="text-caption text-text-tertiary">Para trocar peças, exclua e lance a venda de novo.</p>}
                  </div>
                )}
              </Card>
            </li>
          )
        })}
      </ul>
      <FolhaEditarVenda clienteId={clienteId} venda={editando} onFechar={() => setEditando(null)} />
      <FolhaExcluirVenda clienteId={clienteId} venda={excluindo} onFechar={() => setExcluindo(null)} />
    </>
  )
}

function useAtualizarDepois(clienteId: string) {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ['cliente', clienteId] })
    void queryClient.invalidateQueries({ queryKey: ['clientes'] })
    void queryClient.invalidateQueries({ queryKey: ['metas'] })
    void queryClient.invalidateQueries({ queryKey: ['hoje'] })
  }
}

function FolhaEditarVenda({ clienteId, venda, onFechar }: { clienteId: string; venda: VendaDaCliente | null; onFechar: () => void }) {
  return (
    <BottomSheet aberta={!!venda} onFechar={onFechar} titulo="Editar venda">
      {venda && <FormEditarVenda key={venda.id} clienteId={clienteId} venda={venda} onFechar={onFechar} />}
    </BottomSheet>
  )
}

function FormEditarVenda({ clienteId, venda, onFechar }: { clienteId: string; venda: VendaDaCliente; onFechar: () => void }) {
  const toast = useToast()
  const atualizar = useAtualizarDepois(clienteId)
  const [valor, setValor] = useState<number | null>(venda.valor_total)
  const [pagamento, setPagamento] = useState<FormaPagamento>(venda.forma_pagamento as FormaPagamento)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const salvar = async () => {
    if (!valor) return
    setSalvando(true)
    setErro(null)
    try {
      await editarVenda(venda.id, { valor_total: valor, forma_pagamento: pagamento })
      await atualizar()
      toast.mostrar('Venda atualizada')
      onFechar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <MoneyField rotulo="Valor total" obrigatorio value={valor} onChange={setValor} />
      <div className="flex flex-col gap-2">
        <Overline>Forma de pagamento</Overline>
        <ChipGroup rotulo="Forma de pagamento">
          {PAGAMENTOS.map((p) => (
            <ChipPagamento key={p.valor} rotulo={p.rotulo} selecionado={pagamento === p.valor} onClick={() => setPagamento(p.valor)} />
          ))}
        </ChipGroup>
      </div>
      {erro && (
        <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">
          {erro}
        </p>
      )}
      <Button larguraTotal disabled={!valor} carregando={salvando} onClick={() => void salvar()}>
        Salvar
      </Button>
    </div>
  )
}

function FolhaExcluirVenda({ clienteId, venda, onFechar }: { clienteId: string; venda: VendaDaCliente | null; onFechar: () => void }) {
  return (
    <BottomSheet aberta={!!venda} onFechar={onFechar} titulo="Excluir venda">
      {venda && <FormExcluirVenda key={venda.id} clienteId={clienteId} venda={venda} onFechar={onFechar} />}
    </BottomSheet>
  )
}

function FormExcluirVenda({ clienteId, venda, onFechar }: { clienteId: string; venda: VendaDaCliente; onFechar: () => void }) {
  const toast = useToast()
  const atualizar = useAtualizarDepois(clienteId)
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const excluir = async () => {
    if (!motivo.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      await excluirVenda(venda.id, motivo.trim())
      await atualizar()
      toast.mostrar('Venda excluída')
      onFechar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-body-sm text-text-secondary">
        Venda de {formatarMoeda(venda.valor_total)} em {formatarData(venda.data_venda)}. Ela sai dos números da cliente, das metas e do painel da dona.
      </p>
      <TextArea rotulo="Motivo" obrigatorio maximo={200} placeholder="lancei duas vezes, cliente desistiu…" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      {erro && (
        <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">
          {erro}
        </p>
      )}
      <Button variante="destrutivo" larguraTotal disabled={!motivo.trim()} carregando={salvando} onClick={() => void excluir()}>
        Excluir venda
      </Button>
    </div>
  )
}
