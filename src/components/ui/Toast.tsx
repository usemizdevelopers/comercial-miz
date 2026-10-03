import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { ToastContexto, type AcaoAviso } from './toastContexto'

interface Aviso {
  id: number
  texto: string
  acao?: AcaoAviso
}

const DURACAO_MS = 3000

/**
 * Toast (seção 9): 16 acima do rodapé, largura total menos as margens, surface-inverse,
 * texto branco body-sm, raio 10, some em 3 s, ação opcional em texto à direita.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const mostrar = useCallback((texto: string, acao?: Aviso['acao']) => {
    window.clearTimeout(timer.current)
    setAviso({ id: Date.now(), texto, acao })
    timer.current = window.setTimeout(() => setAviso(null), DURACAO_MS)
  }, [])

  const valor = useMemo(() => ({ mostrar }), [mostrar])

  return (
    <ToastContexto.Provider value={valor}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-gutter acima-do-rodape"
        >
          {aviso && (
            <div
              key={aviso.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-folha animate-aparecer items-center justify-between gap-4 rounded-md bg-surface-inverse px-4 py-3 text-body-sm text-on-primary"
            >
              <span>{aviso.texto}</span>
              {aviso.acao && (
                <button
                  type="button"
                  className="foco sublinhado shrink-0 rounded-sm text-label text-on-primary"
                  onClick={() => {
                    aviso.acao?.onClick()
                    setAviso(null)
                  }}
                >
                  {aviso.acao.rotulo}
                </button>
              )}
            </div>
          )}
        </div>,
        document.body,
      )}
    </ToastContexto.Provider>
  )
}
