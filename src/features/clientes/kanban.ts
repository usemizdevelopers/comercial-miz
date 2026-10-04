import { semAcento } from '@/lib/texto'
import { somenteDigitos } from '@/lib/whatsapp'
import type { ClienteView, EtapaKanban, EtapaManual } from './api'

export interface OpcaoMover {
  etapa: EtapaManual | null
  rotulo: string
}

/** Para onde a cliente pode ir à mão (as outras colunas mudam sozinhas). */
export function opcoesMover(c: Pick<ClienteView, 'num_compras' | 'etapa_kanban'>): OpcaoMover[] {
  if ((c.num_compras ?? 0) === 0) {
    return [
      { etapa: 'novas', rotulo: 'Novas' },
      { etapa: 'em_conversa', rotulo: 'Em conversa' },
      { etapa: 'sem_interesse', rotulo: 'Sem interesse' },
    ]
  }
  return c.etapa_kanban === 'sem_interesse'
    ? [{ etapa: null, rotulo: 'Voltar para o quadro' }]
    : [{ etapa: 'sem_interesse', rotulo: 'Sem interesse' }]
}

/** Etapa que a view vai mostrar depois de mover (para a atualização otimista). */
export function etapaDepoisDeMover(c: Pick<ClienteView, 'num_compras' | 'etapa_kanban'>, etapa: EtapaManual | null): EtapaKanban {
  if (etapa) return etapa
  return c.etapa_kanban
}

export type SeloFiltro = 'vip' | 'aniversario' | 'nova'

/** Aniversário nos próximos 7 dias (selo "Aniversário" do cartão). */
export function fazAniversario(c: Pick<ClienteView, 'dias_para_aniversario'>): boolean {
  return c.dias_para_aniversario !== null && c.dias_para_aniversario !== undefined && c.dias_para_aniversario >= 0 && c.dias_para_aniversario <= 7
}

export interface FiltrosKanban {
  busca: string
  soMinhas: boolean
  minhaId: string
  selo: SeloFiltro | null
}

/** Busca por nome (sem acento) ou dígitos do WhatsApp, Minhas/Todas e selo. */
export function filtrarClientes<T extends Pick<ClienteView, 'nome' | 'whatsapp' | 'vendedora_id' | 'status' | 'dias_para_aniversario'>>(
  lista: T[],
  f: FiltrosKanban,
): T[] {
  const termo = semAcento(f.busca)
  const digitos = somenteDigitos(f.busca)
  const soNumeros = digitos.length >= 2 && digitos.length === f.busca.replace(/[\s()+-]/g, '').length
  return lista.filter((c) => {
    if (f.soMinhas && c.vendedora_id !== f.minhaId) return false
    if (f.selo === 'vip' && c.status !== 'vip') return false
    if (f.selo === 'nova' && c.status !== 'nova') return false
    if (f.selo === 'aniversario' && !fazAniversario(c)) return false
    if (!termo) return true
    return soNumeros ? c.whatsapp.includes(digitos) : semAcento(c.nome).includes(termo)
  })
}

/** Agrupa por etapa do kanban. */
export function agruparPorEtapa<T extends Pick<ClienteView, 'etapa_kanban'>>(lista: T[]): Record<EtapaKanban, T[]> {
  const g: Record<EtapaKanban, T[]> = { novas: [], em_conversa: [], comprou: [], ativa: [], recompra: [], sumidas: [], sem_interesse: [] }
  for (const c of lista) g[c.etapa_kanban].push(c)
  return g
}
