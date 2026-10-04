import { useEffect, useState } from 'react'
import { CloudArrowUp } from '@phosphor-icons/react'
import { Button, ConfirmSheet, useToast } from '@/components/ui'
import { useConexao } from '@/hooks/useConexao'
import { formatarMoeda } from '@/lib/formatadores'
import { useFilaVendas } from './useFilaVendas'
import type { VendaNaFila } from './fila'

/**
 * Faixa discreta "1 venda aguardando envio". Tenta enviar ao abrir, quando a conexão volta
 * e a cada 30 s. Venda recusada pelo banco aparece com o motivo e pode ser descartada.
 */
export function AvisoFilaVendas() {
  const { pendentes, enviar, descartar } = useFilaVendas()
  const online = useConexao()
  const toast = useToast()
  const [enviando, setEnviando] = useState(false)
  const [descartando, setDescartando] = useState<VendaNaFila | null>(null)
  const aguardando = pendentes.filter((v) => !v.erro)
  const recusadas = pendentes.filter((v) => v.erro)

  useEffect(() => {
    if (!online || aguardando.length === 0) return
    let ativo = true
    const tentar = () =>
      void enviar().then((n) => {
        if (ativo && n > 0) toast.mostrar(n === 1 ? 'Venda enviada' : `${n} vendas enviadas`)
      })
    tentar()
    const t = window.setInterval(tentar, 30_000)
    return () => {
      ativo = false
      window.clearInterval(t)
    }
    // tenta de novo quando muda a conexão ou o tamanho da fila
  }, [online, aguardando.length, enviar, toast])

  if (pendentes.length === 0) return null

  const enviarAgora = async () => {
    setEnviando(true)
    try {
      const n = await enviar()
      toast.mostrar(n > 0 ? (n === 1 ? 'Venda enviada' : `${n} vendas enviadas`) : 'Ainda sem conexão. Tentamos de novo sozinhas.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 bg-background-muted px-gutter py-2 text-body-sm" role="status">
      {aguardando.length > 0 && (
        <div className="flex min-h-faixa items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-text-secondary">
            <CloudArrowUp weight="light" className="h-icone w-icone shrink-0" aria-hidden="true" />
            {aguardando.length === 1 ? '1 venda aguardando envio' : `${aguardando.length} vendas aguardando envio`}
          </span>
          {online && (
            <Button variante="texto" carregando={enviando} onClick={() => void enviarAgora()}>
              Enviar agora
            </Button>
          )}
        </div>
      )}
      {recusadas.map((v) => (
        <div key={v.pacote.venda_id} className="flex min-h-faixa items-center justify-between gap-3">
          <span className="min-w-0 text-danger">
            Venda da {v.clienteNome} ({formatarMoeda(v.pacote.valor_total)}) não foi aceita: {v.erro}
          </span>
          <Button variante="texto" onClick={() => setDescartando(v)}>
            Descartar
          </Button>
        </div>
      ))}
      <ConfirmSheet
        aberta={!!descartando}
        onFechar={() => setDescartando(null)}
        onConfirmar={() => {
          if (descartando) descartar(descartando.pacote.venda_id)
          setDescartando(null)
        }}
        pergunta="Descartar esta venda?"
        consequencia="Ela não foi gravada. Se a venda aconteceu, lance de novo pelo + Venda."
        textoConfirmar="Descartar"
        destrutivo
      />
    </div>
  )
}
