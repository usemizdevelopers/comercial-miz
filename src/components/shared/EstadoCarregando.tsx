import { SkeletonCard } from '@/components/ui'

/** Lista carregando: esqueletos no formato dos cards. */
export function ListaCarregando({ quantidade = 3 }: { quantidade?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: quantidade }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
