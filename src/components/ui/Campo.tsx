import { useId, type ReactNode } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'

export interface CampoBaseProps {
  rotulo?: string
  obrigatorio?: boolean
  erro?: string | null
  ajuda?: string
  className?: string
}

/**
 * Moldura comum: rótulo acima (label, text-secondary, a 8 px), "*" quando obrigatório,
 * mensagem de erro em caption danger com ícone de 16, ou ajuda em caption.
 */
export function Campo({
  rotulo,
  obrigatorio,
  erro,
  ajuda,
  className,
  children,
  idCampo,
}: CampoBaseProps & { children: (ids: { id: string; descricao?: string }) => ReactNode; idCampo?: string }) {
  const gerado = useId()
  const id = idCampo ?? gerado
  const idDescricao = erro || ajuda ? `${id}-desc` : undefined

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {rotulo && (
        <label htmlFor={id} className="text-label text-text-secondary">
          {rotulo}
          {obrigatorio && <span aria-hidden="true"> *</span>}
        </label>
      )}
      {children({ id, descricao: idDescricao })}
      {erro ? (
        <p id={idDescricao} role="alert" className="flex items-center gap-1 text-caption text-danger">
          <WarningCircle weight="light" className="h-icone-sm w-icone-sm shrink-0" aria-hidden="true" />
          {erro}
        </p>
      ) : ajuda ? (
        <p id={idDescricao} className="text-caption text-text-tertiary">
          {ajuda}
        </p>
      ) : null}
    </div>
  )
}
