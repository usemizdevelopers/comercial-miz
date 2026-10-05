import { Check, Minus } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'

/** Caixa de seleção (seleção em lote): 20×20, raio 4, marcada em primary. Área de toque de 48. */
export function Checkbox({
  marcado,
  indeterminado,
  onMudar,
  rotulo,
  className,
}: {
  marcado: boolean
  /** parte da lista marcada (cabeçalho da tabela) */
  indeterminado?: boolean
  onMudar: (marcado: boolean) => void
  /** texto para leitores de tela */
  rotulo: string
  className?: string
}) {
  const cheio = marcado || indeterminado
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminado ? 'mixed' : marcado}
      aria-label={rotulo}
      onClick={(e) => {
        e.stopPropagation()
        onMudar(!marcado)
      }}
      className={cn('foco alvo-48 inline-flex shrink-0 items-center justify-center rounded-xs', className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex h-icone w-icone items-center justify-center rounded-xs border transition-[background-color,border-color] duration-fast ease-out',
          cheio ? 'border-primary bg-primary text-on-primary' : 'border-border-strong bg-surface',
        )}
      >
        {indeterminado ? <Minus weight="bold" className="h-icone-sm w-icone-sm" /> : marcado ? <Check weight="bold" className="h-icone-sm w-icone-sm" /> : null}
      </span>
    </button>
  )
}
