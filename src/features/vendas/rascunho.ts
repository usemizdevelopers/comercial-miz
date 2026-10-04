import type { DataPartes } from '@/components/ui'
import type { FormaPagamento } from '@/lib/vendas'

/** Cliente escolhida (ou nova, ainda não gravada) no passo 1. */
export interface ClienteEscolhida {
  id: string
  nome: string
  whatsapp: string | null
  numCompras: number
  tamanhoPreferido: string | null
  coresPreferidas: string[]
  vendedoraId: string | null
  vendedoraNome: string | null
  /** cliente nova: só é criada ao salvar a venda */
  nova: boolean
  aniversario?: DataPartes
}

export interface ItemForm {
  chave: string
  tipo: 'miz' | 'outra'
  peca_id?: string
  peca_nome?: string
  peca_cor_id?: string
  cor: string
  cor_hex?: string | null
  tamanho: string
  quantidade: number
}

export type ModoCliente = 'nova' | 'existente' | 'nao_sei'

/** Tudo o que a vendedora preencheu. "Voltar" nunca apaga nada daqui. */
export interface EstadoVenda {
  passo: 1 | 2 | 3
  modo: ModoCliente | null
  termo: string
  novaNome: string
  novaWhatsapp: string
  novaAniversario: DataPartes
  cliente: ClienteEscolhida | null
  temMiz: boolean | null
  outrasAbertas: boolean
  itens: ItemForm[]
  valor: number | null
  pagamento: FormaPagamento | null
  diasAtras: number
}

export const ESTADO_INICIAL: EstadoVenda = {
  passo: 1,
  modo: null,
  termo: '',
  novaNome: '',
  novaWhatsapp: '',
  novaAniversario: { dia: '', mes: '', ano: '' },
  cliente: null,
  temMiz: null,
  outrasAbertas: false,
  itens: [],
  valor: null,
  pagamento: null,
  diasAtras: 0,
}

const chave = (usuariaId: string) => `mizloja-rascunho-venda:${usuariaId}`

/** Vale guardar? (já tem cliente ou algum item) */
export function temConteudo(e: EstadoVenda): boolean {
  return !!e.cliente || e.itens.length > 0 || e.novaNome.trim() !== ''
}

export function lerRascunho(usuariaId: string): EstadoVenda | null {
  try {
    const bruto = localStorage.getItem(chave(usuariaId))
    if (!bruto) return null
    const e = { ...ESTADO_INICIAL, ...(JSON.parse(bruto) as Partial<EstadoVenda>) }
    return temConteudo(e) ? e : null
  } catch {
    return null
  }
}

export function guardarRascunho(usuariaId: string, e: EstadoVenda) {
  try {
    if (temConteudo(e)) localStorage.setItem(chave(usuariaId), JSON.stringify(e))
    else localStorage.removeItem(chave(usuariaId))
  } catch {
    // sem armazenamento: segue sem rascunho
  }
}

export function apagarRascunho(usuariaId: string) {
  try {
    localStorage.removeItem(chave(usuariaId))
  } catch {
    // ignora
  }
}

/** Nome para "Continuar a venda da [nome]?" */
export function nomeDoRascunho(e: EstadoVenda): string {
  return e.cliente?.nome ?? (e.novaNome.trim() || 'cliente sem nome')
}
