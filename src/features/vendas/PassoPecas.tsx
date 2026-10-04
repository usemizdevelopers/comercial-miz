import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from '@phosphor-icons/react'
import {
  Button,
  CardPeca,
  ChipCor,
  ChipFiltro,
  ChipGroup,
  ChipPagamento,
  ChipTamanho,
  ItemLinha,
  Overline,
  QuantityStepper,
  SearchField,
  SkeletonCard,
  TextField,
} from '@/components/ui'
import { useCatalogo, type PecaCatalogo } from '@/hooks/useDadosLoja'
import { mensagemDeErro } from '@/lib/erros'
import { novoId } from '@/lib/id'
import { semAcento } from '@/lib/texto'
import { TAMANHOS_OUTRA, textoItem } from '@/lib/vendas'
import { coresUsadas } from './api'
import type { EstadoVenda, ItemForm } from './rascunho'

type Mudar = (parcial: Partial<EstadoVenda>) => void

/** Passo 2 · Peças: Miz (catálogo, sem foto) e/ou outra marca. */
export function PassoPecas({ estado, mudar }: { estado: EstadoVenda; mudar: Mudar }) {
  const adicionar = (item: Omit<ItemForm, 'chave'>) => mudar({ itens: [...estado.itens, { ...item, chave: novoId() }] })
  const remover = (chave: string) => mudar({ itens: estado.itens.filter((i) => i.chave !== chave) })
  const mostrarOutras = estado.temMiz === false || estado.outrasAbertas

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-h2">Tem peça Miz neste pedido?</h2>
        <ChipGroup rotulo="Tem peça Miz">
          <ChipPagamento rotulo="Sim" selecionado={estado.temMiz === true} onClick={() => mudar({ temMiz: true })} />
          <ChipPagamento rotulo="Não" selecionado={estado.temMiz === false} onClick={() => mudar({ temMiz: false })} />
        </ChipGroup>
      </div>

      {estado.itens.length > 0 && (
        <div className="flex flex-col gap-1">
          <Overline>
            {estado.itens.length} {estado.itens.length === 1 ? 'peça adicionada' : 'peças adicionadas'}
          </Overline>
          <div>
            {estado.itens.map((i) => (
              <ItemLinha key={i.chave} hex={i.cor_hex} texto={textoItem(i)} onRemover={() => remover(i.chave)} />
            ))}
          </div>
        </div>
      )}

      {estado.temMiz === true && <BlocoMiz onAdicionar={adicionar} />}

      {estado.temMiz === true && !estado.outrasAbertas && (
        <Button variante="texto" className="self-start" onClick={() => mudar({ outrasAbertas: true })}>
          Tem peça de outra marca também?
        </Button>
      )}

      {mostrarOutras && <BlocoOutraMarca onAdicionar={adicionar} />}
    </div>
  )
}

/* ------------------------------------------------------------------ Peça Miz */

