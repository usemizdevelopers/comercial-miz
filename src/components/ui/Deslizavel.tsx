import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Deslizar para o lado (seção 6, pastas de Hoje): arrastar o cartão para a esquerda ou a direita
 * além de 1/3 da largura dispara `onDeslizar` (ex.: "Pular hoje"). Por baixo aparece o rótulo da ação.
 * Sempre ofereça também um botão com a mesma ação (acessibilidade e computador).
 */
export function Deslizavel({ children, rotulo, onDeslizar, className }: { children: ReactNode; rotulo: string; onDeslizar: () => void; className?: string }) {
  const caixa = useRef<HTMLDivElement>(null)
  const inicio = useRef<{ x: number; y: number; id: number } | null>(null)
  const [dx, setDx] = useState(0)
  const [arrastando, setArrastando] = useState(false)

  const soltar = () => {
    const largura = caixa.current?.offsetWidth ?? 1
    if (Math.abs(dx) > largura / 3) {
      setDx(dx > 0 ? largura : -largura)
      window.setTimeout(onDeslizar, 150)
    } else {
      setDx(0)
    }
    inicio.current = null
    setArrastando(false)
  }

  return (
    <div ref={caixa} className={cn('relative overflow-hidden rounded-lg', className)}>
      <div aria-hidden="true" className="absolute inset-0 flex items-center justify-between rounded-lg bg-background-muted px-5 text-label text-text-secondary">
        <span>{rotulo}</span>
        <span>{rotulo}</span>
      </div>
      <div
        className={cn('relative touch-pan-y', !arrastando && 'transition-transform duration-base ease-base')}
        // deslocamento acompanha o dedo (valor calculado a cada movimento)
        style={dx ? { transform: `translateX(${dx}px)` } : undefined}
        onPointerDown={(e: PointerEvent) => {
          if (e.pointerType === 'mouse') return
          inicio.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
        }}
        onPointerMove={(e: PointerEvent) => {
          const i = inicio.current
          if (!i || e.pointerId !== i.id) return
          const mx = e.clientX - i.x
          const my = e.clientY - i.y
          if (!arrastando) {
            if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) {
              inicio.current = null // rolagem vertical: não é deslizar
              return
            }
            if (Math.abs(mx) < 10) return
            setArrastando(true)
          }
          setDx(mx)
        }}
        onPointerUp={() => (arrastando ? soltar() : (inicio.current = null))}
        onPointerCancel={() => {
          inicio.current = null
          setArrastando(false)
          setDx(0)
        }}
        onClickCapture={(e) => {
          // depois de arrastar, o clique não abre o cartão
          if (dx !== 0) e.stopPropagation()
        }}
      >
        {children}
      </div>
    </div>
  )
}
