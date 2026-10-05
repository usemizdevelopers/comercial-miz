import { formatarData, formatarMoeda } from '@/lib/formatadores'
import { rotuloPagamento, textoItem, type ItemVendaResumo } from '@/lib/vendas'

/** Linhas de texto de uma alteração de venda (mizloja_alteracoes): o que mudou, de quê para quê. */
export function descreverAlteracao(
  a: { acao: string; antes: Record<string, unknown> | null; depois: Record<string, unknown> | null; motivo: string | null },
  nomes: Map<string, string>,
): string[] {
  if (a.acao === 'exclusao') return [`Venda excluída${a.motivo ? ` · motivo: ${a.motivo}` : ''}`]

  const itemAntes = (a.antes?.item ?? null) as (ItemVendaResumo & { quantidade: number }) | null
  const itemDepois = (a.depois?.item ?? null) as (ItemVendaResumo & { quantidade: number }) | null
  if (itemAntes || itemDepois) {
    if (!itemAntes && itemDepois) return [`Item adicionado: ${textoItem(itemDepois)}`]
    if (itemAntes && !itemDepois) return [`Item removido: ${textoItem(itemAntes)}`]
    if (itemAntes && itemDepois) return [`Item alterado: ${textoItem(itemAntes)} → ${textoItem(itemDepois)}`]
  }

  const antes = a.antes ?? {}
  const depois = a.depois ?? {}
  const linhas: string[] = []
  const mudou = (k: string) => JSON.stringify(antes[k]) !== JSON.stringify(depois[k])
  if (mudou('valor_total')) linhas.push(`Valor: ${formatarMoeda(Number(antes.valor_total))} → ${formatarMoeda(Number(depois.valor_total))}`)
  if (mudou('forma_pagamento')) linhas.push(`Pagamento: ${rotuloPagamento(String(antes.forma_pagamento))} → ${rotuloPagamento(String(depois.forma_pagamento))}`)
  if (mudou('data_venda')) linhas.push(`Data: ${formatarData(String(antes.data_venda))} → ${formatarData(String(depois.data_venda))}`)
  if (mudou('vendedora_id'))
    linhas.push(`Vendedora: ${nomes.get(String(antes.vendedora_id)) ?? 'outra pessoa'} → ${nomes.get(String(depois.vendedora_id)) ?? 'outra pessoa'}`)
  if (mudou('cliente_id')) linhas.push('Cliente trocada (mescla de duplicadas)')
  if (mudou('excluida') && depois.excluida === false) linhas.push('Venda restaurada')
  return linhas.length ? linhas : ['Alteração sem mudança visível']
}
