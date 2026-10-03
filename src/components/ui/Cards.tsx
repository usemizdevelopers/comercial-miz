import type { HTMLAttributes, ReactNode } from 'react'
import { Trash } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'
import { formatarValor } from '@/lib/formatadores'
import { BolinhaCor } from './Chips'
import { ProgressBar, StatusBadge, type StatusCliente } from './Dados'

/* ------------------------------------------------------------------ Card base */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card tocável: fundo background-muted ao tocar */
  tocavel?: boolean
  semPadding?: boolean
}

/** Card base (seção 6): surface, borda 1 border-subtle, raio 16, padding 16/20, sem sombra. */
export function Card({ tocavel, semPadding, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border-subtle bg-surface',
        !semPadding && 'p-4 lg:p-5',
        tocavel && 'cursor-pointer transition-[background-color] duration-fast ease-out hover:bg-background-muted active:bg-background-muted',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** Rótulo editorial em caixa alta ("FALTAM", "VENDIDO NO MÊS"). */
export function Overline({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-overline uppercase text-text-secondary', className)}>{children}</p>
}

/** Valor grande: "R$" em h2 text-secondary alinhado pela base, número em display. */
export function ValorDestaque({ valor, tamanho = 'display', className }: { valor: number; tamanho?: 'display' | 'h1'; className?: string }) {
  return (
    <p className={cn('numeros flex items-baseline gap-1', className)}>
      <span className="text-h2 font-regular text-text-secondary">R$</span>
      <span className={tamanho === 'display' ? 'text-display' : 'text-h1'}>{formatarValor(valor, { destaque: true })}</span>
    </p>
  )
}

/* ------------------------------------------------------------------ KPI */

/** Número (seção 6): overline + valor em h1 (celular) ou display (computador) + variação em caption, sem seta colorida. */
export function CardKpi({ rotulo, valor, variacao, className }: { rotulo: string; valor: ReactNode; variacao?: string; className?: string }) {
  return (
    <Card className={cn('flex flex-col gap-2', className)}>
      <Overline>{rotulo}</Overline>
      <p className="numeros text-h1 lg:text-display">{valor}</p>
      {variacao && <p className="text-caption text-text-tertiary">{variacao}</p>}
    </Card>
  )
}

/* ------------------------------------------------------------------ Pasta */

/** Pasta (seção 6): 1/3 da largura, altura 104, overline no alto e contador em display 32. Vazia: icon-muted, sem toque. */
export function CardPasta({ nome, quantidade, onClick, ativa }: { nome: string; quantidade: number; onClick?: () => void; ativa?: boolean }) {
  const vazia = quantidade === 0
  return (
    <button
      type="button"
      onClick={vazia ? undefined : onClick}
      disabled={vazia}
      aria-pressed={ativa}
      aria-label={`${nome}: ${quantidade}`}
      className={cn(
        'foco flex h-pasta min-w-0 flex-1 flex-col justify-between rounded-lg bg-surface p-3 text-left transition-[background-color] duration-fast ease-out',
        ativa ? 'border-1.5 border-primary' : 'border border-border-subtle',
        vazia ? 'cursor-default' : 'hover:bg-background-muted active:bg-background-muted',
      )}
    >
      <span className={cn('truncate text-overline uppercase', vazia ? 'text-icon-muted' : 'text-text-secondary')}>{nome}</span>
      <span className={cn('numeros text-pasta', vazia ? 'text-icon-muted' : 'text-text-primary')}>{quantidade}</span>
    </button>
  )
}

/* ------------------------------------------------------------------ Meta */

/** Meta (seção 6): overline "FALTAM", valor em display, barra de 8 e linha com vendido, meta e %. Compacta: sem display. */
export function CardMeta({ vendido, meta, compacto, className }: { vendido: number; meta: number; compacto?: boolean; className?: string }) {
  const falta = Math.max(0, meta - vendido)
  const pct = meta > 0 ? (vendido / meta) * 100 : 0
  return (
    <Card className={cn('flex flex-col gap-4', className)}>
      {!compacto && (
        <div className="flex flex-col gap-1">
          <Overline>{falta > 0 ? 'Faltam' : 'Vendido no mês'}</Overline>
          <ValorDestaque valor={falta > 0 ? falta : vendido} />
        </div>
      )}
      <ProgressBar percentual={pct} />
      <p className="numeros text-body-sm text-text-secondary">
        Vendido R$ {formatarValor(vendido, { destaque: true })} de R$ {formatarValor(meta, { destaque: true })} · {Math.round(pct)}%
      </p>
    </Card>
  )
}

/* ------------------------------------------------------------------ Prêmio */

/** Prêmio (seção 6): fundo background-muted, sem borda; conquistado = fundo primary e texto branco. */
export function CardPremio({ descricao, condicao, conquistado, className }: { descricao: string; condicao: string; conquistado?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 rounded-lg p-4 lg:p-5', conquistado ? 'bg-primary text-on-primary' : 'bg-background-muted', className)}>
      <p className={cn('text-overline uppercase', conquistado ? 'text-on-primary' : 'text-text-secondary')}>
        {conquistado ? 'Conquistado' : 'Prêmio'}
      </p>
      <p className="text-h3">{descricao}</p>
      <p className={cn('text-body-sm', conquistado ? 'text-on-primary' : 'text-text-secondary')}>{condicao}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ Peça Miz (sem foto) */

export interface CorPeca {
  id?: string
  nome?: string
  hex: string
}

/**
 * Peça Miz (seção 6, sem foto): altura 64, nome em label e código em caption à esquerda;
 * à direita, até 6 bolinhas de 10 px. Selecionado: borda 1,5 primary e fundo background-muted.
 */
export function CardPeca({
  nome,
  codigo,
  cores,
  selecionado,
  inativa,
  onClick,
  className,
}: {
  nome: string
  codigo: string
  cores: CorPeca[]
  selecionado?: boolean
  inativa?: boolean
  onClick?: () => void
  className?: string
}) {
  const visiveis = cores.slice(0, 6)
  const resto = cores.length - visiveis.length
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={onClick ? selecionado : undefined}
      className={cn(
        'foco flex h-peca w-full items-center justify-between gap-3 rounded-lg px-4 text-left transition-[background-color,border-color] duration-fast ease-out',
        selecionado ? 'border-1.5 border-primary bg-background-muted' : 'border border-border-subtle bg-surface hover:bg-background-muted',
        className,
      )}
    >
      <span className="flex min-w-0 flex-col">
        <span className={cn('truncate text-label', inativa ? 'text-icon-muted' : 'text-text-primary')}>{nome}</span>
        <span className="truncate text-caption text-text-tertiary">
          {codigo}
          {inativa && ' · inativa'}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1" aria-label={`${cores.length} cores`}>
        {visiveis.map((c, i) => (
          <BolinhaCor key={c.id ?? `${c.hex}-${i}`} hex={c.hex} tamanho="pequena" />
        ))}
        {resto > 0 && <span className="text-caption text-text-tertiary">+{resto}</span>}
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------ Item adicionado */

/** Item (seção 6): linha sem borda própria — bolinha 12 + "Blusa Mia · Preta · M · 1" + lixeira 20. */
export function ItemLinha({ hex, texto, onRemover }: { hex?: string | null; texto: string; onRemover?: () => void }) {
  return (
    <div className="flex min-h-toque items-center gap-3 border-b border-border-subtle py-2 last:border-b-0">
      <BolinhaCor hex={hex ?? null} />
      <span className="min-w-0 flex-1 truncate text-body">{texto}</span>
      {onRemover && (
        <button
          type="button"
          onClick={onRemover}
          aria-label={`Remover ${texto}`}
          className="foco alvo-48 flex items-center justify-center rounded-sm text-text-secondary hover:text-danger"
        >
          <Trash weight="light" className="h-icone w-icone" />
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Cliente e Venda (base; finalizados nas etapas 4 e 5) */

/** Cliente (seção 6): nome h3 + selo; motivo em body-sm; linha de ações. */
export function CardCliente({
  nome,
  status,
  linha2,
  acoes,
  onClick,
}: {
  nome: string
  status?: StatusCliente
  linha2?: ReactNode
  acoes?: ReactNode
  onClick?: () => void
}) {
  return (
    <Card tocavel={!!onClick} onClick={onClick} className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-h3">{nome}</p>
        {status && <StatusBadge status={status} />}
      </div>
      {linha2 && <p className="truncate text-body-sm text-text-secondary">{linha2}</p>}
      {acoes && (
        <div className="flex items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
          {acoes}
        </div>
      )}
    </Card>
  )
}

/** Venda (seção 6): cliente + valor em h3; itens em body-sm; data, vendedora e pagamento em caption. */
export function CardVenda({
  cliente,
  valor,
  itens,
  rodape,
  onClick,
}: {
  cliente: string
  valor: number
  itens?: string
  rodape?: string
  onClick?: () => void
}) {
  return (
    <Card tocavel={!!onClick} onClick={onClick} className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-h3">{cliente}</p>
        <p className="numeros shrink-0 text-h3">R$ {formatarValor(valor)}</p>
      </div>
      {itens && <p className="truncate text-body-sm text-text-secondary">{itens}</p>}
      {rodape && <p className="truncate text-caption text-text-tertiary">{rodape}</p>}
    </Card>
  )
}
