import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from '@phosphor-icons/react'
import {
  BottomSheet,
  Button,
  Card,
  ChipGroup,
  ChipPagamento,
  ConfirmSheet,
  EmptyState,
  ItemLinha,
  MoneyField,
  Overline,
  QuantityStepper,
  SelectField,
  Selo,
  SkeletonCard,
  TextArea,
  TextField,
  useToast,
} from '@/components/ui'
import { CabecalhoPagina } from '@/components/shared/CabecalhoPagina'
import { useEquipe, useNomesEquipe } from '@/hooks/useDadosLoja'
import { mensagemDeErro } from '@/lib/erros'
import { dataLocal, formatarDataHora, formatarMoeda } from '@/lib/formatadores'
import { hojeIso, iso } from '@/lib/periodo'
import { PAGAMENTOS, rotuloPagamento, textoItem, type FormaPagamento } from '@/lib/vendas'
import {
  adicionarItem,
  alteracoesDaVenda,
  atualizarQuantidade,
  buscarVenda,
  editarVendaAdm,
  excluirVendaAdm,
  removerItem,
  restaurarVenda,
  type VendaAdm,
} from './admApi'
import { descreverAlteracao } from './alteracoes'
import { BlocoMiz, BlocoOutraMarca } from './PassoPecas'
import type { ItemForm } from './rascunho'

