import { useMemo } from 'react'
import { Card, ChipGroup, ChipPagamento, MoneyField, Overline, SelectField } from '@/components/ui'
import { formatarDiaPorExtenso, formatarMoeda } from '@/lib/formatadores'
import { PAGAMENTOS, instanteDaVenda, rotuloPagamento, textoItem, totalPecas } from '@/lib/vendas'
import type { EstadoVenda } from './rascunho'

type Mudar = (parcial: Partial<EstadoVenda>) => void

/** Até quantos dias para trás a vendedora pode lançar (o banco confere). */
const DIAS_PARA_TRAS = 7

/** Passo 3 · Valor, pagamento, data e resumo. */
export function PassoValor({ estado, mudar }: { estado: EstadoVenda; mudar: Mudar }) {
  const dias = useMemo(
    () =>
      Array.from({ length: DIAS_PARA_TRAS }, (_, i) => {
        const n = i + 1
        const dia = formatarDiaPorExtenso(instanteDaVenda(n))
        return { valor: n, rotulo: n === 1 ? `Ontem · ${dia}` : dia }
      }),
    [],
  )
  const outraData = estado.diasAtras > 0

  return (
    <div className="flex flex-col gap-6">
      <MoneyField rotulo="Valor total do pedido" obrigatorio value={estado.valor} onChange={(valor) => mudar({ valor })} autoFocus={estado.valor === null} />

      <div className="flex flex-col gap-2">
        <Overline>Forma de pagamento *</Overline>
        <ChipGroup rotulo="Forma de pagamento">
          {PAGAMENTOS.map((p) => (
            <ChipPagamento key={p.valor} rotulo={p.rotulo} selecionado={estado.pagamento === p.valor} onClick={() => mudar({ pagamento: p.valor })} />
          ))}
        </ChipGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Overline>Data</Overline>
        <ChipGroup rotulo="Data da venda">
          <ChipPagamento rotulo="Hoje" selecionado={!outraData} onClick={() => mudar({ diasAtras: 0 })} />
          <ChipPagamento rotulo="Outra data" selecionado={outraData} onClick={() => mudar({ diasAtras: outraData ? estado.diasAtras : 1 })} />
        </ChipGroup>
        {outraData && (
          <SelectField
            rotulo="Dia da venda"
            ajuda="Até 7 dias para trás"
            value={String(estado.diasAtras)}
            onChange={(e) => mudar({ diasAtras: Number(e.target.value) })}
            opcoes={dias.map((d) => ({ valor: String(d.valor), rotulo: d.rotulo }))}
          />
        )}
      </div>

      <Card className="flex flex-col gap-3">
        <Overline>Resumo</Overline>
        <p className="text-h3">{estado.cliente?.nome ?? 'Sem cliente'}</p>
        <ul className="flex flex-col gap-1 text-body-sm text-text-secondary">
          {estado.itens.map((i) => (
            <li key={i.chave}>{textoItem(i)}</li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between gap-3 border-t border-border-subtle pt-3">
          <span className="text-body-sm text-text-secondary">
            {totalPecas(estado.itens)} {totalPecas(estado.itens) === 1 ? 'peça' : 'peças'}
            {estado.pagamento ? ` · ${rotuloPagamento(estado.pagamento)}` : ''}
            {outraData ? ` · ${formatarDiaPorExtenso(instanteDaVenda(estado.diasAtras))}` : ' · hoje'}
          </span>
          <span className="numeros text-h3">{estado.valor ? formatarMoeda(estado.valor) : 'R$ —'}</span>
        </div>
      </Card>
    </div>
  )
}
