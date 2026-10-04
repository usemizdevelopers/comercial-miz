import { describe, expect, it, vi } from 'vitest'
import { agruparPorEtapa, filtrarClientes, opcoesMover } from './kanban'
import type { ClienteView } from './api'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

const c = (p: Partial<ClienteView>) =>
  ({ nome: 'Ana', whatsapp: '5531999998888', vendedora_id: 'u1', status: 'ativa', dias_para_aniversario: 100, etapa_kanban: 'ativa', num_compras: 1, ...p }) as ClienteView

describe('kanban', () => {
  it('opções de mover', () => {
    expect(opcoesMover(c({ num_compras: 0, etapa_kanban: 'novas' })).map((o) => o.etapa)).toEqual(['novas', 'em_conversa', 'sem_interesse'])
    expect(opcoesMover(c({ num_compras: 2, etapa_kanban: 'recompra' })).map((o) => o.etapa)).toEqual(['sem_interesse'])
    expect(opcoesMover(c({ num_compras: 2, etapa_kanban: 'sem_interesse' })).map((o) => o.etapa)).toEqual([null])
  })

  it('filtros', () => {
    const lista = [
      c({ nome: 'Júlia Prado' }),
      c({ nome: 'Bia', vendedora_id: 'u2', status: 'vip' }),
      c({ nome: 'Carla', whatsapp: '5531977776666', status: 'nova', dias_para_aniversario: 2 }),
    ]
    const base = { busca: '', soMinhas: false, minhaId: 'u1', selo: null }
    expect(filtrarClientes(lista, { ...base, busca: 'julia' }).map((x) => x.nome)).toEqual(['Júlia Prado'])
    expect(filtrarClientes(lista, { ...base, busca: '7776' }).map((x) => x.nome)).toEqual(['Carla'])
    expect(filtrarClientes(lista, { ...base, soMinhas: true })).toHaveLength(2)
    expect(filtrarClientes(lista, { ...base, selo: 'vip' }).map((x) => x.nome)).toEqual(['Bia'])
    expect(filtrarClientes(lista, { ...base, selo: 'aniversario' }).map((x) => x.nome)).toEqual(['Carla'])
    expect(filtrarClientes(lista, { ...base, selo: 'nova' }).map((x) => x.nome)).toEqual(['Carla'])
  })

  it('agrupa por etapa', () => {
    const g = agruparPorEtapa([c({ etapa_kanban: 'novas' }), c({ etapa_kanban: 'novas' }), c({ etapa_kanban: 'sumidas' })])
    expect(g.novas).toHaveLength(2)
    expect(g.sumidas).toHaveLength(1)
    expect(g.comprou).toHaveLength(0)
  })
})
