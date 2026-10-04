import { describe, expect, it } from 'vitest'
import { faltaParaMeta, faltaParaPremio, type ResumoMes } from './api'

const base: ResumoMes = {
  mes: '2026-10-01',
  meta_individual: 6000,
  meta_loja: null,
  vendido_loja: null,
  vendido: 4320,
  num_vendas: 23,
  ticket_medio: 187.83,
  clientes_novas: 2,
  dias_restantes: 9,
  valor_por_dia: 186.67,
  premio_descricao: 'R$ 200 em compras',
  premio_condicao_pct: 100,
  premio_extra_descricao: 'Folga no sábado',
  premio_extra_pct: 120,
  premio_conquistado: false,
  premio_extra_conquistado: false,
}

describe('faltas da meta', () => {
  it('meta e prêmios', () => {
    expect(faltaParaMeta(base)).toBe(1680)
    expect(faltaParaPremio(base)).toBe(1680)
    expect(faltaParaPremio(base, true)).toBe(2880)
  })
  it('sem meta individual ou sem prêmio', () => {
    expect(faltaParaMeta({ ...base, meta_individual: null })).toBeNull()
    expect(faltaParaPremio({ ...base, premio_descricao: null })).toBeNull()
    expect(faltaParaMeta({ ...base, vendido: 7000 })).toBe(0)
  })
})
