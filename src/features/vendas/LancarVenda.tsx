import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Card, SkeletonCard, StepIndicator, TopBar, lerDataPartes } from '@/components/ui'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { buscarCliente } from '@/features/clientes/api'
import { useCaminhos } from '@/hooks/useCaminhos'
import { useEquipe } from '@/hooks/useDadosLoja'
import { mensagemDeErro } from '@/lib/erros'
import { novoId } from '@/lib/id'
import { instanteDaVenda } from '@/lib/vendas'
import { ehErroDeRede, salvarVenda, type PacoteVenda } from './api'
import { guardarNaFila } from './fila'
import {
  ESTADO_INICIAL,
  apagarRascunho,
  guardarRascunho,
  lerRascunho,
  nomeDoRascunho,
  type ClienteEscolhida,
  type EstadoVenda,
} from './rascunho'
import { CartaoClienteVenda } from './CartaoClienteVenda'
import { PassoCliente } from './PassoCliente'
import { PassoPecas } from './PassoPecas'
import { PassoValor } from './PassoValor'
import { SucessoVenda, type DadosSucesso } from './SucessoVenda'

const PASSOS = ['Cliente', 'Peças', 'Valor']

/**
 * /venda/nova e /venda/nova?cliente=:id — Lançar venda (especificação, seção 7).
 * Três passos numa tela; "Voltar" nunca apaga o preenchido; rascunho no navegador;
 * sem conexão, a venda vai para a fila e sobe sozinha depois (id gerado aqui, sem duplicar).
 */
