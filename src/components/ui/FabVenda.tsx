import { Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'

interface FabVendaProps {
  onClick?: () => void
  ativo?: boolean
  className?: string
}

/**
 * Botão "+ Venda" do rodapé (seção 5): quadrado de 56, raio 16, primary,
 * ícone "+" branco de 24, sombra fab; sobe 16 acima da linha do rodapé.
 */
export function FabVenda({ onClick, ativo, className }: FabVendaProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Nova venda"
      aria-current={ativo ? 'page' : undefined}
      className={cn('foco group flex -translate-y-4 flex-col items-center gap-1 rounded-lg', className)}
    >
      <span className="flex h-btn-lg w-btn-lg items-center justify-center rounded-lg bg-primary text-on-primary shadow-fab transition-[background-color,transform] duration-fast ease-out group-hover:bg-primary-hover group-active:scale-98 group-active:bg-pressed">
        <Plus weight="light" className="h-icone-nav w-icone-nav" />
      </span>
      <span className={cn('text-caption', ativo ? 'font-semibold text-text-primary' : 'text-text-secondary')}>Venda</span>
    </button>
  )
}
