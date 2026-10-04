import { useRef, type MouseEvent, type PointerEvent } from 'react'

/**
 * Pressionar e segurar (celular): chama `acao` depois de `ms` sem mexer o dedo.
 * O toque curto continua sendo um clique normal; depois do pressionar longo, o clique é ignorado.
 */
export function usePressionarLongo(acao: () => void, ms = 500) {
  const timer = useRef<number | undefined>(undefined)
  const inicio = useRef<{ x: number; y: number } | null>(null)
  const disparou = useRef(false)

  const cancelar = () => {
    window.clearTimeout(timer.current)
    inicio.current = null
  }

  return {
    onPointerDown: (e: PointerEvent) => {
      disparou.current = false
      inicio.current = { x: e.clientX, y: e.clientY }
      timer.current = window.setTimeout(() => {
        disparou.current = true
        acao()
      }, ms)
    },
    onPointerMove: (e: PointerEvent) => {
      if (inicio.current && Math.hypot(e.clientX - inicio.current.x, e.clientY - inicio.current.y) > 10) cancelar()
    },
    onPointerUp: cancelar,
    onPointerLeave: cancelar,
    onPointerCancel: cancelar,
    onContextMenu: (e: MouseEvent) => {
      // segurar no celular abre o menu do navegador; aqui o gesto é nosso
      if (disparou.current || inicio.current) e.preventDefault()
    },
    /** use no onClick do cartão: true = foi pressionar longo, não abrir */
    foiLongo: () => {
      const v = disparou.current
      disparou.current = false
      return v
    },
  }
}
