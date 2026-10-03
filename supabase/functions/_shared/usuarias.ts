// MIZ Loja · criação de ADM/vendedora (usada por mizloja-criar-loja e mizloja-criar-usuaria).
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { ErroHttp } from './http.ts'
import { criarContaAuth, gerarSenha, mensagemAcesso, normalizarWhatsapp, usuarioEmUso, whatsappValido } from './acesso.ts'

export interface NovaUsuaria {
  lojaId: string
  lojaNome: string
  perfil: 'adm' | 'vendedora'
  nome: string
  whatsapp: string
  criadoPor: string
}

export interface AcessoCriado {
  usuaria_id: string
  usuario: string
  senha: string
  whatsapp: string
  nome: string
  mensagem: string
}

export function validarNomeWhatsapp(nome: unknown, whatsapp: unknown): { nome: string; whatsapp: string } {
  const n = String(nome ?? '').trim().replace(/\s+/g, ' ')
  if (n.length < 2) throw new ErroHttp('Digite o nome.')
  const w = normalizarWhatsapp(whatsapp)
  if (!whatsappValido(w)) throw new ErroHttp('Digite o WhatsApp com DDD.')
  return { nome: n, whatsapp: w }
}

/**
 * Cria a conta no Auth e a linha em mizloja_usuarias (precisa_trocar_senha = true).
 * Se a gravação na tabela falhar, apaga a conta recém-criada no Auth.
 * A senha provisória só existe na resposta.
 */
export async function criarUsuaria(admin: SupabaseClient, p: NovaUsuaria): Promise<AcessoCriado> {
  if (await usuarioEmUso(admin, p.whatsapp)) throw new ErroHttp('Esse WhatsApp já tem acesso ao MIZ Loja.', 409)

  const senha = gerarSenha()
  const userId = await criarContaAuth(admin, p.whatsapp, p.nome, senha)

  const { error } = await admin.from('mizloja_usuarias').insert({
    id: userId,
    loja_id: p.lojaId,
    perfil: p.perfil,
    nome: p.nome,
    whatsapp: p.whatsapp,
    usuario: p.whatsapp,
    precisa_trocar_senha: true,
    criado_por: p.criadoPor,
  })
  if (error) {
    await admin.auth.admin.deleteUser(userId)
    console.error(error)
    if (error.code === '23505') throw new ErroHttp('Esse WhatsApp já tem acesso ao MIZ Loja.', 409)
    throw new ErroHttp('Não foi possível criar o acesso. Tente de novo.', 500)
  }

  return {
    usuaria_id: userId,
    usuario: p.whatsapp,
    senha,
    whatsapp: p.whatsapp,
    nome: p.nome,
    mensagem: mensagemAcesso({ nome: p.nome, loja: p.lojaNome, usuario: p.whatsapp, senha }),
  }
}
