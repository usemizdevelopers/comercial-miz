import { supabase } from '@/lib/supabase'
import type { Periodo } from '@/lib/periodo'

/** Vendas da loja para a ADM (mizloja_adm_vendas confere que quem chama é ADM). */
export interface FiltrosVendas {
  periodo: Periodo
  vendedora?: string | null
  miz?: boolean | null
  peca?: string | null
  cor?: string | null
  tamanho?: string | null
  pagamento?: string | null
  excluidas?: boolean
}

export interface ItemVendaAdm {
  id: string
  tipo: 'miz' | 'outra'
  peca_id: string | null
  peca_nome: string | null
  peca_codigo: string | null
  peca_cor_id: string | null
  cor: string
  cor_hex: string | null
  tamanho: string
  quantidade: number
}

export interface VendaAdm {
  id: string
  data_venda: string
  created_at: string
  cliente_id: string
  cliente_nome: string
  vendedora_id: string
  vendedora_nome: string | null
  valor_total: number
  forma_pagamento: string
  tem_peca_miz: boolean
  excluida: boolean
  motivo_exclusao: string | null
  itens: ItemVendaAdm[]
}

export interface PaginaVendas {
  total_linhas: number
  vendas: number
  faturamento: number
  pecas: number
  linhas: VendaAdm[]
}

export async function buscarVendasAdm(f: FiltrosVendas, limite = 50, offset = 0): Promise<PaginaVendas> {
  const { data, error } = await supabase.rpc('mizloja_adm_vendas', {
    p_inicio: f.periodo.inicio,
    p_fim: f.periodo.fim,
    p_vendedora_id: f.vendedora ?? undefined,
    p_miz: f.miz ?? undefined,
    p_peca_id: f.peca ?? undefined,
    p_cor: f.cor ?? undefined,
    p_tamanho: f.tamanho ?? undefined,
    p_pagamento: f.pagamento ?? undefined,
    p_excluidas: f.excluidas ?? false,
    p_limite: limite,
    p_offset: offset,
  })
  if (error) throw error
  return data as unknown as PaginaVendas
}

/** Todas as linhas do filtro (para exportar), de 1000 em 1000. */
export async function todasAsVendas(f: FiltrosVendas): Promise<VendaAdm[]> {
  const todas: VendaAdm[] = []
  for (let offset = 0; ; offset += 1000) {
    const p = await buscarVendasAdm(f, 1000, offset)
    todas.push(...p.linhas)
    if (p.linhas.length < 1000) break
  }
  return todas
}

/** Uma venda completa (detalhe), pela mesma função, filtrando pelo id. */
export async function buscarVenda(id: string): Promise<VendaAdm | null> {
  const { data, error } = await supabase
    .from('mizloja_vendas')
    .select(
      'id, data_venda, created_at, cliente_id, vendedora_id, valor_total, forma_pagamento, tem_peca_miz, excluida, motivo_exclusao, ' +
        'cliente:mizloja_clientes(nome), itens:mizloja_venda_itens(id, tipo, peca_id, peca_nome, peca_codigo, peca_cor_id, cor, cor_hex, tamanho, quantidade, created_at)',
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const v = data as unknown as Omit<VendaAdm, 'cliente_nome' | 'vendedora_nome'> & { cliente: { nome: string } | null; itens: Array<ItemVendaAdm & { created_at: string }> }
  return {
    ...v,
    cliente_nome: v.cliente?.nome ?? '',
    vendedora_nome: null,
    itens: [...v.itens].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }
}

export interface Alteracao {
  id: string
  usuaria_id: string | null
  acao: 'edicao' | 'exclusao'
  antes: Record<string, unknown> | null
  depois: Record<string, unknown> | null
  motivo: string | null
  created_at: string
}

export async function alteracoesDaVenda(id: string): Promise<Alteracao[]> {
  const { data, error } = await supabase
    .from('mizloja_alteracoes')
    .select('id, usuaria_id, acao, antes, depois, motivo, created_at')
    .eq('venda_id', id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Alteracao[]
}

/** ADM: edita qualquer campo da venda, sem limite de 24 h (o banco registra a alteração). */
export async function editarVendaAdm(id: string, dados: { valor_total?: number; forma_pagamento?: string; data_venda?: string; vendedora_id?: string }) {
  const { data, error } = await supabase.from('mizloja_vendas').update(dados).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Só a dona da loja pode alterar esta venda.')
}

export async function excluirVendaAdm(id: string, motivo: string) {
  const { error } = await supabase.from('mizloja_vendas').update({ excluida: true, motivo_exclusao: motivo }).eq('id', id)
  if (error) throw error
}

export async function restaurarVenda(id: string) {
  const { error } = await supabase.from('mizloja_vendas').update({ excluida: false, motivo_exclusao: null }).eq('id', id)
  if (error) throw error
}

export interface ItemNovo {
  tipo: 'miz' | 'outra'
  peca_id?: string
  peca_cor_id?: string
  cor: string
  tamanho: string
  quantidade: number
}

export async function adicionarItem(vendaId: string, item: ItemNovo) {
  const { error } = await supabase.from('mizloja_venda_itens').insert({
    venda_id: vendaId,
    tipo: item.tipo,
    peca_id: item.peca_id ?? null,
    peca_cor_id: item.peca_cor_id ?? null,
    cor: item.cor,
    tamanho: item.tamanho,
    quantidade: item.quantidade,
  } as never)
  if (error) throw error
}

export async function atualizarQuantidade(itemId: string, quantidade: number) {
  const { error } = await supabase.from('mizloja_venda_itens').update({ quantidade }).eq('id', itemId)
  if (error) throw error
}

export async function removerItem(itemId: string) {
  const { error } = await supabase.from('mizloja_venda_itens').delete().eq('id', itemId)
  if (error) throw error
}
