import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ Selo de status */

export type StatusCliente = 'nova' | 'ativa' | 'vip' | 'esfriando' | 'sumida' | 'inativa'

const rotulosStatus: Record<StatusCliente, string> = {
  vip: 'VIP',
  ativa: 'Ativa',
  nova: 'Nova',
  esfriando: 'Esfriando',
  sumida: 'Sumida',
  inativa: 'Inativa',
}

const estilosStatus: Record<StatusCliente, string> = {
  vip: 'bg-primary text-on-primary',
  ativa: 'border border-primary text-text-primary',
  nova: 'bg-background-muted text-text-primary',
  esfriando: 'bg-warning-soft text-warning',
  sumida: 'border border-border-strong text-text-secondary',
  inativa: 'text-icon-muted',
}

/** Selo monocromático (seção 9): altura 24, raio 6, caption 600, sem ícone. */
export function StatusBadge({ status, className }: { status: StatusCliente; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-selo shrink-0 items-center rounded-sm px-2 text-caption font-semibold',
        estilosStatus[status],
        status === 'inativa' && 'px-0',
        className,
      )}
    >
      {rotulosStatus[status]}
    </span>
  )
}

/** Selo genérico com o mesmo formato (ex.: "Meta batida", "Inativa", "Aniversário"). */
export function Selo({
  children,
  tom = 'neutro',
  className,
}: {
  children: ReactNode
  tom?: 'neutro' | 'escuro' | 'sucesso' | 'alerta' | 'perigo' | 'contorno'
  className?: string
}) {
  const tons = {
    neutro: 'bg-background-muted text-text-primary',
    escuro: 'bg-primary text-on-primary',
    sucesso: 'bg-success-soft text-success',
    alerta: 'bg-warning-soft text-warning',
    perigo: 'bg-danger-soft text-danger',
    contorno: 'border border-border-strong text-text-secondary',
  }
  return (
    <span className={cn('inline-flex h-selo shrink-0 items-center rounded-sm px-2 text-caption font-semibold', tons[tom], className)}>
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ Barra de progresso */

/**
 * Barra da meta (seção 9): altura 8, raio 4, trilho border-subtle, preenchimento primary.
 * Ao bater 100%: preenchimento success e selo "Meta batida". Acima de 100%: cheia e o % ao lado.
 */
export function ProgressBar({
  percentual,
  mostrarPercentual,
  rotulo = 'Progresso da meta',
  className,
}: {
  percentual: number
  mostrarPercentual?: boolean
  rotulo?: string
  className?: string
}) {
  const p = Math.max(0, percentual)
  const batida = p >= 100
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(p, 100))}
        className="h-barra flex-1 overflow-hidden rounded-xs bg-border-subtle"
      >
        <div
          className={cn('h-full rounded-xs transition-[width] duration-slow ease-base', batida ? 'bg-success' : 'bg-primary')}
          style={{ width: `${Math.min(p, 100)}%` }}
        />
      </div>
      {(mostrarPercentual || p > 100) && (
        <span className="numeros text-label text-text-secondary">{Math.round(p)}%</span>
      )}
      {batida && <Selo tom="sucesso">Meta batida</Selo>}
    </div>
  )
}

/* ------------------------------------------------------------------ Esqueleto */

/** Carregando (seção 9): formas dos cards em background-muted pulsando suave. Nunca rodinha. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulsar rounded-md bg-background-muted', className)} />
}

export function SkeletonCard({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-4" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-6 w-2/3" />
      {Array.from({ length: linhas - 1 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ Estado vazio */

/** Estado vazio (seção 9): texto curto centralizado, no máximo um ícone em traço de 32, e uma ação secundária. */
export function EmptyState({ icone, texto, acao, className }: { icone?: ReactNode; texto: ReactNode; acao?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 px-6 py-10 text-center', className)}>
      {icone && <span className="text-icon-muted [&>svg]:h-icone-vazio [&>svg]:w-icone-vazio">{icone}</span>}
      <p className="max-w-form text-body text-text-secondary">{texto}</p>
      {acao}
    </div>
  )
}
