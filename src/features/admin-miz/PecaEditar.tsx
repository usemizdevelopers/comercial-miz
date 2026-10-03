import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Plus, Trash, WarningCircle } from '@phosphor-icons/react'
import {
  BolinhaCor,
  Button,
  Card,
  ChipGroup,
  ChipTamanho,
  ConfirmSheet,
  EmptyState,
  Overline,
  SegmentedControl,
  TextField,
  useToast,
} from '@/components/ui'
import { CabecalhoPagina } from '@/components/shared/CabecalhoPagina'
import { ListaCarregando } from '@/components/shared/EstadoCarregando'
import { mensagemDeErro } from '@/lib/erros'
import { cn } from '@/lib/cn'
import { apagarPeca, buscarPeca, ErroJaVendida, salvarPeca, TAMANHOS_PECA, type CorEditavel, type PecaCompleta } from './api'

const HEX = /^#[0-9a-f]{6}$/i

function vazia(): { nome: string; codigo: string; composicao: string; ativa: boolean; cores: CorEditavel[]; tamanhos: string[] } {
  return { nome: '', codigo: '', composicao: '', ativa: true, cores: [], tamanhos: [] }
}

/**
 * /miz/catalogo/:id (ou /nova) — peça com nome, código, base/composição, ativa,
 * cores (nome + hex, reordenar, desativar) e tamanhos. Sem fotos.
 * Peça ou cor já usada em venda não se apaga: só desativa.
 */
