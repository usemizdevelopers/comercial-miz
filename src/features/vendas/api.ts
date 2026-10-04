import { supabase } from '@/lib/supabase'
import type { Json } from '../../../types/supabase'

/** Cliente nova criada junto com a venda (o id vem do navegador). */
export interface ClienteNovaPayload {
  nome: string
  whatsapp: string
  aniv_dia: number | null
  aniv_mes: number | null
  aniv_ano: number | null
}

export interface ItemPayload {
  tipo: 'miz' | 'outra'
  peca_id?: string
  peca_cor_id?: string
  cor: string
  tamanho: string
  quantidade: number
}

/** Tudo o que vai para mizloja_salvar_venda. O mesmo pacote é reenviado pela fila sem duplicar. */
export interface PacoteVenda {
  venda_id: string
  cliente_id: string
  valor_total: number
  forma_pagamento: string
  itens: ItemPayload[]
  data_venda: string
  cliente_nova: ClienteNovaPayload | null
}

export interface VendaSalva {
  venda_id: string
  cliente_id: string
  ja_existia: boolean
}

export async function salvarVenda(p: PacoteVenda): Promise<VendaSalva> {
  const { data, error } = await supabase.rpc('mizloja_salvar_venda', {
    p_venda_id: p.venda_id,
    p_cliente_id: p.cliente_id,
    p_valor_total: p.valor_total,
    p_forma_pagamento: p.forma_pagamento,
    p_itens: p.itens as unknown as Json,
    p_data_venda: p.data_venda,
    p_cliente_nova: (p.cliente_nova ?? undefined) as unknown as Json,
  })
  if (error) throw error
  return data as unknown as VendaSalva
}

/** Cores de outra marca já usadas na loja (sugestão ao digitar). */
export async function coresUsadas(): Promise<string[]> {
  const { data, error } = await supabase.rpc('mizloja_cores_usadas', { p_limite: 40 })
  if (error) throw error
  return (data ?? []).map((c) => c.cor)
}

/** Erro de rede (sem conexão): a venda vai para a fila em vez de falhar. */
export function ehErroDeRede(e: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  const msg = (e as { message?: string; name?: string } | null)?.message ?? ''
  const nome = (e as { name?: string } | null)?.name ?? ''
  return (nome === 'TypeError' && /fetch/i.test(msg)) || /Failed to fetch|NetworkError|Load failed|network/i.test(msg)
}
