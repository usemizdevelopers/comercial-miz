import { dataRelativa, formatarAniversario, formatarData, formatarDiaMesCurto, formatarMoeda, formatarValor, haDias, saudacao } from './formatadores'

const nbsp = ' '

describe('formatarMoeda', () => {
  it('tabela com centavos', () => {
    expect(formatarMoeda(1680)).toBe(`R$${nbsp}1.680,00`)
    expect(formatarMoeda('289.8')).toBe(`R$${nbsp}289,80`)
    expect(formatarMoeda(null)).toBe(`R$${nbsp}0,00`)
  })
  it('destaque sem centavos quando são zero', () => {
    expect(formatarMoeda(1680, { destaque: true })).toBe(`R$${nbsp}1.680`)
    expect(formatarMoeda(289.8, { destaque: true })).toBe(`R$${nbsp}289,80`)
  })
  it('formatarValor tira o R$', () => expect(formatarValor(1680, { destaque: true })).toBe('1.680'))
})

describe('datas (fuso de São Paulo)', () => {
  // 03/10/2026 12:00 em São Paulo = 15:00 UTC
  const agora = new Date('2026-10-03T15:00:00Z')

  it('formatarData', () => expect(formatarData('2026-10-03T02:00:00Z')).toBe('02/10/2026'))
  it('hoje e ontem', () => {
    expect(dataRelativa('2026-10-03T13:00:00Z', agora)).toBe('hoje')
    expect(dataRelativa('2026-10-02T13:00:00Z', agora)).toBe('ontem')
  })
  it('há N dias até 7', () => {
    expect(dataRelativa('2026-09-30T13:00:00Z', agora)).toBe('há 3 dias')
    expect(dataRelativa('2026-09-26T13:00:00Z', agora)).toBe('há 7 dias')
  })
  it('depois de 7 dias, "12 de set."', () => {
    expect(dataRelativa('2026-09-12T13:00:00Z', agora)).toBe('12 de set.')
    expect(formatarDiaMesCurto('2026-10-06T13:00:00Z')).toBe('6 de out.')
  })
  it('meia-noite em São Paulo conta no dia certo', () => {
    // 02:30 UTC de 03/10 = 23:30 de 02/10 em São Paulo
    expect(dataRelativa('2026-10-03T02:30:00Z', agora)).toBe('ontem')
  })
  it('haDias sem limite', () => expect(haDias('2026-08-10T13:00:00Z', agora)).toBe('há 54 dias'))
})

describe('formatarAniversario', () => {
  it('dia e mês por extenso', () => {
    expect(formatarAniversario(6, 10)).toBe('6 de outubro')
    expect(formatarAniversario(29, 2, 1992)).toBe('29 de fevereiro de 1992')
    expect(formatarAniversario(null, 3)).toBe('')
  })
})

describe('saudacao', () => {
  it('pelo horário de São Paulo', () => {
    expect(saudacao(new Date('2026-10-03T11:00:00Z'))).toBe('Bom dia') // 8h
    expect(saudacao(new Date('2026-10-03T18:30:00Z'))).toBe('Boa tarde') // 15h30
    expect(saudacao(new Date('2026-10-04T01:00:00Z'))).toBe('Boa noite') // 22h
  })
})
