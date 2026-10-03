import { emailTecnico } from './acesso'

describe('emailTecnico', () => {
  it('normaliza o WhatsApp digitado', () => {
    expect(emailTecnico('(31) 98481-0586')).toBe('5531984810586@mizloja.usemiz.app')
    expect(emailTecnico('5531984810586')).toBe('5531984810586@mizloja.usemiz.app')
    expect(emailTecnico('+55 31 98481 0586')).toBe('5531984810586@mizloja.usemiz.app')
  })
})
