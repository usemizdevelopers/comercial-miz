import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MagnifyingGlass, UserPlus } from '@phosphor-icons/react'
import {
  Button,
  Card,
  ChoiceCard,
  DateParts,
  EmptyState,
  PhoneField,
  SearchField,
  SkeletonCard,
  TextField,
  lerDataPartes,
  type DataPartes,
} from '@/components/ui'
import { buscarCliente, buscarClientes, clientePorWhatsapp, type ResultadoBusca } from '@/features/clientes/api'
import { useAtraso } from '@/hooks/useAtraso'
import { haDias } from '@/lib/formatadores'
import { mensagemDeErro } from '@/lib/erros'
import { novoId } from '@/lib/id'
import { normalizarWhatsapp, somenteDigitos, whatsappValido } from '@/lib/whatsapp'
import type { ClienteEscolhida, EstadoVenda, ModoCliente } from './rascunho'

type Mudar = (parcial: Partial<EstadoVenda>) => void

/** Passo 1 · "Quem está comprando?" — Cliente nova, Já é cliente ou Não sei. */
export function PassoCliente({
  estado,
  mudar,
  onEscolher,
}: {
  estado: EstadoVenda
  mudar: Mudar
  onEscolher: (c: ClienteEscolhida) => void
}) {
  const escolherModo = (modo: ModoCliente) => mudar({ modo })

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-h2">Quem está comprando?</h2>
      <div className="flex flex-col gap-3">
        <ChoiceCard selecionado={estado.modo === 'nova'} onClick={() => escolherModo('nova')}>
          Cliente nova
        </ChoiceCard>
        <ChoiceCard selecionado={estado.modo === 'existente'} onClick={() => escolherModo('existente')}>
          Já é cliente
        </ChoiceCard>
        <ChoiceCard selecionado={estado.modo === 'nao_sei'} onClick={() => escolherModo('nao_sei')}>
          Não sei
        </ChoiceCard>
      </div>

      {estado.modo === 'nova' && <CadastroRapido estado={estado} mudar={mudar} onEscolher={onEscolher} />}
      {(estado.modo === 'existente' || estado.modo === 'nao_sei') && (
        <BuscaCliente
          // remonta ao trocar de modo para o teclado abrir de novo
          key={estado.modo}
          termo={estado.termo}
          onTermo={(termo) => mudar({ termo })}
          onEscolher={onEscolher}
          onCadastrar={(termo) => {
            const digitos = somenteDigitos(termo)
            const soNumeros = digitos.length >= 2 && digitos.length === termo.replace(/[\s()+-]/g, '').length
            mudar({
              modo: 'nova',
              novaNome: soNumeros ? estado.novaNome : termo.trim(),
              novaWhatsapp: soNumeros ? digitos : estado.novaWhatsapp,
            })
          }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Busca na base inteira */

function BuscaCliente({
  termo,
  onTermo,
  onEscolher,
  onCadastrar,
}: {
  termo: string
  onTermo: (t: string) => void
  onEscolher: (c: ClienteEscolhida) => void
  onCadastrar: (termo: string) => void
}) {
  const termoAtrasado = useAtraso(termo.trim(), 250)
  const [abrindo, setAbrindo] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const { data, isFetching, error } = useQuery({
    queryKey: ['clientes', 'busca', termoAtrasado],
    queryFn: () => buscarClientes(termoAtrasado),
    enabled: termoAtrasado.length >= 2,
    staleTime: 30_000,
  })

  const escolher = async (r: ResultadoBusca) => {
    setAbrindo(r.id)
    setErro(null)
    try {
      const c = await buscarCliente(r.id)
      onEscolher({
        id: r.id,
        nome: r.nome,
        whatsapp: c?.whatsapp ?? null,
        numCompras: c?.num_compras ?? r.num_compras,
        tamanhoPreferido: c?.tamanho_preferido ?? null,
        coresPreferidas: c?.cores_preferidas ?? [],
        vendedoraId: r.vendedora_id,
        vendedoraNome: r.vendedora_nome,
        nova: false,
      })
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setAbrindo(null)
    }
  }

  const curto = termo.trim().length < 2
  const semResultado = !curto && termoAtrasado === termo.trim() && !isFetching && !error && (data ?? []).length === 0

  return (
    <div className="flex flex-col gap-3">
      <SearchField value={termo} onChange={onTermo} autoFocus placeholder="Nome ou WhatsApp" rotuloAcessivel="Buscar cliente por nome ou WhatsApp" />
      {curto ? (
        <p className="text-caption text-text-tertiary">Digite pelo menos 2 letras ou números. A busca olha todas as clientes da loja.</p>
      ) : isFetching && !data ? (
        <SkeletonCard linhas={2} />
      ) : error ? (
        <p role="alert" className="text-body-sm text-danger">
          {mensagemDeErro(error)}
        </p>
      ) : semResultado ? (
        <Card>
          <EmptyState
            icone={<MagnifyingGlass weight="light" />}
            texto={`Não encontramos "${termo.trim()}".`}
            acao={
              <div className="flex flex-wrap justify-center gap-3">
                <Button icone={<UserPlus weight="light" className="h-icone w-icone" />} onClick={() => onCadastrar(termo)}>
                  Cadastrar agora
                </Button>
                <Button variante="secundario" onClick={() => onTermo('')}>
                  Buscar de novo
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Clientes encontradas">
          {(data ?? []).map((r) => (
            <li key={r.id}>
              <Card tocavel className="flex items-center justify-between gap-3" onClick={() => void escolher(r)} role="button" tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') void escolher(r)
                }}
                aria-busy={abrindo === r.id || undefined}
              >
                <div className="min-w-0">
                  <p className="truncate text-h3">{r.nome}</p>
                  <p className="truncate text-body-sm text-text-secondary">
                    final {r.whatsapp_final} · {r.ultima_compra_em ? `última compra ${haDias(r.ultima_compra_em)}` : 'ainda sem compra'}
                  </p>
                  {r.vendedora_nome && <p className="truncate text-caption text-text-tertiary">{r.vendedora_nome}</p>}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {erro && (
        <p role="alert" className="text-body-sm text-danger">
          {erro}
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Cadastro rápido */

function CadastroRapido({ estado, mudar, onEscolher }: { estado: EstadoVenda; mudar: Mudar; onEscolher: (c: ClienteEscolhida) => void }) {
  const [tocado, setTocado] = useState({ nome: false, whatsapp: false })
  const [conferindo, setConferindo] = useState(false)
  const [duplicada, setDuplicada] = useState<{ id: string; nome: string; numero: string } | null>(null)
  const [usando, setUsando] = useState(false)

  const nomeOk = estado.novaNome.trim().length >= 2
  const whatsOk = whatsappValido(estado.novaWhatsapp)
  const data = lerDataPartes(estado.novaAniversario)
  const numero = normalizarWhatsapp(estado.novaWhatsapp)
  const duplicadaAtual = duplicada && duplicada.numero === numero ? duplicada : null

  const conferirNumero = async () => {
    setTocado((t) => ({ ...t, whatsapp: true }))
    if (!whatsOk || !numero) return
    setConferindo(true)
    try {
      const achada = await clientePorWhatsapp(numero)
      setDuplicada(achada ? { ...achada, numero } : null)
    } catch {
      // sem conexão: o banco confere de novo ao salvar (e usa a cliente que já existe)
      setDuplicada(null)
    } finally {
      setConferindo(false)
    }
  }

  const usarExistente = async () => {
    if (!duplicadaAtual) return
    setUsando(true)
    try {
      const c = await buscarCliente(duplicadaAtual.id)
      onEscolher({
        id: duplicadaAtual.id,
        nome: duplicadaAtual.nome,
        whatsapp: c?.whatsapp ?? numero,
        numCompras: c?.num_compras ?? 0,
        tamanhoPreferido: c?.tamanho_preferido ?? null,
        coresPreferidas: c?.cores_preferidas ?? [],
        vendedoraId: c?.vendedora_id ?? null,
        vendedoraNome: c?.vendedora_nome ?? null,
        nova: false,
      })
    } finally {
      setUsando(false)
    }
  }

  const pode = nomeOk && whatsOk && !data.erro && !duplicadaAtual && !conferindo

  const continuar = () => {
    if (!pode || !numero) return
    // mantém o mesmo id se ela voltar e continuar de novo com a mesma cliente nova
    const id = estado.cliente?.nova ? estado.cliente.id : novoId()
    onEscolher({
      id,
      nome: estado.novaNome.trim(),
      whatsapp: numero,
      numCompras: 0,
      tamanhoPreferido: null,
      coresPreferidas: [],
      vendedoraId: null,
      vendedoraNome: null,
      nova: true,
      aniversario: estado.novaAniversario,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <TextField
        rotulo="Nome"
        obrigatorio
        autoFocus
        autoComplete="off"
        autoCapitalize="words"
        value={estado.novaNome}
        onChange={(e) => mudar({ novaNome: e.target.value })}
        onBlur={() => setTocado((t) => ({ ...t, nome: true }))}
        erro={tocado.nome && !nomeOk ? 'Digite o nome da cliente' : undefined}
      />
      <PhoneField
        rotulo="WhatsApp"
        obrigatorio
        value={estado.novaWhatsapp}
        onChange={(v) => mudar({ novaWhatsapp: v })}
        onBlur={() => void conferirNumero()}
        erro={tocado.whatsapp && !whatsOk ? 'Digite o WhatsApp com DDD' : undefined}
      />
      {duplicadaAtual && (
        <Card className="flex flex-col gap-3 bg-background-muted">
          <p className="text-body">Esse número já é da {duplicadaAtual.nome}. Usar ela?</p>
          <div className="flex flex-wrap gap-3">
            <Button tamanho="pequeno" carregando={usando} onClick={() => void usarExistente()}>
              Usar {duplicadaAtual.nome.split(' ')[0]}
            </Button>
            <Button
              tamanho="pequeno"
              variante="secundario"
              onClick={() => {
                setDuplicada(null)
                mudar({ novaWhatsapp: '' })
              }}
            >
              Corrigir número
            </Button>
          </div>
        </Card>
      )}
      <DateParts
        value={estado.novaAniversario}
        onChange={(v: DataPartes) => mudar({ novaAniversario: v })}
        erro={data.erro}
      />
      <Button larguraTotal tamanho="grande" disabled={!pode} carregando={conferindo} onClick={continuar}>
        Continuar
      </Button>
    </div>
  )
}
