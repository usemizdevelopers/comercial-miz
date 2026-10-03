import { mensagemDeErro } from './erros'

describe('mensagemDeErro', () => {
  it('rede', () => {
    expect(mensagemDeErro(new TypeError('Failed to fetch'))).toBe('Sem conexão. Confira a internet e tente de novo.')
  })
  it('login errado nunca diz qual campo', () => {
    expect(mensagemDeErro({ message: 'Invalid login credentials', status: 400 })).toBe('Usuário ou senha incorretos')
  })
  it('senha igual à provisória', () => {
    expect(mensagemDeErro({ code: 'same_password', message: 'New password should be different from the old password.' })).toBe(
      'A nova senha precisa ser diferente da senha provisória.',
    )
  })
  it('WhatsApp duplicado', () => {
    expect(
      mensagemDeErro({
        code: '23505',
        message: 'duplicate key value violates unique constraint "mizloja_clientes_whatsapp_uk"',
      }),
    ).toBe('Esse WhatsApp já está cadastrado nesta loja.')
  })
  it('CNPJ duplicado', () => {
    expect(mensagemDeErro({ code: '23505', message: 'duplicate key value violates unique constraint "mizloja_lojas_cnpj_key"' })).toBe(
      'Já existe uma loja com esse CNPJ.',
    )
  })
  it('RLS', () => {
    expect(mensagemDeErro({ code: '42501', message: 'new row violates row-level security policy for table "mizloja_clientes"' })).toBe(
      'Você não tem permissão para fazer isso.',
    )
  })
  it('mensagem própria do banco passa direto', () => {
    expect(mensagemDeErro({ code: '42501', message: 'Você só pode lançar vendas no seu nome.' })).toBe(
      'Você só pode lançar vendas no seu nome.',
    )
    expect(mensagemDeErro({ code: '23514', message: 'A peça Blusa Mia não tem o tamanho GG.' })).toBe(
      'A peça Blusa Mia não tem o tamanho GG.',
    )
  })
  it('desconhecido', () => {
    expect(mensagemDeErro({ code: 'XX000', message: 'internal error' })).toBe('Não deu certo. Tente de novo.')
    expect(mensagemDeErro(null)).toBe('Não deu certo. Tente de novo.')
  })
})
