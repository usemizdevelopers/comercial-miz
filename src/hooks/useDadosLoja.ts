import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { semAcento } from '@/lib/texto'
import type { Tables } from '../../types/supabase'

/**
 * Dados da loja usados por várias páginas (equipe, prazos, mensagens e catálogo).
 * Mudam pouco: ficam 5 minutos em cache.
 */
const CINCO_MIN = 5 * 60_000

export type Colega = Pick<Tables<'mizloja_usuarias'>, 'id' | 'nome' | 'perfil' | 'situacao'>

export function useEquipe() {
  return useQuery({
    queryKey: ['loja', 'equipe'],
    staleTime: CINCO_MIN,
    queryFn: async (): Promise<Colega[]> => {
      const { data, error } = await supabase.from('mizloja_usuarias').select('id, nome, perfil, situacao').order('nome')
      if (error) throw error
      return data ?? []
    },
  })
}

/** Mapa id → nome da equipe (inclui inativas, para o histórico). */
export function useNomesEquipe(): Map<string, string> {
  const { data } = useEquipe()
  return useMemo(() => new Map((data ?? []).map((u) => [u.id, u.nome])), [data])
}

export type ConfigLoja = Tables<'mizloja_config'>

export function useConfigLoja() {
  return useQuery({
    queryKey: ['loja', 'config'],
    staleTime: CINCO_MIN,
    queryFn: async (): Promise<ConfigLoja | null> => {
      const { data, error } = await supabase.from('mizloja_config').select('*').maybeSingle()
      if (error) throw error
      return data
    },
  })
}

/** Textos de Aniversário e Pós-venda da loja (com [NOME] e [LOJA]). */
export function useMensagens() {
  return useQuery({
    queryKey: ['loja', 'mensagens'],
    staleTime: CINCO_MIN,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.from('mizloja_mensagens').select('tipo, texto')
      if (error) throw error
      return Object.fromEntries((data ?? []).map((m) => [m.tipo, m.texto]))
    },
  })
}

export interface CorCatalogo {
  id: string
  nome: string
  valor: string
  ativa: boolean
}

export interface PecaCatalogo {
  id: string
  nome: string
  codigo_referencia: string
  ativa: boolean
  cores: CorCatalogo[]
  tamanhos: string[]
}

/** Catálogo inteiro (ativas e inativas; a tela de venda filtra as ativas). */
export function useCatalogo() {
  return useQuery({
    queryKey: ['loja', 'catalogo'],
    staleTime: CINCO_MIN,
    queryFn: async (): Promise<PecaCatalogo[]> => {
      const { data, error } = await supabase
        .from('mizloja_pecas')
        .select('id, nome, codigo_referencia, ativa, cores:mizloja_peca_cores(id, nome, valor, ativa, ordem), tamanhos:mizloja_peca_tamanhos(valor, ordem)')
        .order('nome')
      if (error) throw error
      return (data ?? []).map((p) => ({
        id: p.id,
        nome: p.nome,
        codigo_referencia: p.codigo_referencia,
        ativa: p.ativa,
        cores: [...(p.cores ?? [])]
          .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome))
          .map((c) => ({ id: c.id, nome: c.nome, valor: c.valor, ativa: c.ativa })),
        tamanhos: [...(p.tamanhos ?? [])].sort((a, b) => a.ordem - b.ordem).map((t) => t.valor),
      }))
    },
  })
}

/** Hex de uma cor pelo nome (para as bolinhas das cores preferidas), a partir do catálogo. */
export function useHexDasCores(): (nome: string) => string | null {
  const { data } = useCatalogo()
  const mapa = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of data ?? []) for (const c of p.cores) if (!m.has(semAcento(c.nome))) m.set(semAcento(c.nome), c.valor)
    return m
  }, [data])
  return (nome: string) => mapa.get(semAcento(nome)) ?? null
}
