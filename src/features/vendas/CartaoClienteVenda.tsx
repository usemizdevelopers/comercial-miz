import { BolinhaCor, Button, Card } from '@/components/ui'
import { useHexDasCores } from '@/hooks/useDadosLoja'
import { rotuloTamanho } from '@/lib/vendas'
import type { ClienteEscolhida } from './rascunho'

/**
 * Cartão fixo no topo dos passos 2 e 3: nome, nº de compras, tamanho preferido e as 2 cores
 * que mais compra (cola para sugerir peça). "Trocar" volta ao passo 1.
 */
export function CartaoClienteVenda({ cliente, minhaId, onTrocar }: { cliente: ClienteEscolhida; minhaId: string; onTrocar?: () => void }) {
  const hex = useHexDasCores()
  const cores = cliente.coresPreferidas.slice(0, 2)
  const deOutra = !cliente.nova && cliente.vendedoraId && cliente.vendedoraId !== minhaId

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-h3">{cliente.nome}</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-text-secondary">
            {cliente.nova ? (
              <span>Cliente nova</span>
            ) : (
              <span>
                {cliente.numCompras} {cliente.numCompras === 1 ? 'compra' : 'compras'}
              </span>
            )}
            {cliente.tamanhoPreferido && <span>· tam. {rotuloTamanho(cliente.tamanhoPreferido)}</span>}
            {cores.map((c) => (
              <span key={c} className="inline-flex items-center gap-1">
                · <BolinhaCor hex={hex(c)} tamanho="pequena" /> {c}
              </span>
            ))}
          </p>
        </div>
        {onTrocar && (
          <Button variante="texto" onClick={onTrocar}>
            Trocar
          </Button>
        )}
      </div>
      {deOutra && (
        <p className="text-caption text-text-tertiary">
          Cliente da {cliente.vendedoraNome ?? 'colega'}. Ao salvar a venda, ela passa a ser sua.
        </p>
      )}
    </Card>
  )
}
