import { describe, expect, it } from 'vitest'
import { instanteDaVenda, resumirItens, rotuloPagamento, textoItem, totalPecas } from './vendas'
import { dataLocal } from './formatadores'

describe('vendas', () => {
  const blusa = { tipo: 'miz', peca_nome: 'Blusa Mia', cor: 'Preta', tamanho: 'M', quantidade: 1 }
  const outra = { tipo: 'outra', cor: 'Azul bebê', tamanho: 'Unico', quantidade: 2 }

  it('texto do item', () => {
    expect(textoItem(blusa)).toBe('Blusa Mia · Preta · M · 1')
    expect(textoItem(outra)).toBe('Outra marca · Azul bebê · Único · 2')
  })

  it('resumo dos itens', () => {
    expect(resumirItens([blusa])).toBe('Blusa Mia Preta M')
    expect(resumirItens([blusa, { ...outra, quantidade: 1 }])).toBe('Blusa Mia Preta M + 1 peça')
    expect(resumirItens([{ ...blusa, quantidade: 2 }, outra])).toBe('Blusa Mia Preta M + 3 peças')
    expect(resumirItens([outra])).toBe('Peça Azul bebê Único + 1 peça')
    expect(resumirItens([])).toBe('')
    expect(totalPecas([blusa, outra])).toBe(3)
  })

  it('rótulo do pagamento', () => {
    expect(rotuloPagamento('cartao_credito')).toBe('Cartão de crédito')
    expect(rotuloPagamento('x')).toBe('')
  })

  it('instante da venda no fuso de São Paulo', () => {
    const agora = new Date('2026-10-04T01:30:00Z') // 03/10 22:30 em São Paulo
    expect(instanteDaVenda(0, agora)).toBe(agora.toISOString())
    const ontem = instanteDaVenda(1, agora)
    expect(ontem).toBe('2026-10-02T15:00:00.000Z')
    expect(dataLocal(ontem).getDate()).toBe(2)
  })
})
