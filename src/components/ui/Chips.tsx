import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'
import { corClara } from '@/lib/cores'

/** Agrupa chips com quebra de linha e 8 de espaço (nunca rolagem lateral escondida). */
export function ChipGroup({ children, rotulo, className }: { children: ReactNode; rotulo?: string; className?: string }) {
  return (
    <div role="group" aria-label={rotulo} className={cn('flex flex-wrap gap-2', className)}>
      {children}
    </div>
  )
}

interface ChipBaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  selecionado?: boolean
}

const baseChip =
  'foco inline-flex select-none items-center justify-center rounded-sm transition-[background-color,border-color,color] duration-fast ease-out disabled:cursor-not-allowed disabled:opacity-50'

/** Tamanho: quadrado 48×48, raio 6, letra em label; selecionado = fundo primary e letra branca. */
export function ChipTamanho({ valor, selecionado, className, ...props }: ChipBaseProps & { valor: string }) {
  return (
    <button
      type="button"
      aria-pressed={selecionado}
      className={cn(
        baseChip,
        'h-toque min-w-toque px-2 text-label',
        selecionado ? 'bg-primary text-on-primary' : 'border border-border bg-surface text-text-primary hover:bg-background-muted',
        className,
      )}
      {...props}
    >
      {valor === 'Unico' ? 'Único' : valor}
    </button>
  )
}

/** Bolinha com a cor real da peça (única cor fora da paleta permitida na interface). */
export function BolinhaCor({
  hex,
  tamanho = 'normal',
  anel,
  className,
}: {
  hex: string | null | undefined
  tamanho?: 'pequena' | 'normal' | 'grande'
  anel?: boolean
  className?: string
}) {
  const medida = { pequena: 'h-bolinha-sm w-bolinha-sm', normal: 'h-bolinha w-bolinha', grande: 'h-bolinha-lg w-bolinha-lg' }[tamanho]
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block shrink-0 rounded-full',
        medida,
        corClara(hex) && 'border border-border',
        anel && 'ring-2 ring-primary ring-offset-2 ring-offset-background-muted',
        className,
      )}
      // A cor da peça vem do catálogo (hex real); é o único valor de cor fora dos tokens.
      style={{ backgroundColor: hex ?? 'transparent' }}
    />
  )
}

/** Cor Miz: altura 44, bolinha de 16 com a cor real + nome; selecionado = borda 1,5 primary, fundo muted e anel na bolinha. */
export function ChipCor({ nome, hex, selecionado, className, ...props }: ChipBaseProps & { nome: string; hex: string }) {
  return (
    <button
      type="button"
      aria-pressed={selecionado}
      className={cn(
        baseChip,
        'h-chip gap-2 px-3 text-body-sm',
        selecionado ? 'border-1.5 border-primary bg-background-muted' : 'border border-border bg-surface hover:bg-background-muted',
        className,
      )}
      {...props}
    >
      <BolinhaCor hex={hex} tamanho="grande" anel={selecionado} />
      {nome}
    </button>
  )
}

/** Pagamento: altura 44, texto label; selecionado = fundo primary e texto branco. */
export function ChipPagamento({ rotulo, selecionado, className, ...props }: ChipBaseProps & { rotulo: string }) {
  return (
    <button
      type="button"
      aria-pressed={selecionado}
      className={cn(
        baseChip,
        'h-chip px-4 text-label',
        selecionado ? 'bg-primary text-on-primary' : 'border border-border bg-surface text-text-primary hover:bg-background-muted',
        className,
      )}
      {...props}
    >
      {rotulo}
    </button>
  )
}

/** Filtro: altura 36, fundo muted sem borda, body-sm; selecionado = primary com "x" para remover. */
export function ChipFiltro({
  rotulo,
  selecionado,
  onRemover,
  className,
  ...props
}: ChipBaseProps & { rotulo: string; onRemover?: () => void }) {
  return (
    <span className={cn('inline-flex', className)}>
      <button
        type="button"
        aria-pressed={selecionado}
        className={cn(
          baseChip,
          'alvo-48 h-chip-filtro gap-1 px-3 text-body-sm',
          selecionado ? 'bg-primary text-on-primary' : 'bg-background-muted text-text-primary hover:bg-border-subtle',
          selecionado && onRemover && 'rounded-r-none pr-2',
        )}
        {...props}
      >
        {rotulo}
      </button>
      {selecionado && onRemover && (
        <button
          type="button"
          onClick={onRemover}
          aria-label={`Remover filtro ${rotulo}`}
          className={cn(baseChip, 'alvo-48 h-chip-filtro rounded-l-none bg-primary pr-2 text-on-primary')}
        >
          <X weight="light" className="h-icone-sm w-icone-sm" />
        </button>
      )}
    </span>
  )
}
