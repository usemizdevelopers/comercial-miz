import { supabase } from '@/lib/supabase'
import { somenteDigitos } from '@/lib/whatsapp'
import { semAcento } from '@/lib/texto'
import type { StatusCliente } from '@/components/ui'
import type { EtapaKanban } from './api'

/** Tabela de clientes da ADM: filtros combináveis, ordenação e paginação feitas no banco (view mizloja_v_clientes). */
export interface FiltrosClientes {
  busca: string
  status: StatusCliente | ''
  etapa: EtapaKanban | ''
  vendedora: string
  aniversario: '' | 'mes' | '7dias'
  tamanho: string
  cor: string
  miz: '' | 'sim' | 'nao'
  semComprarDias: string
  gastoMin: number | null
  gastoMax: number | null
}

export const FILTROS_VAZIOS: FiltrosClientes = {
  busca: '',
  status: '',
  etapa: '',
  vendedora: '',
  aniversario: '',
  tamanho: '',
  cor: '',
  miz: '',
  semComprarDias: '',
  gastoMin: null,
  gastoMax: null,
}

export type ColunaOrdem = 'nome' | 'status' | 'num_compras' | 'total_gasto' | 'ticket_medio' | 'intervalo_medio_dias' | 'ultima_compra_em' | 'vendedora_nome'

export interface LinhaCliente {
  id: string
  nome: string
  whatsapp: string
  status: StatusCliente
  etapa_kanban: EtapaKanban
  num_compras: number
  total_gasto: number
  ticket_medio: number | null
  intervalo_medio_dias: number | null
  ultima_compra_em: string | null
  tamanho_preferido: string | null
  cores_preferidas: string[]
  vendedora_id: string | null
  vendedora_nome: string | null
  aniv_dia: number | null
  aniv_mes: number | null
}

const COLUNAS =
  'id, nome, whatsapp, status, etapa_kanban, num_compras, total_gasto, ticket_medio, intervalo_medio_dias, ultima_compra_em, tamanho_preferido, cores_preferidas, vendedora_id, vendedora_nome, aniv_dia, aniv_mes'

/** Mês atual em São Paulo (1–12). */
function mesAtual(): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', month: 'numeric' }).format(new Date()))
}

function consulta(f: FiltrosClientes, contar: boolean) {
  let q = supabase.from('mizloja_v_clientes').select(COLUNAS, contar ? { count: 'exact' } : undefined)
  const termo = f.busca.trim()
  if (termo.length >= 2) {
    const digitos = somenteDigitos(termo)
    const soNumeros = digitos.length >= 2 && digitos.length === termo.replace(/[\s()+-]/g, '').length
    q = soNumeros ? q.like('whatsapp', `%${digitos}%`) : q.like('nome_busca', `%${semAcento(termo).replace(/[%_]/g, '')}%`)
  }
  if (f.status) q = q.eq('status', f.status)
  if (f.etapa) q = q.eq('etapa_kanban', f.etapa)
  if (f.vendedora) q = q.eq('vendedora_id', f.vendedora)
  if (f.aniversario === 'mes') q = q.eq('aniv_mes', mesAtual())
  if (f.aniversario === '7dias') q = q.gte('dias_para_aniversario', 0).lte('dias_para_aniversario', 7)
  if (f.tamanho) q = q.eq('tamanho_preferido', f.tamanho)
  if (f.cor) q = q.contains('cores_preferidas', [f.cor])
  if (f.miz) q = q.eq('tem_peca_miz', f.miz === 'sim')
  if (/^\d+$/.test(f.semComprarDias)) q = q.gt('dias_sem_comprar', Number(f.semComprarDias))
  if (f.gastoMin !== null) q = q.gte('total_gasto', f.gastoMin)
  if (f.gastoMax !== null) q = q.lte('total_gasto', f.gastoMax)
  return q
}

export async function listarClientesAdm(f: FiltrosClientes, ordem: ColunaOrdem, crescente: boolean, pagina: number, porPagina: number) {
  const { data, error, count } = await consulta(f, true)
    .order(ordem, { ascending: crescente, nullsFirst: false })
    .order('nome', { ascending: true })
    .range(pagina * porPagina, pagina * porPagina + porPagina - 1)
  if (error) throw error
  return { linhas: (data ?? []) as unknown as LinhaCliente[], total: count ?? 0 }
}

/** Todas as linhas do filtro (exportar), de 1000 em 1000. */
export async function todasAsClientes(f: FiltrosClientes, ordem: ColunaOrdem, crescente: boolean): Promise<LinhaCliente[]> {
  const todas: LinhaCliente[] = []
  for (let de = 0; ; de += 1000) {
    const { data, error } = await consulta(f, false)
      .order(ordem, { ascending: crescente, nullsFirst: false })
      .order('nome', { ascending: true })
      .range(de, de + 999)
    if (error) throw error
    todas.push(...((data ?? []) as unknown as LinhaCliente[]))
    if (!data || data.length < 1000) break
  }
  return todas
}

/** Mesclar duplicadas: tudo dentro da função, numa transação (a duplicada sai de vez com mizloja_exclusoes_atomicas; antes dela, fica anonimizada e fora de todas as listas). */
export async function mesclarClientes(manter: string, remover: string, nome: string, whatsapp: string) {
  const { error } = await supabase.rpc('mizloja_mesclar_clientes', { p_manter: manter, p_remover: remover, p_nome: nome, p_whatsapp: whatsapp })
  if (error) throw error
}

/** Excluir: só pela função. Com vendas, anonimiza (as vendas continuam nos números); sem vendas, apaga ('apagada' depois de mizloja_exclusoes_atomicas). */
export async function excluirCliente(id: string): Promise<'apagada' | 'anonimizada'> {
  const { data, error } = await supabase.rpc('mizloja_excluir_cliente', { p_id: id })
  if (error) throw error
  return data === 'apagada' ? 'apagada' : 'anonimizada'
}
