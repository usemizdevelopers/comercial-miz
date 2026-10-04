import { useSyncExternalStore } from 'react'

const CONSULTA = '(min-width: 1200px)'

function assinar(aviso: () => void) {
  const m = window.matchMedia(CONSULTA)
  m.addEventListener('change', aviso)
  return () => m.removeEventListener('change', aviso)
}

/** true no computador (≥ 1200 px, breakpoint lg do design system). */
export function useTelaGrande(): boolean {
  return useSyncExternalStore(assinar, () => window.matchMedia(CONSULTA).matches, () => false)
}
