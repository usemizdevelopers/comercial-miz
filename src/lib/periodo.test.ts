import { describe, expect, it } from 'vitest'
import { mesIso, nomeMes, periodoDoPreset, periodoValido, rotuloPeriodo, variacao } from './periodo'

const agora = new Date('2026-10-04T01:30:00Z') // 03/10 22:30 em São Paulo

describe('periodo', () => {
  it('presets no fuso de São Paulo', () => {
    expect(periodoDoPreset('hoje', agora)).toEqual({ inicio: '2026-10-03', fim: '2026-10-03' })
    expect(periodoDoPreset('7dias', agora)).toEqual({ inicio: '2026-09-27', fim: '2026-10-03' })
    expect(periodoDoPreset('mes', agora)).toEqual({ inicio: '2026-10-01', fim: '2026-10-03' })
    expect(periodoDoPreset('mes_passado', agora)).toEqual({ inicio: '2026-09-01', fim: '2026-09-30' })
  })
  it('validação e rótulos', () => {
    expect(periodoValido({ inicio: '2026-10-01', fim: '2026-10-03' })).toBe(true)
    expect(periodoValido({ inicio: '2026-10-05', fim: '2026-10-03' })).toBe(false)
    expect(rotuloPeriodo({ inicio: '2026-10-01', fim: '2026-10-15' })).toBe('1 a 15 de out')
    expect(mesIso('2026-10-15', -1)).toBe('2026-09-01')
    expect(nomeMes('2026-10-01')).toBe('Outubro de 2026')
  })
  it('variação em texto', () => {
    expect(variacao(112, 100)).toBe('+12% vs. período anterior')
    expect(variacao(90, 100)).toBe('−10% vs. período anterior')
    expect(variacao(100, 100)).toBe('igual ao período anterior')
    expect(variacao(50, 0)).toBe('sem vendas no período anterior')
    expect(variacao(45.2, 42, 'pontos')).toBe('+3,2 p.p. vs. período anterior')
    expect(variacao(null, 10)).toBe('sem dados')
  })
})
