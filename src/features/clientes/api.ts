import { supabase } from '@/lib/supabase'
import { normalizarWhatsapp } from '@/lib/whatsapp'
import type { StatusCliente } from '@/components/ui'
import type { Tables, TablesInsert } from '../../../types/supabase'

/** Linha da view mizloja_v_clientes com os campos obrigatórios já garantidos. */
export type ClienteView = Omit<Tables<'mizloja_v_clientes'>, 'id' | 'nome' | 'whatsapp' | 'status' | 'etapa_kanban'> & {
  id: string
  nome: string
  whatsapp: string
  status: StatusCliente
  etapa_kanban: EtapaKanban
}

export type EtapaKanban = 'novas' | 'em_conversa' | 'comprou' | 'ativa' | 'recompra' | 'sumidas' | 'sem_interesse'
export type EtapaManual = 'novas' | 'em_conversa' | 'sem_interesse'
export type Pasta = 'follow_up' | 'pos_venda' | 'aniversario'

export const ETAPAS_QUADRO: Array<{ id: Exclude<EtapaKanban, 'sem_interesse'>; rotulo: string; manual: boolean }> = [
  { id: 'novas', rotulo: 'Novas', manual: true },
  { id: 'em_conversa', rotulo: 'Em conversa', manual: true },
  { id: 'comprou', rotulo: 'Comprou', manual: false },
  { id: 'ativa', rotulo: 'Ativa', manual: false },
  { id: 'recompra', rotulo: 'Hora da recompra', manual: false },
  { id: 'sumidas', rotulo: 'Sumidas', manual: false },
]

export const ETAPAS_MANUAIS: Array<{ id: EtapaManual; rotulo: string }> = [
  { id: 'novas', rotulo: 'Novas' },
  { id: 'em_conversa', rotulo: 'Em conversa' },
  { id: 'sem_interesse', rotulo: 'Sem interesse' },
]

function paraView(c: Tables<'mizloja_v_clientes'>): ClienteView {
  return {
    ...c,
    id: c.id ?? '',
    nome: c.nome ?? '',
    whatsapp: c.whatsapp ?? '',
    status: (c.status ?? 'nova') as StatusCliente,
    etapa_kanban: (c.etapa_kanban ?? 'novas') as EtapaKanban,
  }
}

const COLUNAS_LISTA =
  'id, nome, whatsapp, status, etapa_kanban, etapa_manual, vendedora_id, vendedora_nome, num_compras, total_gasto, ultima_compra_em, dias_sem_comprar, dias_para_aniversario, proximo_aniversario, aniv_dia, aniv_mes'

/** Base inteira da loja para o kanban (a tela filtra Minhas/Todas). */
export async function listarClientes(): Promise<ClienteView[]> {
  const todas: ClienteView[] = []
  // a API devolve no máximo 1000 linhas por vez
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase.from('mizloja_v_clientes').select(COLUNAS_LISTA).order('nome').range(de, de + 999)
    if (error) throw error
    todas.push(...(data ?? []).map((c) => paraView(c as Tables<'mizloja_v_clientes'>)))
    if (!data || data.length < 1000) break
  }
  return todas
}

export async function buscarCliente(id: string): Promise<ClienteView | null> {
  const { data, error } = await supabase.from('mizloja_v_clientes').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? paraView(data) : null
}

/** Cliente da loja com esse WhatsApp (checagem de duplicidade), ignorando a própria. */
export async function clientePorWhatsapp(whatsapp: string, ignorarId?: string): Promise<{ id: string; nome: string } | null> {
  const numero = normalizarWhatsapp(whatsapp)
  if (!numero) return null
  let consulta = supabase.from('mizloja_clientes').select('id, nome').eq('whatsapp', numero)
  if (ignorarId) consulta = consulta.neq('id', ignorarId)
  const { data, error } = await consulta.maybeSingle()
  if (error) throw error
  return data
}

export interface ResultadoBusca {
  id: string
  nome: string
  whatsapp_final: string
  ultima_compra_em: string | null
  num_compras: number
  vendedora_id: string | null
  vendedora_nome: string | null
}

/** Busca na base inteira da loja (nome sem acento ou dígitos do WhatsApp), a partir de 2 caracteres. */
export async function buscarClientes(termo: string, limite = 20): Promise<ResultadoBusca[]> {
  if (termo.trim().length < 2) return []
  const { data, error } = await supabase.rpc('mizloja_buscar_clientes', { p_termo: termo.trim(), p_limite: limite })
  if (error) throw error
  return data ?? []
}

