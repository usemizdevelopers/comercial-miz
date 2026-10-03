import type { ReactNode } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'

/** Título da página (h1) com ação à direita; com "voltar", vira título h2 de detalhe. */
export function CabecalhoPagina({ titulo, subtitulo, acao, onVoltar }: { titulo: ReactNode; subtitulo?: ReactNode; acao?: ReactNode; onVoltar?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 pt-6 lg:pt-8">
      <div className="flex min-w-0 items-center gap-2">
        {onVoltar && (
          <button type="button" onClick={onVoltar} aria-label="Voltar" className="foco alvo-48 -ml-2 flex items-center justify-center rounded-sm">
            <ArrowLeft weight="light" className="h-icone-nav w-icone-nav" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className={onVoltar ? 'truncate text-h2' : 'text-h1'}>{titulo}</h1>
          {subtitulo && <p className="text-body-sm text-text-secondary">{subtitulo}</p>}
        </div>
      </div>
      {acao}
    </div>
  )
}
