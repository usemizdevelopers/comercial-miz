import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { dataLocal } from '@/lib/formatadores'
import type { Pasta } from '@/features/clientes/api'
import type { ItemVendaResumo } from '@/lib/vendas'
import type { TablesInsert } from '../../../types/supabase'

export interface Tarefa {
  cliente_id: string
  nome: string
  whatsapp: string
  pasta: Pasta
  motivo: string
  ultima_compra_em: string | null
  total_gasto: number | null
  vendedora_id: string | null
}

export async function listarTarefas(): Promise<Tarefa[]> {
  const { data, error } = await supabase.rpc('mizloja_tarefas_hoje')
  if (error) throw error
  return (data ?? []) as Tarefa[]
}

/** "Pular hoje": esconde o cartão até amanhã (data e usuária vêm do gatilho). */
export async function pularHoje(clienteId: string) {
  const linha = { cliente_id: clienteId } as TablesInsert<'mizloja_pulos'>
  const { error } = await supabase.from('mizloja_pulos').insert(linha)
  if (error && error.code !== '23505') throw error
}

export async function desfazerPulo(clienteId: string, usuariaId: string) {
  const hoje = format(dataLocal(new Date()), 'yyyy-MM-dd')
  const { error } = await supabase.from('mizloja_pulos').delete().eq('cliente_id', clienteId).eq('usuaria_id', usuariaId).eq('data', hoje)
  if (error) throw error
}

export interface VendaDeHoje {
  id: string
  cliente_id: string
  cliente_nome: string
  valor_total: number
  data_venda: string
  forma_pagamento: string
  itens: ItemVendaResumo[]
}

export interface VendasDeHoje {
  total_dia: number
  num_vendas: number
  ultimas: VendaDeHoje[]
}

export async function minhasVendasHoje(): Promise<VendasDeHoje> {
  const { data, error } = await supabase.rpc('mizloja_minhas_vendas_hoje')
  if (error) throw error
  const linha = (data ?? [])[0]
  return {
    total_dia: linha?.total_dia ?? 0,
    num_vendas: linha?.num_vendas ?? 0,
    ultimas: (linha?.ultimas ?? []) as unknown as VendaDeHoje[],
  }
}
