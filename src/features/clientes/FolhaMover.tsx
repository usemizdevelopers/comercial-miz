import { BottomSheet, ChoiceCard } from '@/components/ui'
import { rotuloEtapa, type ClienteView, type EtapaManual } from './api'
import { opcoesMover } from './kanban'

/** Seletor "Mover para…" (pressionar o cartão no celular, ou o botão Mover). */
export function FolhaMover({
  cliente,
  onFechar,
  onMover,
}: {
  cliente: ClienteView | null
  onFechar: () => void
  onMover: (c: ClienteView, etapa: EtapaManual | null) => void
}) {
  return (
    <BottomSheet aberta={!!cliente} onFechar={onFechar} titulo={cliente ? `Mover ${cliente.nome.split(' ')[0]}` : undefined}>
      {cliente && (
        <div className="flex flex-col gap-4">
          <p className="text-body-sm text-text-secondary">Agora em: {rotuloEtapa(cliente.etapa_kanban)}</p>
          <div className="flex flex-col gap-3">
            {opcoesMover(cliente).map((o) => (
              <ChoiceCard
                key={o.etapa ?? 'auto'}
                selecionado={o.etapa !== null && o.etapa === cliente.etapa_kanban}
                onClick={() => onMover(cliente, o.etapa)}
              >
                {o.rotulo}
              </ChoiceCard>
            ))}
          </div>
          <p className="text-caption text-text-tertiary">
            Você move só entre Novas, Em conversa e Sem interesse. Comprou, Ativa, Hora da recompra e Sumidas mudam sozinhas: pela venda e pelo tempo desde a
            última compra.
          </p>
        </div>
      )}
    </BottomSheet>
  )
}
