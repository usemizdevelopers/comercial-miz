import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/** Resumo do mês da usuária logada (mizloja_meu_resumo_mes). Campos nulos = não se aplica. */
export interface ResumoMes {
  mes: string
  meta_individual: number | null
  /** só vem quando não há meta individual */
  meta_loja: number | null
  vendido_loja: number | null
  vendido: number
  num_vendas: number
  ticket_medio: number | null
  clientes_novas: number
  dias_restantes: number
  valor_por_dia: number | null
  premio_descricao: string | null
  premio_condicao_pct: number | null
  premio_extra_descricao: string | null
  premio_extra_pct: number | null
  premio_conquistado: boolean | null
  premio_extra_conquistado: boolean | null
}

export async function buscarResumoMes(): Promise<ResumoMes | null> {
  const { data, error } = await supabase.rpc('mizloja_meu_resumo_mes', {})
  if (error) throw error
  return ((data ?? [])[0] as ResumoMes | undefined) ?? null
}

/** Usado em Hoje, Metas e na tela de sucesso da venda. */
export function useResumoMes() {
  return useQuery({ queryKey: ['metas', 'resumo'], queryFn: buscarResumoMes })
}

export interface MesHistorico {
  mes: string
  vendido: number
  meta: number | null
  percentual: number | null
  /** null = mês sem prêmio */
  premio_ganho: boolean | null
}

export function useHistoricoMetas() {
  return useQuery({
    queryKey: ['metas', 'historico'],
    queryFn: async (): Promise<MesHistorico[]> => {
      const { data, error } = await supabase.rpc('mizloja_meu_historico_metas', { p_meses: 6 })
      if (error) throw error
      return (data ?? []) as MesHistorico[]
    },
  })
}

export interface PosicaoRanking {
  posicao: number
  nome: string
  sou_eu: boolean
}

/** Vazio quando a ADM não ligou o ranking. */
export function useRanking() {
  return useQuery({
    queryKey: ['metas', 'ranking'],
    queryFn: async (): Promise<PosicaoRanking[]> => {
      const { data, error } = await supabase.rpc('mizloja_ranking_mes', {})
      if (error) throw error
      return data ?? []
    },
  })
}

/** Quanto falta para a meta individual (ou null sem meta). */
export function faltaParaMeta(r: ResumoMes | null | undefined): number | null {
  if (!r?.meta_individual) return null
  return Math.max(0, r.meta_individual - r.vendido)
}

/** Quanto falta para o prêmio (condição em % da meta individual). */
export function faltaParaPremio(r: ResumoMes | null | undefined, extra = false): number | null {
  if (!r?.meta_individual) return null
  const pct = extra ? r.premio_extra_pct : r.premio_condicao_pct
  const descricao = extra ? r.premio_extra_descricao : r.premio_descricao
  if (!descricao || !pct) return null
  return Math.max(0, (r.meta_individual * pct) / 100 - r.vendido)
}
