// MIZ Loja · mizloja-criar-admin (só Admin Miz)
// Cria outro Admin Miz com e-mail técnico e senha provisória (troca obrigatória no 1º acesso).
import { ErroHttp, json, lerCorpo, servir } from '../_shared/http.ts'
import { clienteAdmin, exigirAdminMiz, quemChama } from '../_shared/supabase.ts'
import { criarContaAuth, gerarSenha, mensagemAcesso, usuarioEmUso } from '../_shared/acesso.ts'
import { validarNomeWhatsapp } from '../_shared/usuarias.ts'

servir(async (req) => {
  const admin = clienteAdmin()
  const quem = await quemChama(req, admin)
  exigirAdminMiz(quem)
  const corpo = await lerCorpo<{ nome?: string; whatsapp?: string }>(req)
  const { nome, whatsapp } = validarNomeWhatsapp(corpo.nome, corpo.whatsapp)
  if (await usuarioEmUso(admin, whatsapp)) throw new ErroHttp('Esse WhatsApp já tem acesso ao MIZ Loja.', 409)

  const senha = gerarSenha()
  const userId = await criarContaAuth(admin, whatsapp, nome, senha)
  const { error } = await admin.from('mizloja_admins').insert({
    id: userId,
    nome,
    whatsapp,
    usuario: whatsapp,
    precisa_trocar_senha: true,
    criado_por: quem.id,
  })
  if (error) {
    await admin.auth.admin.deleteUser(userId)
    console.error(error)
    throw new ErroHttp('Não foi possível criar o admin. Tente de novo.', 500)
  }
  return json(req, {
    admin_id: userId,
    usuario: whatsapp,
    senha,
    whatsapp,
    nome,
    mensagem: mensagemAcesso({ nome, loja: null, usuario: whatsapp, senha }),
  })
})
