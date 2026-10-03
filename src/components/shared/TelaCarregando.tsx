import { Logo, Skeleton } from '@/components/ui'

/** Tela inteira enquanto a sessão carrega: esqueleto, nunca rodinha nem tela branca. */
export function TelaCarregando() {
  return (
    <div className="flex min-h-tela flex-col items-center justify-center gap-6 px-gutter" aria-busy="true" aria-label="Carregando">
      <Logo />
      <div className="flex w-full max-w-folha flex-col gap-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-campo w-full" />
        <Skeleton className="h-campo w-full" />
      </div>
    </div>
  )
}
