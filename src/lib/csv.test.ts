import { describe, expect, it } from 'vitest'
import { gerarCsv } from './csv'

describe('gerarCsv', () => {
  it('separador ponto e vírgula, vírgula decimal e aspas', () => {
    const csv = gerarCsv(
      [{ nome: 'Ana; "Paula"', total: 1186.4 }, { nome: 'Bia', total: null }],
      [
        { titulo: 'Nome', valor: (l) => l.nome },
        { titulo: 'Total gasto', valor: (l) => l.total },
      ],
    )
    expect(csv).toBe('﻿Nome;Total gasto\r\n"Ana; ""Paula""";1186,4\r\nBia;')
  })
})
