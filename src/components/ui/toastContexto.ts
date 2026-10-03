import { createContext, useContext } from 'react'

export interface AcaoAviso {
  rotulo: string
  onClick: () => void
}

export interface ToastApi {
  mostrar: (texto: string, acao?: AcaoAviso) => void
}

export const ToastContexto = createContext<ToastApi | null>(null)

/** Mostra um aviso rápido: useToast().mostrar('Venda salva') */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContexto)
  if (!ctx) throw new Error('useToast precisa estar dentro de ToastProvider')
  return ctx
}
