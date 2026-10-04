import { dataLocal } from './formatadores'

/** Formas de pagamento (mesmos valores do banco), na ordem da especificação. */
export const PAGAMENTOS = [
  { valor: 'pix', rotulo: 'PIX' },
  { valor: 'cartao_credito', rotulo: 'Cartão de crédito' },
  { valor: 'cartao_debito', rotulo: 'Cartão de débito' },
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'crediario', rotulo: 'Crediário' },
] as const

export type FormaPagamento = (typeof PAGAMENTOS)[number]['valor']

export function rotuloPagamento(valor: string | null | undefined): string {
  return PAGAMENTOS.find((p) => p.valor === valor)?.rotulo ?? ''
}

/** Tamanhos de peça de outra marca (lista fixa do banco). */
export const TAMANHOS_OUTRA = ['PP', 'P', 'M', 'G', 'GG', 'Unico'] as const

export function rotuloTamanho(t: string | null | undefined): string {
  return t === 'Unico' ? 'Único' : (t ?? '')
}

/** Item como vem do banco ou do formulário. */
export interface ItemVendaResumo {
  tipo: 'miz' | 'outra' | string
  peca_nome?: string | null
  cor: string
  tamanho: string
  quantidade: number
}

/** "Blusa Mia · Preta · M · 1" (outra marca: "Outra marca · Azul bebê · M · 2"). */
export function textoItem(i: ItemVendaResumo): string {
  const nome = i.tipo === 'miz' ? (i.peca_nome ?? 'Peça Miz') : 'Outra marca'
  return `${nome} · ${i.cor} · ${rotuloTamanho(i.tamanho)} · ${i.quantidade}`
}

/** "Blusa Mia Preta M + 1 peça": primeiro item e quantas peças a mais. */
export function resumirItens(itens: ItemVendaResumo[]): string {
  if (itens.length === 0) return ''
  const [primeiro, ...resto] = itens
  if (!primeiro) return ''
  const nome = primeiro.tipo === 'miz' ? (primeiro.peca_nome ?? 'Peça Miz') : 'Peça'
  const base = `${nome} ${primeiro.cor} ${rotuloTamanho(primeiro.tamanho)}`
  const mais = primeiro.quantidade - 1 + resto.reduce((s, i) => s + i.quantidade, 0)
  if (mais <= 0) return base
  return `${base} + ${mais} ${mais === 1 ? 'peça' : 'peças'}`
}

/** Quantas peças no total. */
export function totalPecas(itens: Array<{ quantidade: number }>): number {
  return itens.reduce((s, i) => s + i.quantidade, 0)
}

/**
 * Instante da venda: hoje = agora; dias atrás = meio-dia daquele dia em São Paulo
 * (o banco conta a venda pela data local; meio-dia evita virar o dia por fuso).
 */
export function instanteDaVenda(diasAtras: number, agora: Date = new Date()): string {
  if (diasAtras <= 0) return agora.toISOString()
  const d = dataLocal(agora)
  d.setDate(d.getDate() - diasAtras)
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return new Date(`${ano}-${mes}-${dia}T12:00:00-03:00`).toISOString()
}
