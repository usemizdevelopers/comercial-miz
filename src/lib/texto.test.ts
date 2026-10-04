import { describe, expect, it } from 'vitest'
import { semAcento } from './texto'

describe('semAcento', () => {
  it('minúsculas, sem acento e sem espaços nas pontas', () => {
    expect(semAcento('  Júlia Conceição ')).toBe('julia conceicao')
    expect(semAcento(null)).toBe('')
  })
})