export default function LancarVenda() {
  const { usuaria, modoVendedora } = useSessao()
  const { data: equipe } = useEquipe()
  // ADM fora do modo vendedora escolhe em nome de quem a venda entra (passo 3)
  const escolheVendedora = usuaria?.papel === 'adm' && !modoVendedora
  const outrasVendedoras = escolheVendedora ? (equipe ?? []).filter((u) => u.situacao === 'ativa' && u.id !== usuaria?.id) : undefined
  const uid = usuaria?.id ?? ''
  const navegar = useNavigate()
  const caminhos = useCaminhos()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const clienteParam = params.get('cliente')

  const [estado, setEstado] = useState<EstadoVenda>(ESTADO_INICIAL)
  const [rascunho, setRascunho] = useState<EstadoVenda | null>(() => (clienteParam ? null : lerRascunho(uid)))
  const [carregandoCliente, setCarregandoCliente] = useState(!!clienteParam)
  const [erroCliente, setErroCliente] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<DadosSucesso | null>(null)
  const topo = useRef<HTMLDivElement>(null)

  const mudar = useCallback((parcial: Partial<EstadoVenda>) => {
    setErro(null)
    setEstado((e) => ({ ...e, ...parcial }))
  }, [])

  // Nova venda pela ficha: já entra com a cliente e pula o passo 1
  useEffect(() => {
    if (!clienteParam) return
    let ativo = true
    setCarregandoCliente(true)
    buscarCliente(clienteParam)
      .then((c) => {
        if (!ativo) return
        if (!c) {
          setErroCliente('Cliente não encontrada.')
          return
        }
        setEstado({
          ...ESTADO_INICIAL,
          passo: 2,
          modo: 'existente',
          cliente: {
            id: c.id,
            nome: c.nome,
            whatsapp: c.whatsapp,
            numCompras: c.num_compras ?? 0,
            tamanhoPreferido: c.tamanho_preferido,
            coresPreferidas: c.cores_preferidas ?? [],
            vendedoraId: c.vendedora_id,
            vendedoraNome: c.vendedora_nome,
            nova: false,
          },
        })
      })
      .catch((e: unknown) => ativo && setErroCliente(mensagemDeErro(e)))
      .finally(() => ativo && setCarregandoCliente(false))
    return () => {
      ativo = false
    }
  }, [clienteParam])

  // Rascunho: guarda a cada mudança (menos enquanto pergunta se continua o anterior)
  useEffect(() => {
    if (!uid || rascunho || sucesso) return
    guardarRascunho(uid, estado)
  }, [uid, estado, rascunho, sucesso])

  // Cada passo começa do topo
  useEffect(() => {
    window.scrollTo({ top: 0 })
    topo.current?.focus({ preventScroll: true })
  }, [estado.passo, sucesso])

  const escolherCliente = (c: ClienteEscolhida) => mudar({ cliente: c, passo: 2 })

  const podeSalvar = !!estado.cliente && estado.itens.length > 0 && !!estado.valor && estado.valor > 0 && !!estado.pagamento

  const salvar = async () => {
    const c = estado.cliente
    if (!podeSalvar || !c || !estado.valor || !estado.pagamento || !usuaria) return
    const aniv = c.aniversario ? lerDataPartes(c.aniversario) : null
    const pacote: PacoteVenda = {
      venda_id: novoId(),
      cliente_id: c.id,
      valor_total: estado.valor,
      forma_pagamento: estado.pagamento,
      data_venda: instanteDaVenda(estado.diasAtras),
      itens: estado.itens.map((i) =>
        i.tipo === 'miz'
          ? { tipo: 'miz', peca_id: i.peca_id, peca_cor_id: i.peca_cor_id, cor: i.cor, tamanho: i.tamanho, quantidade: i.quantidade }
          : { tipo: 'outra', cor: i.cor, tamanho: i.tamanho, quantidade: i.quantidade },
      ),
      cliente_nova: c.nova
        ? { nome: c.nome, whatsapp: c.whatsapp ?? '', aniv_dia: aniv?.dia ?? null, aniv_mes: aniv?.mes ?? null, aniv_ano: aniv?.ano ?? null }
        : null,
      vendedora_id: escolheVendedora && estado.vendedoraId ? estado.vendedoraId : null,
    }

    const concluir = (clienteId: string, naFila: boolean) => {
      apagarRascunho(uid)
      setSucesso({ valor: pacote.valor_total, clienteId, clienteNome: c.nome, whatsapp: c.whatsapp, naFila })
      void queryClient.invalidateQueries({ queryKey: ['metas'] })
      void queryClient.invalidateQueries({ queryKey: ['hoje'] })
      void queryClient.invalidateQueries({ queryKey: ['clientes'] })
      void queryClient.invalidateQueries({ queryKey: ['cliente', clienteId] })
    }

    setSalvando(true)
    setErro(null)
    try {
      if (!navigator.onLine) throw new TypeError('Failed to fetch')
      const r = await salvarVenda(pacote)
      concluir(r.cliente_id, false)
    } catch (e) {
      if (ehErroDeRede(e)) {
        guardarNaFila({ pacote, usuariaId: usuaria.id, clienteNome: c.nome, criadaEm: new Date().toISOString() })
        concluir(c.id, true)
      } else {
        setErro(mensagemDeErro(e))
      }
    } finally {
      setSalvando(false)
    }
  }

  const novaVenda = () => {
    setSucesso(null)
    setErro(null)
    setEstado(ESTADO_INICIAL)
    if (clienteParam) setParams({}, { replace: true })
  }

  const voltar = () => {
    if (estado.passo > 1) mudar({ passo: (estado.passo - 1) as 1 | 2 })
    else navegar(-1)
  }

  if (sucesso) {
    return (
      <div ref={topo} tabIndex={-1} className="outline-none">
        <SucessoVenda dados={sucesso} onNovaVenda={novaVenda} onIrParaHoje={() => navegar(caminhos.inicio)} rotuloInicio={caminhos.adm ? 'Ir para a Visão geral' : 'Ir para Hoje'} />
      </div>
    )
  }

  return (
    <div ref={topo} tabIndex={-1} className="outline-none">
      <TopBar titulo="Nova venda" onVoltar={voltar} />
      <div className="mx-auto flex w-full max-w-form flex-col gap-6 px-gutter pb-6 pt-2">
        <StepIndicator atual={estado.passo} passos={PASSOS} />

        {rascunho && (
          <Card className="flex flex-col gap-3 bg-background-muted">
            <p className="text-body">Continuar a venda da {nomeDoRascunho(rascunho)}?</p>
            <div className="flex flex-wrap gap-3">
              <Button
                tamanho="pequeno"
                onClick={() => {
                  setEstado(rascunho)
                  setRascunho(null)
                }}
              >
                Continuar
              </Button>
              <Button
                tamanho="pequeno"
                variante="secundario"
                onClick={() => {
                  apagarRascunho(uid)
                  setRascunho(null)
                }}
              >
                Começar outra
              </Button>
            </div>
          </Card>
        )}

        {carregandoCliente ? (
          <SkeletonCard linhas={2} />
        ) : erroCliente ? (
          <p role="alert" className="text-body-sm text-danger">
            {erroCliente}
          </p>
        ) : (
          <>
            {estado.passo > 1 && estado.cliente && (
              <CartaoClienteVenda cliente={estado.cliente} minhaId={(escolheVendedora && estado.vendedoraId) || uid} onTrocar={() => mudar({ passo: 1, modo: estado.modo ?? 'existente' })} />
            )}
            {estado.passo === 1 && <PassoCliente estado={estado} mudar={mudar} onEscolher={escolherCliente} />}
            {estado.passo === 2 && <PassoPecas estado={estado} mudar={mudar} />}
            {estado.passo === 3 && <PassoValor estado={estado} mudar={mudar} vendedoras={outrasVendedoras} />}
          </>
        )}

        {estado.passo > 1 && <div className="espaco-barra-acao" aria-hidden="true" />}
      </div>

      {estado.passo > 1 && !carregandoCliente && (
        <div className="barra-acao border-t border-border-subtle bg-surface px-gutter py-3">
          <div className="mx-auto flex w-full max-w-form flex-col gap-2">
            {erro && (
              <p role="alert" className="text-body-sm text-danger">
                {erro}
              </p>
            )}
            {estado.passo === 2 ? (
              <Button tamanho="grande" larguraTotal disabled={estado.itens.length === 0} onClick={() => mudar({ passo: 3 })}>
                Continuar
              </Button>
            ) : (
              <Button tamanho="grande" larguraTotal disabled={!podeSalvar} carregando={salvando} onClick={() => void salvar()}>
                Salvar venda
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
