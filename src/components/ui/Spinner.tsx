import { cn } from '@/lib/cn'

/** Três pontos animados do estado "carregando" dos botões (seção 5). */
export function PontosCarregando({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 rounded-full bg-current animate-ponto"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  )
}
