import { cn } from '@/lib/cn'

/** Classes da caixa do campo (seção 7): 52 de altura, raio 10, borda 1 border, foco 1,5 primary. */
export function classesCaixa({ erro, desabilitado }: { erro?: boolean; desabilitado?: boolean }) {
  return cn(
    'w-full rounded-md border bg-surface px-4 text-text-primary transition-[border-color,box-shadow] duration-fast ease-out',
    'outline-none focus-within:border-1.5 focus-within:border-primary',
    erro ? 'border-1.5 border-danger focus-within:border-danger' : 'border-border',
    desabilitado && 'border-border-subtle bg-background-muted text-icon-muted',
  )
}
