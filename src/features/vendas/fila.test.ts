import { beforeEach, describe, expect, it, vi } from 'vitest'
import { enviarFila, guardarNaFila, tirarDaFila, vendasNaFila } from './fila'
import type { PacoteVenda } from './api'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

const pacote = (id: string): PacoteVenda => ({
  venda_id: id,
  cliente_id: 'c1',
  valor_total: 100,
  forma_pagamento: 'pix',
  itens: [{ tipo: 'outra', cor: 'Azul', tamanho: 'M', quantidade: 1 }],
  data_venda: '2026-10-03T12:00:00.000Z',
  cliente_nova: null,
})

describe('fila de vendas sem conexão', () => {
  beforeEach(() => {
    for (const v of vendasNaFila()) tirarDaFila(v.pacote.venda_id)
  })

  it('guarda sem repetir a mesma venda', () => {
    guardarNaFila({ pacote: pacote('v1'), usuariaId: 'u1', clienteNome: 'Ana', criadaEm: '' })
    guardarNaFila({ pacote: pacote('v1'), usuariaId: 'u1', clienteNome: 'Ana', criadaEm: '' })
    expect(vendasNaFila()).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem('mizloja-fila-vendas') ?? '[]')).toHaveLength(1)
  })

  it('envia só as da usuária, para no erro de rede e anota erro do banco', async () => {
    guardarNaFila({ pacote: pacote('a'), usuariaId: 'u1', clienteNome: 'Ana', criadaEm: '' })
    guardarNaFila({ pacote: pacote('b'), usuariaId: 'u2', clienteNome: 'Bia', criadaEm: '' })
    guardarNaFila({ pacote: pacote('c'), usuariaId: 'u1', clienteNome: 'Carla', criadaEm: '' })
    const enviar = vi.fn(async (p: PacoteVenda) => {
      if (p.venda_id === 'c') throw { code: '23514', message: 'Essa cor está desativada.' }
    })
    expect(await enviarFila('u1', enviar)).toBe(1)
    expect(enviar).toHaveBeenCalledTimes(2)
    const resto = vendasNaFila()
    expect(resto.map((v) => v.pacote.venda_id).sort()).toEqual(['b', 'c'])
    expect(resto.find((v) => v.pacote.venda_id === 'c')?.erro).toBe('Essa cor está desativada.')

    const semRede = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    expect(await enviarFila('u2', semRede)).toBe(0)
    expect(vendasNaFila()).toHaveLength(2)
  })
})
