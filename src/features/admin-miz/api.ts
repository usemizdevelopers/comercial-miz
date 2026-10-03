import { supabase } from '@/lib/supabase'
import type { Database } from '../../../types/supabase'

type Tabela<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

export type Loja = Tabela<'mizloja_lojas'>
export type Usuaria = Tabela<'mizloja_usuarias'>
export type Peca = Tabela<'mizloja_pecas'>
export type CorPeca = Tabela<'mizloja_peca_cores'>
export type TamanhoPeca = Tabela<'mizloja_peca_tamanhos'>
export type AdminMiz = Tabela<'mizloja_admins'>

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

/** Tamanhos possíveis no cadastro de peça (inclui as grades PP/P e M/G). */
export const TAMANHOS_PECA = ['PP', 'P', 'M', 'G', 'GG', 'Unico', 'PP/P', 'M/G'] as const

/* ------------------------------------------------------------------ Lojas */

export type LojaResumo = Loja & {
  dona: Pick<Usuaria, 'id' | 'nome' | 'whatsapp' | 'situacao'> | null
  vendedorasAtivas: number
}

export async function listarLojas(): Promise<LojaResumo[]> {
  const { data, error } = await supabase
    .from('mizloja_lojas')
    .select('*, mizloja_usuarias(id, nome, whatsapp, perfil, situacao)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(({ mizloja_usuarias: us, ...loja }) => {
    const usuarias = us ?? []
    const dona = usuarias.find((u) => u.perfil === 'adm' && u.situacao === 'ativa') ?? usuarias.find((u) => u.perfil === 'adm') ?? null
    return {
      ...loja,
      dona: dona ? { id: dona.id, nome: dona.nome, whatsapp: dona.whatsapp, situacao: dona.situacao } : null,
      vendedorasAtivas: usuarias.filter((u) => u.perfil === 'vendedora' && u.situacao === 'ativa').length,
    }
  })
}

export async function buscarLoja(id: string): Promise<{ loja: Loja; usuarias: Usuaria[] }> {
  const [{ data: loja, error: e1 }, { data: usuarias, error: e2 }] = await Promise.all([
    supabase.from('mizloja_lojas').select('*').eq('id', id).single(),
    supabase.from('mizloja_usuarias').select('*').eq('loja_id', id).order('perfil').order('nome'),
  ])
  if (e1) throw e1
  if (e2) throw e2
  return { loja, usuarias: usuarias ?? [] }
}

export async function atualizarLoja(id: string, dados: Pick<Loja, 'nome' | 'cidade' | 'uf' | 'whatsapp'>) {
  const { error } = await supabase.from('mizloja_lojas').update(dados).eq('id', id)
  if (error) throw error
}

/* ------------------------------------------------------------------ Catálogo */

export type PecaCompleta = Peca & { cores: CorPeca[]; tamanhos: TamanhoPeca[] }

export async function listarPecas(): Promise<PecaCompleta[]> {
  const { data, error } = await supabase
    .from('mizloja_pecas')
    .select('*, cores:mizloja_peca_cores(*), tamanhos:mizloja_peca_tamanhos(*)')
    .order('nome')
  if (error) throw error
  return (data ?? []).map((p) => ({
    ...p,
    cores: [...(p.cores ?? [])].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)),
    tamanhos: [...(p.tamanhos ?? [])].sort((a, b) => a.ordem - b.ordem),
  }))
}

export async function buscarPeca(id: string): Promise<PecaCompleta> {
  const { data, error } = await supabase
    .from('mizloja_pecas')
    .select('*, cores:mizloja_peca_cores(*), tamanhos:mizloja_peca_tamanhos(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return {
    ...data,
    cores: [...(data.cores ?? [])].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)),
    tamanhos: [...(data.tamanhos ?? [])].sort((a, b) => a.ordem - b.ordem),
  }
}

export interface CorEditavel {
  id?: string
  nome: string
  valor: string
  ativa: boolean
}

export interface PecaEditavel {
  nome: string
  codigo_referencia: string
  composicao: string
  ativa: boolean
  cores: CorEditavel[]
  tamanhos: string[]
}

/** Erro de "já usada em venda" ao apagar peça ou cor. */
export class ErroJaVendida extends Error {}

/**
 * Salva a peça e sincroniza cores (ordem = posição na lista) e tamanhos.
 * Cor removida que já foi vendida não se apaga: o banco recusa e avisamos para desativar.
 */
export async function salvarPeca(id: string | null, p: PecaEditavel, coresOriginais: CorPeca[] = [], tamanhosOriginais: TamanhoPeca[] = []): Promise<string> {
  const dados = { nome: p.nome, codigo_referencia: p.codigo_referencia, composicao: p.composicao || null, ativa: p.ativa }
  let pecaId = id
  if (pecaId) {
    const { error } = await supabase.from('mizloja_pecas').update(dados).eq('id', pecaId)
    if (error) throw error
  } else {
    const { data, error } = await supabase.from('mizloja_pecas').insert(dados).select('id').single()
    if (error) throw error
    pecaId = data.id
  }

  // Cores: remove as tiradas da lista, atualiza as existentes e cria as novas
  const manter = new Set(p.cores.filter((c) => c.id).map((c) => c.id))
  const removidas = coresOriginais.filter((c) => !manter.has(c.id))
  for (const c of removidas) {
    const { error } = await supabase.from('mizloja_peca_cores').delete().eq('id', c.id)
    if (error) {
      if (error.code === '23503') throw new ErroJaVendida(`A cor ${c.nome} já foi vendida. Desative em vez de apagar.`)
      throw error
    }
  }
  for (const [ordem, c] of p.cores.entries()) {
    if (c.id) {
      const { error } = await supabase.from('mizloja_peca_cores').update({ nome: c.nome, valor: c.valor, ativa: c.ativa, ordem }).eq('id', c.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('mizloja_peca_cores').insert({ peca_id: pecaId, nome: c.nome, valor: c.valor, ativa: c.ativa, ordem })
      if (error) throw error
    }
  }

  // Tamanhos
  const atuais = new Set(tamanhosOriginais.map((t) => t.valor))
  const desejados = new Set(p.tamanhos)
  for (const t of tamanhosOriginais.filter((t) => !desejados.has(t.valor))) {
    const { error } = await supabase.from('mizloja_peca_tamanhos').delete().eq('id', t.id)
    if (error) throw error
  }
  const ordemPadrao = (v: string) => TAMANHOS_PECA.indexOf(v as (typeof TAMANHOS_PECA)[number])
  const novos = p.tamanhos.filter((t) => !atuais.has(t))
  if (novos.length) {
    const { error } = await supabase
      .from('mizloja_peca_tamanhos')
      .insert(novos.map((valor) => ({ peca_id: pecaId!, valor, ordem: ordemPadrao(valor) })))
    if (error) throw error
  }
  return pecaId!
}

export async function apagarPeca(id: string) {
  // Tamanhos e cores sem venda saem em cascata; peça vendida é recusada pelo banco
  const { error } = await supabase.from('mizloja_pecas').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') throw new ErroJaVendida('Essa peça já foi vendida. Desative em vez de apagar.')
    throw error
  }
}

/* ------------------------------------------------------------------ Admins Miz */

export async function listarAdmins(): Promise<AdminMiz[]> {
  const { data, error } = await supabase.from('mizloja_admins').select('*').order('nome')
  if (error) throw error
  return data ?? []
}
