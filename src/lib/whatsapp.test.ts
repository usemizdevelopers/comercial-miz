import {
  formatarWhatsapp,
  linkWhatsapp,
  mascararWhatsapp,
  montarMensagem,
  normalizarWhatsapp,
  primeiroNome,
  whatsappValido,
} from './whatsapp'

describe('normalizarWhatsapp (igual à função do banco)', () => {
  it('11 dígitos recebe 55', () => expect(normalizarWhatsapp('(31) 99999-8888')).toBe('5531999998888'))
  it('10 dígitos (fixo) recebe 55', () => expect(normalizarWhatsapp('31 3333-0001')).toBe('553133330001'))
  it('já com 55 fica igual', () => expect(normalizarWhatsapp('+55 31 99999-8888')).toBe('5531999998888'))
  it('vazio vira null', () => {
    expect(normalizarWhatsapp('')).toBeNull()
    expect(normalizarWhatsapp(null)).toBeNull()
    expect(normalizarWhatsapp('abc')).toBeNull()
  })
  it('outros tamanhos ficam só com dígitos', () => expect(normalizarWhatsapp('9999')).toBe('9999'))
})

describe('mascararWhatsapp', () => {
  it('máscara progressiva', () => {
    expect(mascararWhatsapp('3')).toBe('(3')
    expect(mascararWhatsapp('31')).toBe('(31')
    expect(mascararWhatsapp('319')).toBe('(31) 9')
    expect(mascararWhatsapp('3199999')).toBe('(31) 9999-9')
    expect(mascararWhatsapp('3133330001')).toBe('(31) 3333-0001')
    expect(mascararWhatsapp('31999998888')).toBe('(31) 99999-8888')
  })
  it('limita a 11 dígitos e aceita colar com +55', () => {
    expect(mascararWhatsapp('319999988887777')).toBe('(31) 99999-8888')
    expect(mascararWhatsapp('+55 (31) 99999-8888')).toBe('(31) 99999-8888')
  })
  it('vazio', () => expect(mascararWhatsapp('')).toBe(''))
})

describe('formatarWhatsapp', () => {
  it('exibe o número guardado', () => {
    expect(formatarWhatsapp('5531999998888')).toBe('(31) 99999-8888')
    expect(formatarWhatsapp('553133330001')).toBe('(31) 3333-0001')
  })
  it('número fora do padrão volta só com dígitos', () => expect(formatarWhatsapp('12345')).toBe('12345'))
})

describe('whatsappValido', () => {
  it('aceita DDD + 8 ou 9 dígitos', () => {
    expect(whatsappValido('(31) 99999-8888')).toBe(true)
    expect(whatsappValido('3133330001')).toBe(true)
  })
  it('recusa curto ou vazio', () => {
    expect(whatsappValido('99999-8888')).toBe(false)
    expect(whatsappValido('')).toBe(false)
  })
})

describe('linkWhatsapp', () => {
  it('sem texto', () => expect(linkWhatsapp('(31) 99999-8888')).toBe('https://wa.me/5531999998888'))
  it('com texto codificado', () =>
    expect(linkWhatsapp('31999998888', 'Oi, Ana! Tudo bem?')).toBe(
      'https://wa.me/5531999998888?text=Oi%2C%20Ana!%20Tudo%20bem%3F',
    ))
  it('quebra de linha codificada', () =>
    expect(linkWhatsapp('31999998888', 'a\nb')).toBe('https://wa.me/5531999998888?text=a%0Ab'))
})

describe('montarMensagem', () => {
  it('troca [NOME] pelo primeiro nome e [LOJA] pela loja', () => {
    expect(montarMensagem('Feliz aniversário, [NOME]! Equipe da [LOJA].', { nome: '  Ana Paula Ribeiro', loja: 'Bella Moda ' })).toBe(
      'Feliz aniversário, Ana! Equipe da Bella Moda.',
    )
  })
  it('troca todas as ocorrências', () => {
    expect(montarMensagem('[NOME] [NOME]', { nome: 'Júlia' })).toBe('Júlia Júlia')
  })
  it('primeiroNome', () => expect(primeiroNome('Carla   Souza')).toBe('Carla'))
})
