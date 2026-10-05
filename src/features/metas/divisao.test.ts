import { describe, expect, it } from 'vitest'
import { dividirIgualmente, somar } from './divisao'

describe('divisão da meta', () => {
  it('partes iguais em reais inteiros, somando o total', () => {
    expect(dividirIgualmente(25000, 3)).toEqual([8334, 8333, 8333])
    expect(somar(dividirIgualmente(25000, 3))).toBe(25000)
    expect(dividirIgualmente(30000, 2)).toEqual([15000, 15000])
    expect(dividirIgualmente(100, 0)).toEqual([])
  })
  it('soma ignora vazios', () => {
    expect(somar([100, null, 50, undefined])).toBe(150)
  })
})