/** /adm/vendas/:id — detalhe da venda para a ADM: edita tudo (sem limite de 24 h), exclui e mostra as alterações. */
export default function VendaDetalhe() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const nomes = useNomesEquipe()
  const venda = useQuery({ queryKey: ['adm', 'venda', id], queryFn: () => buscarVenda(id), enabled: !!id })
  const alteracoes = useQuery({ queryKey: ['adm', 'venda', id, 'alteracoes'], queryFn: () => alteracoesDaVenda(id), enabled: !!id })
  const [editando, setEditando] = useState(false)
  const [adicionando, setAdicionando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [ocupado, setOcupado] = useState<string | null>(null)

  const atualizar = async () => {
    await queryClient.invalidateQueries({ queryKey: ['adm'] })
    void queryClient.invalidateQueries({ queryKey: ['painel'] })
    void queryClient.invalidateQueries({ queryKey: ['clientes'] })
    if (venda.data) void queryClient.invalidateQueries({ queryKey: ['cliente', venda.data.cliente_id] })
  }

  const acao = async (chave: string, fn: () => Promise<void>, ok: string) => {
    setOcupado(chave)
    try {
      await fn()
      toast.mostrar(ok)
      await atualizar()
    } catch (e) {
      toast.mostrar(mensagemDeErro(e))
    } finally {
      setOcupado(null)
    }
  }

  if (venda.isLoading) {
    return (
      <div className="mx-auto w-full max-w-form px-gutter pt-6">
        <SkeletonCard linhas={5} />
      </div>
    )
  }
  const v = venda.data
  if (!v) {
    return <EmptyState texto={venda.error ? mensagemDeErro(venda.error) : 'Venda não encontrada.'} acao={<Button variante="secundario" onClick={() => navegar('/adm/vendas')}>Ver vendas</Button>} />
  }

  return (
    <div className="mx-auto flex w-full max-w-form flex-col gap-6 px-gutter pb-10">
      <CabecalhoPagina
        titulo={`Venda de ${formatarMoeda(v.valor_total)}`}
        subtitulo={formatarDataHora(v.data_venda)}
        onVoltar={() => (window.history.length > 1 ? navegar(-1) : navegar('/adm/vendas'))}
        acao={v.excluida ? <Selo tom="perigo">Excluída</Selo> : v.tem_peca_miz ? <Selo tom="escuro">Miz</Selo> : undefined}
      />

      {v.excluida && (
        <Card className="flex flex-col gap-3 border-0 bg-danger-soft">
          <p className="text-body text-danger">Excluída{v.motivo_exclusao ? `: ${v.motivo_exclusao}` : ''}. Não entra em nenhum número.</p>
          <Button variante="secundario" tamanho="pequeno" className="self-start" onClick={() => setRestaurando(true)}>
            Restaurar venda
          </Button>
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <Linha rotulo="Cliente">
          <Link to={`/adm/clientes/${v.cliente_id}`} className="foco sublinhado rounded-sm text-label">
            {v.cliente_nome}
          </Link>
        </Linha>
        <Linha rotulo="Vendedora">{nomes.get(v.vendedora_id) ?? '—'}</Linha>
        <Linha rotulo="Data da venda">{formatarDataHora(v.data_venda)}</Linha>
        <Linha rotulo="Lançada em">{formatarDataHora(v.created_at)}</Linha>
        <Linha rotulo="Pagamento">{rotuloPagamento(v.forma_pagamento)}</Linha>
        <Linha rotulo="Valor">
          <span className="numeros text-label">{formatarMoeda(v.valor_total)}</span>
        </Linha>
        {!v.excluida && (
          <Button variante="secundario" tamanho="pequeno" className="self-start" onClick={() => setEditando(true)}>
            Editar valor, pagamento, data e vendedora
          </Button>
        )}
      </Card>

      <section className="flex flex-col gap-3">
        <Overline>Itens</Overline>
        <Card className="flex flex-col gap-1">
          {v.itens.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <ItemLinha
                  hex={i.cor_hex}
                  texto={textoItem(i)}
                  onRemover={!v.excluida && v.itens.length > 1 ? () => void acao(`rem-${i.id}`, () => removerItem(i.id), 'Item removido') : undefined}
                />
              </div>
              {!v.excluida && (
                <QuantityStepper
                  value={i.quantidade}
                  rotulo={`Quantidade de ${textoItem(i)}`}
                  onChange={(q) => void acao(`qtd-${i.id}`, () => atualizarQuantidade(i.id, q), 'Quantidade alterada')}
                />
              )}
            </div>
          ))}
          {!v.excluida && v.itens.length === 1 && <p className="text-caption text-text-tertiary">A venda precisa de pelo menos uma peça. Para trocar, adicione a nova e remova a antiga.</p>}
        </Card>
        {!v.excluida && (
          <Button variante="secundario" className="self-start" icone={<Plus weight="light" className="h-icone w-icone" />} onClick={() => setAdicionando(true)}>
            Adicionar peça
          </Button>
        )}
      </section>

      {!v.excluida && (
        <Button variante="destrutivo" className="self-start" onClick={() => setExcluindo(true)}>
          Excluir venda
        </Button>
      )}

      <section className="flex flex-col gap-3">
        <Overline>Registro de alterações</Overline>
        {alteracoes.isLoading ? (
          <SkeletonCard linhas={2} />
        ) : (alteracoes.data ?? []).length === 0 ? (
          <p className="text-body-sm text-text-secondary">Nenhuma alteração desde o lançamento.</p>
        ) : (
          <Card semPadding>
            <ul>
              {(alteracoes.data ?? []).map((a) => (
                <li key={a.id} className="flex flex-col gap-1 border-b border-border-subtle px-4 py-3 last:border-b-0">
                  <p className="text-caption text-text-tertiary">
                    {formatarDataHora(a.created_at)} · {a.usuaria_id ? (nomes.get(a.usuaria_id) ?? 'alguém da loja') : 'sistema'}
                  </p>
                  {descreverAlteracao(a, nomes).map((t) => (
                    <p key={t} className="text-body-sm">
                      {t}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <FolhaEditar venda={v} aberta={editando} onFechar={() => setEditando(false)} onSalvo={atualizar} />
      <BottomSheet aberta={adicionando} onFechar={() => setAdicionando(false)} titulo="Adicionar peça" computador="lateral">
        {adicionando && (
          <AdicionarPeca
            onAdicionar={(item) =>
              void acao(
                'add',
                () =>
                  adicionarItem(v.id, {
                    tipo: item.tipo,
                    peca_id: item.peca_id,
                    peca_cor_id: item.peca_cor_id,
                    cor: item.cor,
                    tamanho: item.tamanho,
                    quantidade: item.quantidade,
                  }),
                'Peça adicionada',
              ).then(() => setAdicionando(false))
            }
          />
        )}
      </BottomSheet>
      <FolhaExcluir venda={v} aberta={excluindo} onFechar={() => setExcluindo(false)} onSalvo={atualizar} />
      <ConfirmSheet
        aberta={restaurando}
        onFechar={() => setRestaurando(false)}
        pergunta="Restaurar esta venda?"
        consequencia="Ela volta para os números da cliente, das metas e do painel."
        textoConfirmar="Restaurar"
        carregando={ocupado === 'restaurar'}
        onConfirmar={() => void acao('restaurar', () => restaurarVenda(v.id), 'Venda restaurada').then(() => setRestaurando(false))}
      />
    </div>
  )
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border-subtle pb-3 last:border-b-0 last:pb-0">
      <span className="text-body-sm text-text-secondary">{rotulo}</span>
      <span className="text-right text-body">{children}</span>
    </div>
  )
}

function AdicionarPeca({ onAdicionar }: { onAdicionar: (i: Omit<ItemForm, 'chave'>) => void }) {
  const [tipo, setTipo] = useState<'miz' | 'outra'>('miz')
  return (
    <div className="flex flex-col gap-5">
      <ChipGroup rotulo="Tipo de peça">
        <ChipPagamento rotulo="Peça Miz" selecionado={tipo === 'miz'} onClick={() => setTipo('miz')} />
        <ChipPagamento rotulo="Outra marca" selecionado={tipo === 'outra'} onClick={() => setTipo('outra')} />
      </ChipGroup>
      {tipo === 'miz' ? <BlocoMiz onAdicionar={onAdicionar} /> : <BlocoOutraMarca onAdicionar={onAdicionar} />}
    </div>
  )
}

/** Data 'yyyy-MM-dd' → instante ao meio-dia de São Paulo (sem risco de virar o dia). */
function instanteDoDia(dia: string): string {
  return new Date(`${dia}T12:00:00-03:00`).toISOString()
}

function FolhaEditar({ venda, aberta, onFechar, onSalvo }: { venda: VendaAdm; aberta: boolean; onFechar: () => void; onSalvo: () => Promise<void> }) {
  return (
    <BottomSheet aberta={aberta} onFechar={onFechar} titulo="Editar venda" computador="lateral">
      {aberta && <FormEditar venda={venda} onFechar={onFechar} onSalvo={onSalvo} />}
    </BottomSheet>
  )
}

function FormEditar({ venda, onFechar, onSalvo }: { venda: VendaAdm; onFechar: () => void; onSalvo: () => Promise<void> }) {
  const toast = useToast()
  const { data: equipe } = useEquipe()
  const diaOriginal = iso(dataLocal(venda.data_venda))
  const [valor, setValor] = useState<number | null>(venda.valor_total)
  const [pagamento, setPagamento] = useState<FormaPagamento>(venda.forma_pagamento as FormaPagamento)
  const [dia, setDia] = useState(diaOriginal)
  const [vendedora, setVendedora] = useState(venda.vendedora_id)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const salvar = async () => {
    if (!valor) return
    setSalvando(true)
    setErro(null)
    try {
      const dados: Parameters<typeof editarVendaAdm>[1] = {}
      if (valor !== venda.valor_total) dados.valor_total = valor
      if (pagamento !== venda.forma_pagamento) dados.forma_pagamento = pagamento
      if (dia !== diaOriginal) dados.data_venda = instanteDoDia(dia)
      if (vendedora !== venda.vendedora_id) dados.vendedora_id = vendedora
      if (Object.keys(dados).length > 0) await editarVendaAdm(venda.id, dados)
      toast.mostrar('Venda atualizada')
      await onSalvo()
      onFechar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  const opcoesVendedora = (equipe ?? []).filter((u) => u.situacao === 'ativa' || u.id === venda.vendedora_id)

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
      <TextField rotulo="Data da venda" type="date" max={hojeIso()} value={dia} onChange={(e) => e.target.value && setDia(e.target.value)} />
      <SelectField
        rotulo="Vendedora"
        value={vendedora}
        onChange={(e) => setVendedora(e.target.value)}
        opcoes={opcoesVendedora.map((u) => ({ valor: u.id, rotulo: u.situacao === 'ativa' ? u.nome : `${u.nome} (inativa)` }))}
        ajuda="A venda passa a contar na meta de quem ficar aqui."
      />
      {erro && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">{erro}</p>}
      <Button disabled={!valor} carregando={salvando} onClick={() => void salvar()}>
        Salvar
      </Button>
    </div>
  )
}

function FolhaExcluir({ venda, aberta, onFechar, onSalvo }: { venda: VendaAdm; aberta: boolean; onFechar: () => void; onSalvo: () => Promise<void> }) {
  const toast = useToast()
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const excluir = async () => {
    setSalvando(true)
    setErro(null)
    try {
      await excluirVendaAdm(venda.id, motivo.trim())
      toast.mostrar('Venda excluída')
      await onSalvo()
      onFechar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }
  return (
    <BottomSheet aberta={aberta} onFechar={onFechar} titulo="Excluir venda">
      <div className="flex flex-col gap-5">
        <p className="text-body-sm text-text-secondary">
          Venda de {formatarMoeda(venda.valor_total)} para {venda.cliente_nome}. Ela sai dos números da cliente, das metas e do painel. Dá para restaurar depois.
        </p>
        <TextArea rotulo="Motivo" obrigatorio maximo={200} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        {erro && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">{erro}</p>}
        <Button variante="destrutivo" disabled={!motivo.trim()} carregando={salvando} onClick={() => void excluir()}>
          Excluir venda
        </Button>
      </div>
    </BottomSheet>
  )
}
