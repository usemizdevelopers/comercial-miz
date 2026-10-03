import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { CaretRight, Minus, Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'

/** Escolha grande (seção 7): largura total, altura 64, raio 16, texto h3 à esquerda e seta fina. Toque seleciona e avança. */
export function ChoiceCard({
  children,
  descricao,
  selecionado,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { descricao?: ReactNode; selecionado?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selecionado}
      className={cn(
        'foco flex min-h-escolha w-full items-center justify-between gap-3 rounded-lg bg-surface px-4 text-left',
        'transition-[background-color,border-color] duration-fast ease-out hover:bg-background-muted active:bg-background-muted',
        selecionado ? 'border-1.5 border-primary bg-background-muted' : 'border border-border',
        className,
      )}
      {...props}
    >
      <span className="flex flex-col py-3">
        <span className="text-h3">{children}</span>
        {descricao && <span className="text-body-sm text-text-secondary">{descricao}</span>}
      </span>
      <CaretRight weight="light" className="h-icone w-icone shrink-0 text-text-secondary" aria-hidden="true" />
    </button>
  )
}

/** Quantidade (seção 7): grupo 120×44 com −, número e +; mínimo 1 ("−" em icon-muted no 1). */
export function QuantityStepper({
  value,
  onChange,
  minimo = 1,
  maximo = 99,
  rotulo = 'Quantidade',
}: {
  value: number
  onChange: (n: number) => void
  minimo?: number
  maximo?: number
  rotulo?: string
}) {
  const botao = 'foco alvo-48 flex h-full flex-1 items-center justify-center rounded-sm disabled:cursor-not-allowed'
  return (
    <div role="group" aria-label={rotulo} className="flex h-chip w-stepper items-center rounded-sm border border-border bg-surface">
      <button
        type="button"
        className={cn(botao, value <= minimo ? 'text-icon-muted' : 'text-text-primary hover:bg-background-muted')}
        disabled={value <= minimo}
        onClick={() => onChange(Math.max(minimo, value - 1))}
        aria-label="Diminuir"
      >
        <Minus weight="light" className="h-icone w-icone" />
      </button>
      <span className="numeros min-w-6 text-center text-label" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={cn(botao, value >= maximo ? 'text-icon-muted' : 'text-text-primary hover:bg-background-muted')}
        disabled={value >= maximo}
        onClick={() => onChange(Math.min(maximo, value + 1))}
        aria-label="Aumentar"
      >
        <Plus weight="light" className="h-icone w-icone" />
      </button>
    </div>
  )
}

/** Indicador de passos (seção 7): traços 24×3 a 8 de distância + overline "PASSO 2 DE 3 · PEÇAS". */
export function StepIndicator({ atual, passos }: { atual: number; passos: string[] }) {
  const nome = passos[atual - 1] ?? ''
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2" aria-hidden="true">
        {passos.map((p, i) => (
          <span key={p} className={cn('h-passo-h w-passo rounded-xs', i < atual ? 'bg-primary' : 'bg-border')} />
        ))}
      </div>
      <p className="text-overline uppercase text-text-secondary">
        Passo {atual} de {passos.length} · {nome}
      </p>
    </div>
  )
}
