import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '../../../types/supabase'

export type Pessoa = Pick<Tables<'mizloja_usuarias'>, 'id' | 'nome' | 'perfil' | 'situacao' | 'whatsapp' | 'usuario' | 'ultimo_acesso_em' | 'precisa_trocar_senha' | 'email' | 'created_at'>

const COLUNAS = 'id, nome, perfil, situacao, whatsapp, usuario, ultimo_acesso_em, precisa_trocar_senha, email, created_at'

/** Equipe completa da loja (ADM vê todas as colegas pelo RLS). */
export function usePessoas() {
  return useQuery({
    queryKey: ['loja', 'pessoas'],
    queryFn: async (): Promise<Pessoa[]> => {
      const { data, error } = await supabase.from('mizloja_usuarias').select(COLUNAS).order('nome')
      if (error) throw error
      return data ?? []
    },
  })
}

export async function renomearPessoa(id: string, nome: string) {
  const { data, error } = await supabase.from('mizloja_usuarias').update({ nome: nome.trim() }).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Só a dona da loja pode editar a equipe.')
}

/** Passa todas as clientes de uma pessoa para outra (motivo desativação). Devolve quantas. */
export async function transferirCarteira(de: string, para: string): Promise<number> {
  const { data, error } = await supabase.rpc('mizloja_transferir_carteira', { p_de: de, p_para: para })
  if (error) throw error
  return data ?? 0
}

/** Quantas clientes estão com a pessoa. */
export async function contarCarteira(id: string): Promise<number> {
  const { count, error } = await supabase.from('mizloja_v_clientes').select('id', { count: 'exact', head: true }).eq('vendedora_id', id)
  if (error) throw error
  return count ?? 0
}
