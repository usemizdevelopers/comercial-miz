import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { ChatCircleText } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'
import { PontosCarregando } from './Spinner'

export type VarianteBotao = 'primario' | 'secundario' | 'texto' | 'whatsapp' | 'destrutivo'
export type TamanhoBotao = 'grande' | 'medio' | 'pequeno'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao
  tamanho?: TamanhoBotao
  carregando?: boolean
  icone?: ReactNode
  larguraTotal?: boolean
}

const base =
  'foco relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-label ' +
  'transition-[background-color,border-color,color,transform] duration-fast ease-out ' +
  'active:scale-98 disabled:cursor-not-allowed disabled:active:scale-100'

const variantes: Record<VarianteBotao, string> = {
  primario:
    'bg-primary text-on-primary hover:bg-primary-hover active:bg-pressed ' +
    'disabled:bg-border-subtle disabled:text-icon-muted',
  secundario:
    'border border-border bg-surface text-text-primary hover:bg-background-muted ' +
    'active:border-border-strong active:bg-background-muted ' +
    'disabled:border-border-subtle disabled:bg-surface disabled:text-icon-muted',
  whatsapp:
    'border border-border bg-surface text-text-primary hover:bg-background-muted ' +
    'active:border-border-strong active:bg-background-muted ' +
    'disabled:border-border-subtle disabled:bg-surface disabled:text-icon-muted',
  texto:
    'alvo-48 sublinhado bg-transparent px-0 text-text-primary ' +
    'hover:text-primary-hover disabled:text-icon-muted',
  destrutivo:
    'border border-danger bg-surface text-danger hover:bg-danger-soft active:bg-danger-soft ' +
    'disabled:border-border-subtle disabled:text-icon-muted',
}

const tamanhos: Record<TamanhoBotao, string> = {
  grande: 'h-btn-lg px-6',
  medio: 'h-btn-md px-5',
  // 36 px visíveis; área de toque continua 48 (alvo-48)
  pequeno: 'alvo-48 h-btn-sm px-3',
}

/**
 * Botão do design system (seção 5). No máximo um primário por tela.
 * "carregando" troca o texto por três pontos sem mudar a largura.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variante = 'primario',
    tamanho = 'medio',
    carregando = false,
    icone,
    larguraTotal,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  const iconeFinal = variante === 'whatsapp' ? (icone ?? <ChatCircleText weight="light" className="h-icone w-icone" />) : icone
  const conteudoTexto = variante === 'whatsapp' ? (children ?? 'WhatsApp') : children

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={cn(
        base,
        variantes[variante],
        variante === 'texto' ? 'h-auto' : tamanhos[tamanho],
        larguraTotal && 'w-full',
        carregando && 'disabled:cursor-wait',
        className,
      )}
      {...props}
    >
      <span className={cn('inline-flex items-center gap-2', carregando && 'invisible')}>
        {iconeFinal}
        {conteudoTexto}
      </span>
      {carregando && (
        <span className="absolute inset-0 flex items-center justify-center">
          <PontosCarregando className={variante === 'primario' ? 'text-on-primary' : 'text-text-secondary'} />
          <span className="sr-only">Carregando</span>
        </span>
      )}
    </button>
  )
})
