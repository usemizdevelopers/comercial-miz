import { useSyncExternalStore } from 'react'

function assinar(aviso: () => void) {
  window.addEventListener('online', aviso)
  window.addEventListener('offline', aviso)
  return () => {
    window.removeEventListener('online', aviso)
    window.removeEventListener('offline', aviso)
  }
}

/** true quando o navegador diz que tem internet. */
export function useConexao(): boolean {
  return useSyncExternalStore(assinar, () => navigator.onLine, () => true)
}
