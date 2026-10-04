import { useEffect, useState } from 'react'

/** Devolve o valor só depois de `ms` sem mudar (busca enquanto digita). */
export function useAtraso<T>(valor: T, ms = 250): T {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const t = window.setTimeout(() => setAtrasado(valor), ms)
    return () => window.clearTimeout(t)
  }, [valor, ms])
  return atrasado
}
