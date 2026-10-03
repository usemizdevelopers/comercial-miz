import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

export interface BottomSheetProps {
  aberta: boolean
  onFechar: () => void
  titulo?: ReactNode
  children: ReactNode
  rodape?: ReactNode
  /** No computador: 'central' (janela de até 560) ou 'lateral' (folha à direita, para formulários longos) */
  computador?: 'central' | 'lateral'
}

/**
 * Folha inferior (seção 6): sobe do rodapé no celular, surface, raio 16 só em cima,
 * alça de 32×4, sombra float. No computador vira janela central de até 560 (ou folha lateral).
 */
export function BottomSheet({ aberta, onFechar, titulo, children, rodape, computador = 'central' }: BottomSheetProps) {
  const idTitulo = useId()
  const painel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberta) return
    const anterior = document.activeElement as HTMLElement | null
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', teclas)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    painel.current?.focus()
    return () => {
      document.removeEventListener('keydown', teclas)
      document.body.style.overflow = overflow
      anterior?.focus?.()
    }
  }, [aberta, onFechar])

  if (!aberta) return null

  const lateral = computador === 'lateral'

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center lg:items-center">
      <div className="absolute inset-0 animate-aparecer bg-scrim" onClick={onFechar} aria-hidden="true" />
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titulo ? idTitulo : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-folha w-full animate-subir flex-col rounded-t-lg bg-surface shadow-float outline-none area-segura-baixo',
          'lg:max-w-folha lg:animate-aparecer lg:rounded-lg',
          lateral && 'lg:absolute lg:inset-y-0 lg:right-0 lg:max-h-none lg:max-w-form lg:rounded-none lg:rounded-l-lg',
        )}
      >
        <div className="flex justify-center pt-3 lg:hidden" aria-hidden="true">
          <span className="h-alca-h w-alca-w rounded-full bg-border" />
        </div>
        {titulo && (
          <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3 lg:px-6 lg:pt-6">
            <h2 id={idTitulo} className="text-h2">
              {titulo}
            </h2>
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar"
              className="foco alvo-48 flex items-center justify-center rounded-sm text-text-secondary hover:text-text-primary"
            >
              <X weight="light" className="h-icone-nav w-icone-nav" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-2 lg:px-6">{children}</div>
        {rodape && <div className="border-t border-border-subtle px-5 py-4 lg:px-6">{rodape}</div>}
      </div>
    </div>,
    document.body,
  )
}

/**
 * Confirmação (seção 9): pergunta em h3, consequência em body-sm e dois botões.
 * Só para ações que não se desfazem.
 */
export function ConfirmSheet({
  aberta,
  onFechar,
  onConfirmar,
  pergunta,
  consequencia,
  textoConfirmar,
  textoCancelar = 'Cancelar',
  destrutivo,
  carregando,
}: {
  aberta: boolean
  onFechar: () => void
  onConfirmar: () => void
  pergunta: string
  consequencia?: ReactNode
  textoConfirmar: string
  textoCancelar?: string
  destrutivo?: boolean
  carregando?: boolean
}) {
  return (
    <BottomSheet aberta={aberta} onFechar={onFechar}>
      <div className="flex flex-col gap-2 pt-2 lg:pt-4">
        <h2 className="text-h3">{pergunta}</h2>
        {consequencia && <p className="text-body-sm text-text-secondary">{consequencia}</p>}
      </div>
      <div className="mt-6 flex gap-3">
        <Button variante="secundario" className="flex-1" onClick={onFechar} disabled={carregando}>
          {textoCancelar}
        </Button>
        <Button variante={destrutivo ? 'destrutivo' : 'primario'} className="flex-1" onClick={onConfirmar} carregando={carregando}>
          {textoConfirmar}
        </Button>
      </div>
    </BottomSheet>
  )
}
