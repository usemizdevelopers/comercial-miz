import { describe, expect, it } from 'vitest'
import { apagarRascunho, ESTADO_INICIAL, guardarRascunho, lerRascunho, nomeDoRascunho } from './rascunho'

describe('rascunho da venda', () => {
  it('só guarda quando tem conteúdo e lê de volta', () => {
    guardarRascunho('u1', ESTADO_INICIAL)
    expect(lerRascunho('u1')).toBeNull()
    const e = { ...ESTADO_INICIAL, passo: 2 as const, novaNome: 'Ana Paula' }
    guardarRascunho('u1', e)
    expect(lerRascunho('u1')?.passo).toBe(2)
    expect(nomeDoRascunho(e)).toBe('Ana Paula')
    expect(lerRascunho('u2')).toBeNull()
    // formulário vazio (ex.: Nova venda pela ficha) não apaga o rascunho anterior
    guardarRascunho('u1', ESTADO_INICIAL)
    expect(lerRascunho('u1')?.novaNome).toBe('Ana Paula')
    apagarRascunho('u1')
    expect(lerRascunho('u1')).toBeNull()
  })
})