export interface DadosEdicao {
  nome: string
  whatsapp: string
  aniv_dia: number | null
  aniv_mes: number | null
  aniv_ano: number | null
  etapa_manual: EtapaManual | null
}

export async function atualizarCliente(id: string, dados: Partial<DadosEdicao> & { observacoes?: string | null; recado_transferencia?: string | null }) {
  const { error } = await supabase.from('mizloja_clientes').update(dados).eq('id', id)
  if (error) throw error
}

export async function transferirCliente(clienteId: string, para: string, recado: string | null) {
  const { error } = await supabase.rpc('mizloja_transferir_cliente', {
    p_cliente_id: clienteId,
    p_para_usuaria_id: para,
    p_recado: recado ?? undefined,
  })
  if (error) throw error
}

/** Grava o toque no WhatsApp (pasta nula = fora da tela Hoje). */
export async function registrarContato(clienteId: string, pasta: Pasta | null) {
  // loja, usuária e data vêm do gatilho (a API só pode gravar cliente_id e pasta)
  const linha = { cliente_id: clienteId, pasta } as TablesInsert<'mizloja_contatos'>
  const { error } = await supabase.from('mizloja_contatos').insert(linha)
  if (error) throw error
}

export interface VendaDaCliente {
  id: string
  data_venda: string
  created_at: string
  valor_total: number
  forma_pagamento: string
  vendedora_id: string
  tem_peca_miz: boolean
  itens: Array<{ id: string; tipo: string; peca_nome: string | null; cor: string; cor_hex: string | null; tamanho: string; quantidade: number }>
}

export async function vendasDaCliente(clienteId: string): Promise<VendaDaCliente[]> {
  const { data, error } = await supabase
    .from('mizloja_vendas')
    .select('id, data_venda, created_at, valor_total, forma_pagamento, vendedora_id, tem_peca_miz, itens:mizloja_venda_itens(id, tipo, peca_nome, cor, cor_hex, tamanho, quantidade)')
    .eq('cliente_id', clienteId)
    .eq('excluida', false)
    .order('data_venda', { ascending: false })
  if (error) throw error
  return data ?? []
}

export interface EventoLinhaTempo {
  id: string
  tipo: 'contato' | 'transferencia'
  quando: string
  usuariaId: string | null
  pasta?: string | null
  deId?: string | null
  paraId?: string
  motivo?: string
  recado?: string | null
}

/** Contatos e transferências da cliente, do mais recente para o mais antigo. */
export async function linhaDoTempo(clienteId: string): Promise<EventoLinhaTempo[]> {
  const [contatos, transf] = await Promise.all([
    supabase.from('mizloja_contatos').select('id, created_at, usuaria_id, pasta').eq('cliente_id', clienteId).order('created_at', { ascending: false }).limit(50),
    supabase
      .from('mizloja_transferencias')
      .select('id, created_at, de_usuaria_id, para_usuaria_id, motivo, recado, criado_por')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])
  if (contatos.error) throw contatos.error
  if (transf.error) throw transf.error
  const eventos: EventoLinhaTempo[] = [
    ...(contatos.data ?? []).map((c) => ({ id: c.id, tipo: 'contato' as const, quando: c.created_at, usuariaId: c.usuaria_id, pasta: c.pasta })),
    ...(transf.data ?? []).map((t) => ({
      id: t.id,
      tipo: 'transferencia' as const,
      quando: t.created_at,
      usuariaId: t.criado_por,
      deId: t.de_usuaria_id,
      paraId: t.para_usuaria_id,
      motivo: t.motivo,
      recado: t.recado,
    })),
  ]
  return eventos.sort((a, b) => b.quando.localeCompare(a.quando))
}

/** Vendedora: até 24 h após o lançamento (o banco confere de novo). */
export async function editarVenda(id: string, dados: { valor_total: number; forma_pagamento: string }) {
  const { data, error } = await supabase.from('mizloja_vendas').update(dados).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Passou o prazo de 24 horas. Peça à dona da loja para alterar.')
}

export async function excluirVenda(id: string, motivo: string) {
  const { data, error } = await supabase.from('mizloja_vendas').update({ excluida: true, motivo_exclusao: motivo }).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Passou o prazo de 24 horas. Peça à dona da loja para excluir.')
}

/** Rótulo da etapa para exibir. */
export function rotuloEtapa(etapa: string | null | undefined): string {
  if (etapa === 'sem_interesse') return 'Sem interesse'
  return ETAPAS_QUADRO.find((e) => e.id === etapa)?.rotulo ?? ''
}
