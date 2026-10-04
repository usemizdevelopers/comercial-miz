import { useEffect, useRef } from 'react'

/** Chama `acao` quando a usuária volta para a aba do navegador (ex.: recarregar a tela Hoje). */
export function useAoVoltarParaAba(acao: () => void) {
  const ref = useRef(acao)
  ref.current = acao
  useEffect(() => {
    const aoMudar = () => {
      if (document.visibilityState === 'visible') ref.current()
    }
    document.addEventListener('visibilitychange', aoMudar)
    return () => document.removeEventListener('visibilitychange', aoMudar)
  }, [])
}
