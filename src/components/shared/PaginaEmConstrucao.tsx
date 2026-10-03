import { Hammer } from '@phosphor-icons/react'
import { Card, EmptyState, TopBar } from '@/components/ui'

/** Página provisória das rotas que serão feitas nas próximas etapas. */
export function PaginaEmConstrucao({ titulo, etapa, descricao }: { titulo: string; etapa: number; descricao?: string }) {
  return (
    <>
      <TopBar titulo={titulo} />
      <div className="mx-auto w-full max-w-conteudo px-gutter pb-10 pt-2">
        <Card>
          <EmptyState
            icone={<Hammer weight="light" />}
            texto={
              <>
                <span className="block text-h3 text-text-primary">Em construção · Etapa {etapa}</span>
                {descricao && <span className="mt-2 block">{descricao}</span>}
              </>
            }
          />
        </Card>
      </div>
    </>
  )
}