function BlocoMiz({ onAdicionar }: { onAdicionar: (i: Omit<ItemForm, 'chave'>) => void }) {
  const { data, isLoading, error } = useCatalogo()
  const [busca, setBusca] = useState('')
  const [peca, setPeca] = useState<PecaCatalogo | null>(null)
  const [corId, setCorId] = useState<string | null>(null)
  const [tamanho, setTamanho] = useState<string | null>(null)
  const [qtd, setQtd] = useState(1)

  const ativas = useMemo(
    () => (data ?? []).filter((p) => p.ativa).map((p) => ({ ...p, cores: p.cores.filter((c) => c.ativa) })),
    [data],
  )
  const filtradas = useMemo(() => {
    const t = semAcento(busca)
    if (!t) return ativas
    return ativas.filter((p) => semAcento(p.nome).includes(t) || semAcento(p.codigo_referencia).includes(t))
  }, [ativas, busca])

  const limpar = () => {
    setPeca(null)
    setCorId(null)
    setTamanho(null)
    setQtd(1)
    setBusca('')
  }

  const escolher = (p: PecaCatalogo) => {
    setPeca(p)
    setCorId(p.cores.length === 1 ? (p.cores[0]?.id ?? null) : null)
    setTamanho(p.tamanhos.length === 1 ? (p.tamanhos[0] ?? null) : null)
    setQtd(1)
  }

  const cor = peca?.cores.find((c) => c.id === corId) ?? null

  const adicionar = () => {
    if (!peca || !cor || !tamanho) return
    onAdicionar({ tipo: 'miz', peca_id: peca.id, peca_nome: peca.nome, peca_cor_id: cor.id, cor: cor.nome, cor_hex: cor.valor, tamanho, quantidade: qtd })
    limpar()
  }

  if (isLoading) return <SkeletonCard linhas={3} />
  if (error) return <p role="alert" className="text-body-sm text-danger">{mensagemDeErro(error)}</p>

  if (peca) {
    return (
      <div className="flex flex-col gap-5">
        <CardPeca nome={peca.nome} codigo={peca.codigo_referencia} cores={peca.cores.map((c) => ({ id: c.id, hex: c.valor }))} selecionado onClick={limpar} />
        <p className="-mt-3 text-caption text-text-tertiary">Toque na peça para escolher outra.</p>
        <div className="flex flex-col gap-2">
          <Overline>Cor</Overline>
          <ChipGroup rotulo="Cor">
            {peca.cores.map((c) => (
              <ChipCor key={c.id} nome={c.nome} hex={c.valor} selecionado={c.id === corId} onClick={() => setCorId(c.id)} />
            ))}
          </ChipGroup>
        </div>
        <div className="flex flex-col gap-2">
          <Overline>Tamanho</Overline>
          <ChipGroup rotulo="Tamanho">
            {peca.tamanhos.map((t) => (
              <ChipTamanho key={t} valor={t} selecionado={t === tamanho} onClick={() => setTamanho(t)} />
            ))}
          </ChipGroup>
        </div>
        <div className="flex flex-col gap-2">
          <Overline>Quantidade</Overline>
          <QuantityStepper value={qtd} onChange={setQtd} />
        </div>
        <Button variante="secundario" icone={<Plus weight="light" className="h-icone w-icone" />} disabled={!cor || !tamanho} onClick={adicionar}>
          Adicionar peça
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <SearchField value={busca} onChange={setBusca} placeholder="Código ou nome da peça" rotuloAcessivel="Buscar peça Miz por código ou nome" />
      {filtradas.length === 0 ? (
        <p className="text-body-sm text-text-secondary">Nenhuma peça ativa com "{busca}".</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Peças Miz">
          {filtradas.slice(0, 40).map((p) => (
            <li key={p.id}>
              <CardPeca nome={p.nome} codigo={p.codigo_referencia} cores={p.cores.map((c) => ({ id: c.id, hex: c.valor }))} onClick={() => escolher(p)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Outra marca */

function BlocoOutraMarca({ onAdicionar }: { onAdicionar: (i: Omit<ItemForm, 'chave'>) => void }) {
  const [cor, setCor] = useState('')
  const [tamanho, setTamanho] = useState<string | null>(null)
  const [qtd, setQtd] = useState(1)
  const { data: usadas } = useQuery({ queryKey: ['vendas', 'cores-usadas'], queryFn: coresUsadas, staleTime: 5 * 60_000 })

  const sugestoes = useMemo(() => {
    const t = semAcento(cor)
    return (usadas ?? []).filter((c) => (t ? semAcento(c).includes(t) && semAcento(c) !== t : true)).slice(0, 8)
  }, [usadas, cor])

  const pode = cor.trim().length > 0 && !!tamanho
  const adicionar = () => {
    if (!pode || !tamanho) return
    onAdicionar({ tipo: 'outra', cor: cor.trim().replace(/\s+/g, ' '), cor_hex: null, tamanho, quantidade: qtd })
    setCor('')
    setTamanho(null)
    setQtd(1)
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg bg-background-muted p-4">
      <Overline>Outras peças</Overline>
      <div className="flex flex-col gap-2">
        <TextField rotulo="Cor" placeholder="azul bebê, estampado…" autoComplete="off" value={cor} onChange={(e) => setCor(e.target.value)} />
        {sugestoes.length > 0 && (
          <ChipGroup rotulo="Cores já usadas na loja">
            {sugestoes.map((s) => (
              <ChipFiltro key={s} rotulo={s} onClick={() => setCor(s)} />
            ))}
          </ChipGroup>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Overline>Tamanho</Overline>
        <ChipGroup rotulo="Tamanho">
          {TAMANHOS_OUTRA.map((t) => (
            <ChipTamanho key={t} valor={t} selecionado={t === tamanho} onClick={() => setTamanho(t)} />
          ))}
        </ChipGroup>
      </div>
      <div className="flex flex-col gap-2">
        <Overline>Quantidade</Overline>
        <QuantityStepper value={qtd} onChange={setQtd} />
      </div>
      <Button variante="secundario" icone={<Plus weight="light" className="h-icone w-icone" />} disabled={!pode} onClick={adicionar}>
        Adicionar peça
      </Button>
    </div>
  )
}
