import { describe, expect, it } from 'vitest'
import { descreverAlteracao } from './alteracoes'

const nomes = new Map([
  ['u1', 'Júlia'],
  ['u2', 'Paula'],
])

describe('descreverAlteracao', () => {
  it('edição da venda', () => {
    const l = descreverAlteracao(
      {
        acao: 'edicao',
        antes: { valor_total: 100, forma_pagamento: 'pix', vendedora_id: 'u1', data_venda: '2026-10-03T15:00:00Z' },
        depois: { valor_total: 120.5, forma_pagamento: 'dinheiro', vendedora_id: 'u2', data_venda: '2026-10-03T15:00:00Z' },
        motivo: null,
      },
      nomes,
    )
    expect(l).toEqual(['Valor: R$ 100,00 → R$ 120,50', 'Pagamento: PIX → Dinheiro', 'Vendedora: Júlia → Paula'])
  })
  it('itens e exclusão', () => {
    const item = { tipo: 'outra', cor: 'Bege', tamanho: 'M', quantidade: 1 }
    expect(descreverAlteracao({ acao: 'edicao', antes: null, depois: { item }, motivo: null }, nomes)).toEqual(['Item adicionado: Outra marca · Bege · M · 1'])
    expect(descreverAlteracao({ acao: 'edicao', antes: { item }, depois: null, motivo: null }, nomes)).toEqual(['Item removido: Outra marca · Bege · M · 1'])
    expect(descreverAlteracao({ acao: 'exclusao', antes: {}, depois: {}, motivo: 'lançada duas vezes' }, nomes)).toEqual(['Venda excluída · motivo: lançada duas vezes'])
  })
})
