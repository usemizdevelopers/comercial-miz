import type { MouseEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, useToast, type TamanhoBotao } from '@/components/ui'
import { registrarContato, type Pasta } from '@/features/clientes/api'
import { linkWhatsapp } from '@/lib/whatsapp'
import { mensagemDeErro } from '@/lib/erros'

/**
 * Botão WhatsApp de cliente: registra o contato (com a pasta, ou sem pasta fora da tela Hoje)
 * e abre a conversa no wa.me. O registro é disparado antes de abrir, mas sem esperar a resposta:
 * esperar faria o navegador do celular bloquear a nova aba.
 */
export function BotaoWhatsapp({
  clienteId,
  whatsapp,
  pasta = null,
  texto,
  rotulo = 'WhatsApp',
  tamanho = 'pequeno',
  larguraTotal,
  onAberto,
  className,
}: {
  clienteId: string
  whatsapp: string
  pasta?: Pasta | null
  /** mensagem pronta (só Aniversário e Pós-venda) */
  texto?: string
  rotulo?: string
  tamanho?: TamanhoBotao
  larguraTotal?: boolean
  onAberto?: () => void
  className?: string
}) {
  const queryClient = useQueryClient()
  const toast = useToast()

  const abrir = (e: MouseEvent) => {
    e.stopPropagation()
    registrarContato(clienteId, pasta)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ['cliente', clienteId] })
        void queryClient.invalidateQueries({ queryKey: ['clientes'] })
        void queryClient.invalidateQueries({ queryKey: ['hoje', 'tarefas'] })
      })
      .catch((erro: unknown) => toast.mostrar(`Contato não registrado: ${mensagemDeErro(erro)}`))
    window.open(linkWhatsapp(whatsapp, texto), '_blank', 'noopener,noreferrer')
    onAberto?.()
  }

  return (
    <Button variante="whatsapp" tamanho={tamanho} larguraTotal={larguraTotal} onClick={abrir} className={className}>
      {rotulo}
    </Button>
  )
}
