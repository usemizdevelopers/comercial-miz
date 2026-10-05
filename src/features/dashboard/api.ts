import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Periodo } from '@/lib/periodo'

/** Funções de leitura do painel da ADM (o banco confere que quem chama é ADM ativa da loja). */

export interface Indicadores {
  faturamento: number
  vendas: number
  ticket_medio: number | null
  pecas: number
  clientes_novas: number
  taxa_recompra: number | null
  clientes_ativas: number
  pct_miz: number | null
}

export interface Resumo {
  inicio: string
  fim: string
  anterior_inicio: string
  anterior_fim: string
  atual: Indicadores
  anterior: Indicadores
}

export interface Series {
  agrupamento: 'dia' | 'mes'
  faturamento: Array<{ data: string; valor: number; vendas: number }>
  por_vendedora: Array<{ usuaria_id: string; nome: string; faturamento: number; vendas: number }>
  pecas_miz: Array<{ peca_id: string; nome: string; codigo: string; quantidade: number }>
  cores: Array<{ cor: string; hex: string | null; quantidade: number }>
  tamanhos: Array<{ tamanho: string; quantidade: number }>
  perfil: {
    tamanho: string | null
    cores: Array<{ cor: string; hex: string | null; quantidade: number }>
    peca: { nome: string; codigo: string; quantidade: number } | null
    ticket_medio: number | null
    intervalo_medio: number | null
    aniversariantes_mes: number
  }
  saude: Partial<Record<string, number>>
}

export interface MetaVendedora {
  usuaria_id: string
  nome: string
  perfil: 'adm' | 'vendedora'
  situacao: 'ativa' | 'inativa'
  meta: number | null
  vendido: number
  vendas: number
  percentual: number | null
  falta: number | null
  premio_elegivel: boolean | null
  premio: 'a_caminho' | 'conquistado' | null
  premio_extra: 'a_caminho' | 'conquistado' | null
}

export interface PainelMeta {
  mes: string
  meta_id: string | null
  status: 'rascunho' | 'publicada' | null
  valor_loja: number | null
  vendido: number
  falta: number | null
  dias_restantes: number
  por_dia: number | null
  premio_descricao: string | null
  premio_condicao_pct: number | null
  premio_extra_descricao: string | null
  premio_extra_pct: number | null
  vendedoras: MetaVendedora[]
}

export interface PainelVendedora {
  contatos: number
  clientes_atendidas: number
  pecas_miz: number
  cadastradas: number
  cadastradas_compraram: number
  conversao: number | null
}

export async function buscarResumo(p: Periodo, vendedora?: string | null): Promise<Resumo> {
  const { data, error } = await supabase.rpc('mizloja_painel_resumo', { p_inicio: p.inicio, p_fim: p.fim, p_vendedora_id: vendedora ?? undefined })
  if (error) throw error
  return data as unknown as Resumo
}

export async function buscarSeries(p: Periodo, vendedora?: string | null): Promise<Series> {
  const { data, error } = await supabase.rpc('mizloja_painel_series', { p_inicio: p.inicio, p_fim: p.fim, p_vendedora_id: vendedora ?? undefined })
  if (error) throw error
  return data as unknown as Series
}

export async function buscarPainelMeta(mes?: string): Promise<PainelMeta> {
  const { data, error } = await supabase.rpc('mizloja_painel_meta', mes ? { p_mes: mes } : {})
  if (error) throw error
  return data as unknown as PainelMeta
}

export async function buscarPainelVendedora(id: string, p: Periodo): Promise<PainelVendedora> {
  const { data, error } = await supabase.rpc('mizloja_painel_vendedora', { p_vendedora_id: id, p_inicio: p.inicio, p_fim: p.fim })
  if (error) throw error
  return data as unknown as PainelVendedora
}

export const useResumo = (p: Periodo, vendedora?: string | null) =>
  useQuery({ queryKey: ['painel', 'resumo', p.inicio, p.fim, vendedora ?? null], queryFn: () => buscarResumo(p, vendedora) })

export const useSeries = (p: Periodo, vendedora?: string | null) =>
  useQuery({ queryKey: ['painel', 'series', p.inicio, p.fim, vendedora ?? null], queryFn: () => buscarSeries(p, vendedora) })

export const usePainelMeta = (mes?: string) => useQuery({ queryKey: ['painel', 'meta', mes ?? 'atual'], queryFn: () => buscarPainelMeta(mes) })