export default function PecaEditar() {
  const { id } = useParams()
  const nova = !id || id === 'nova'
  const navegar = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['miz', 'peca', id], queryFn: () => buscarPeca(id!), enabled: !nova })

  const [form, setForm] = useState(vazia)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmarApagar, setConfirmarApagar] = useState(false)
  const [apagando, setApagando] = useState(false)

  useEffect(() => {
    if (data) setForm(deBanco(data))
  }, [data])

  if (!nova && isLoading) {
    return (
      <div className="mx-auto w-full max-w-form px-gutter pt-8">
        <ListaCarregando />
      </div>
    )
  }
  if (!nova && (error || !data)) {
    return (
      <div className="mx-auto w-full max-w-form px-gutter pt-8">
        <Card>
          <EmptyState texto={error ? mensagemDeErro(error) : 'Peça não encontrada.'} acao={<Button variante="secundario" onClick={() => navegar('/miz/catalogo')}>Voltar ao catálogo</Button>} />
        </Card>
      </div>
    )
  }

  const mudarCor = (i: number, parcial: Partial<CorEditavel>) =>
    setForm((f) => ({ ...f, cores: f.cores.map((c, j) => (j === i ? { ...c, ...parcial } : c)) }))
  const moverCor = (i: number, passo: -1 | 1) =>
    setForm((f) => {
      const cores = [...f.cores]
      const alvo = i + passo
      if (alvo < 0 || alvo >= cores.length) return f
      ;[cores[i], cores[alvo]] = [cores[alvo]!, cores[i]!]
      return { ...f, cores }
    })
  const alternarTamanho = (t: string) =>
    setForm((f) => ({ ...f, tamanhos: f.tamanhos.includes(t) ? f.tamanhos.filter((x) => x !== t) : [...f.tamanhos, t] }))

  const validar = () => {
    const e: Record<string, string> = {}
    if (form.nome.trim().length < 2) e.nome = 'Digite o nome da peça'
    if (form.codigo.trim().length < 2) e.codigo = 'Digite o código'
    form.cores.forEach((c, i) => {
      if (!c.nome.trim()) e[`cor-${i}`] = 'Digite o nome da cor'
      else if (!HEX.test(c.valor)) e[`cor-${i}`] = 'Escolha a cor'
    })
    const nomes = form.cores.map((c) => c.nome.trim().toLowerCase())
    nomes.forEach((n, i) => {
      if (n && nomes.indexOf(n) !== i) e[`cor-${i}`] = 'Essa cor já está na lista'
    })
    if (form.cores.length === 0) e.cores = 'Adicione pelo menos uma cor'
    if (form.tamanhos.length === 0) e.tamanhos = 'Escolha pelo menos um tamanho'
    setErros(e)
    return Object.keys(e).length === 0
  }

  const salvar = async () => {
    setErroGeral(null)
    if (!validar()) return
    setSalvando(true)
    try {
      const novoId = await salvarPeca(
        nova ? null : id!,
        { nome: form.nome.trim(), codigo_referencia: form.codigo.trim(), composicao: form.composicao.trim(), ativa: form.ativa, cores: form.cores, tamanhos: form.tamanhos },
        data?.cores ?? [],
        data?.tamanhos ?? [],
      )
      await queryClient.invalidateQueries({ queryKey: ['miz', 'pecas'] })
      await queryClient.invalidateQueries({ queryKey: ['miz', 'peca', novoId] })
      toast.mostrar(nova ? 'Peça criada' : 'Peça salva')
      if (nova) navegar(`/miz/catalogo/${novoId}`, { replace: true })
    } catch (e) {
      setErroGeral(e instanceof ErroJaVendida ? e.message : mensagemDeErro(e))
      await queryClient.invalidateQueries({ queryKey: ['miz', 'peca', id] })
    } finally {
      setSalvando(false)
    }
  }

  const apagar = async () => {
    setApagando(true)
    try {
      await apagarPeca(id!)
      await queryClient.invalidateQueries({ queryKey: ['miz', 'pecas'] })
      toast.mostrar('Peça apagada')
      navegar('/miz/catalogo', { replace: true })
    } catch (e) {
      setConfirmarApagar(false)
      setErroGeral(e instanceof ErroJaVendida ? e.message : mensagemDeErro(e))
    } finally {
      setApagando(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-form px-gutter">
      <CabecalhoPagina titulo={nova ? 'Nova peça' : form.nome || 'Peça'} subtitulo={nova ? undefined : form.codigo} onVoltar={() => navegar('/miz/catalogo')} />

      <div className="flex flex-col gap-6 pb-10">
        <Card className="flex flex-col gap-5">
          <Overline>Peça</Overline>
          <TextField rotulo="Nome" obrigatorio value={form.nome} erro={erros.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <TextField
            rotulo="Código"
            obrigatorio
            value={form.codigo}
            erro={erros.codigo}
            ajuda={erros.codigo ? undefined : 'Único no catálogo (ex.: BL0001)'}
            autoCapitalize="characters"
            onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
          />
          <TextField rotulo="Base / composição" value={form.composicao} placeholder="Ex.: 96% viscose, 4% elastano" onChange={(e) => setForm({ ...form, composicao: e.target.value })} />
          <div className="flex flex-col gap-2">
            <span className="text-label text-text-secondary">Situação</span>
            <SegmentedControl<'sim' | 'nao'>
              rotulo="Peça ativa"
              valor={form.ativa ? 'sim' : 'nao'}
              onMudar={(v) => setForm({ ...form, ativa: v === 'sim' })}
              opcoes={[
                { valor: 'sim', rotulo: 'Ativa' },
                { valor: 'nao', rotulo: 'Inativa' },
              ]}
            />
            <p className="text-caption text-text-tertiary">Peça inativa some do Lançar venda, mas continua no histórico das vendas.</p>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Overline>Cores</Overline>
            <Button
              variante="texto"
              icone={<Plus weight="light" className="h-icone-sm w-icone-sm" />}
              onClick={() => setForm((f) => ({ ...f, cores: [...f.cores, { nome: '', valor: '#000000', ativa: true }] }))}
            >
              Adicionar cor
            </Button>
          </div>
          {erros.cores && <p className="text-caption text-danger">{erros.cores}</p>}
          <ul className="flex flex-col">
            {form.cores.map((c, i) => (
              <li key={c.id ?? `nova-${i}`} className="flex flex-col gap-3 border-b border-border-subtle py-4 last:border-b-0">
                <div className="flex items-end gap-3">
                  <label className="foco relative flex h-campo w-campo shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-surface" title="Escolher cor">
                    <BolinhaCor hex={HEX.test(c.valor) ? c.valor : null} tamanho="grande" />
                    <input
                      type="color"
                      aria-label={`Cor de ${c.nome || 'nova cor'}`}
                      value={HEX.test(c.valor) ? c.valor : '#000000'}
                      onChange={(e) => mudarCor(i, { valor: e.target.value })}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                  <TextField
                    className="min-w-0 flex-1"
                    rotulo={i === 0 ? 'Nome da cor' : undefined}
                    aria-label="Nome da cor"
                    value={c.nome}
                    erro={erros[`cor-${i}`]}
                    placeholder="Ex.: Off White"
                    onChange={(e) => mudarCor(i, { nome: e.target.value })}
                  />
                  <TextField
                    className="w-campo-hex shrink-0"
                    rotulo={i === 0 ? 'Hex' : undefined}
                    aria-label="Código hex da cor"
                    value={c.valor}
                    onChange={(e) => mudarCor(i, { valor: e.target.value.trim() })}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SegmentedControl<'sim' | 'nao'>
                    rotulo={`Cor ${c.nome} ativa`}
                    valor={c.ativa ? 'sim' : 'nao'}
                    onMudar={(v) => mudarCor(i, { ativa: v === 'sim' })}
                    opcoes={[
                      { valor: 'sim', rotulo: 'Ativa' },
                      { valor: 'nao', rotulo: 'Inativa' },
                    ]}
                  />
                  <div className="ml-auto flex items-center gap-1">
                    <button type="button" aria-label="Subir cor" disabled={i === 0} onClick={() => moverCor(i, -1)} className={cn('foco alvo-48 flex items-center justify-center rounded-sm', i === 0 ? 'text-icon-muted' : 'text-text-secondary hover:text-text-primary')}>
                      <ArrowUp weight="light" className="h-icone w-icone" />
                    </button>
                    <button type="button" aria-label="Descer cor" disabled={i === form.cores.length - 1} onClick={() => moverCor(i, 1)} className={cn('foco alvo-48 flex items-center justify-center rounded-sm', i === form.cores.length - 1 ? 'text-icon-muted' : 'text-text-secondary hover:text-text-primary')}>
                      <ArrowDown weight="light" className="h-icone w-icone" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remover ${c.nome || 'cor'}`}
                      onClick={() => setForm((f) => ({ ...f, cores: f.cores.filter((_, j) => j !== i) }))}
                      className="foco alvo-48 flex items-center justify-center rounded-sm text-text-secondary hover:text-danger"
                    >
                      <Trash weight="light" className="h-icone w-icone" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-caption text-text-tertiary">A primeira cor é a que aparece primeiro no Lançar venda. Cor já vendida não pode ser removida: desative.</p>
        </Card>

        <Card className="flex flex-col gap-4">
          <Overline>Tamanhos</Overline>
          <ChipGroup rotulo="Tamanhos da peça">
            {TAMANHOS_PECA.map((t) => (
              <ChipTamanho key={t} valor={t} selecionado={form.tamanhos.includes(t)} onClick={() => alternarTamanho(t)} />
            ))}
          </ChipGroup>
          {erros.tamanhos && <p className="text-caption text-danger">{erros.tamanhos}</p>}
        </Card>

        {erroGeral && (
          <p role="alert" className="flex items-center gap-2 rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">
            <WarningCircle weight="light" className="h-icone w-icone shrink-0" />
            {erroGeral}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-between">
          {!nova ? (
            <Button variante="destrutivo" onClick={() => setConfirmarApagar(true)}>
              Apagar peça
            </Button>
          ) : (
            <span />
          )}
          <Button tamanho="grande" carregando={salvando} onClick={() => void salvar()}>
            {nova ? 'Criar peça' : 'Salvar peça'}
          </Button>
        </div>
      </div>

      <ConfirmSheet
        aberta={confirmarApagar}
        onFechar={() => setConfirmarApagar(false)}
        onConfirmar={() => void apagar()}
        pergunta={`Apagar ${form.nome}?`}
        consequencia="Só dá para apagar peça que nunca foi vendida. Se já foi, desative."
        textoConfirmar="Apagar"
        destrutivo
        carregando={apagando}
      />
    </div>
  )
}

function deBanco(p: PecaCompleta) {
  return {
    nome: p.nome,
    codigo: p.codigo_referencia,
    composicao: p.composicao ?? '',
    ativa: p.ativa,
    cores: p.cores.map((c) => ({ id: c.id, nome: c.nome, valor: c.valor, ativa: c.ativa })),
    tamanhos: p.tamanhos.map((t) => t.valor),
  }
}
