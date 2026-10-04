import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { assinarFila, enviarFila, tirarDaFila, vendasNaFila } from './fila'

/** Vendas da usuária logada que estão esperando conexão, e como enviá-las. */
export function useFilaVendas() {
  const { usuaria } = useSessao()
  const queryClient = useQueryClient()
  const todas = useSyncExternalStore(assinarFila, vendasNaFila, vendasNaFila)
  const minhas = useMemo(() => todas.filter((v) => v.usuariaId === usuaria?.id), [todas, usuaria?.id])

  const enviar = useCallback(async () => {
    if (!usuaria) return 0
    const n = await enviarFila(usuaria.id)
    if (n > 0) await queryClient.invalidateQueries()
    return n
  }, [usuaria, queryClient])

  return { pendentes: minhas, enviar, descartar: tirarDaFila }
}
