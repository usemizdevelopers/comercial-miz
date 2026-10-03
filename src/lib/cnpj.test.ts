import { mascararCnpj, validarCnpj } from './cnpj'

describe('validarCnpj', () => {
  it('aceita CNPJs válidos com ou sem máscara', () => {
    expect(validarCnpj('11.222.333/0001-81')).toBe(true)
    expect(validarCnpj('11444777000161')).toBe(true)
  })
  it('recusa dígito verificador errado', () => {
    expect(validarCnpj('11.222.333/0001-82')).toBe(false)
    expect(validarCnpj('11444777000160')).toBe(false)
  })
  it('recusa tamanho errado e dígitos repetidos', () => {
    expect(validarCnpj('1122233300018')).toBe(false)
    expect(validarCnpj('11111111111111')).toBe(false)
    expect(validarCnpj('')).toBe(false)
  })
})

describe('mascararCnpj', () => {
  it('máscara progressiva', () => {
    expect(mascararCnpj('11')).toBe('11')
    expect(mascararCnpj('112')).toBe('11.2')
    expect(mascararCnpj('11222333')).toBe('11.222.333')
    expect(mascararCnpj('112223330001')).toBe('11.222.333/0001')
    expect(mascararCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(mascararCnpj('11222333000181999')).toBe('11.222.333/0001-81')
  })
})
