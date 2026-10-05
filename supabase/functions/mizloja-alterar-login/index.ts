// MIZ Loja · mizloja-alterar-login
// Troca o WhatsApp de acesso de uma usuária: muda WhatsApp, usuário e e-mail técnico juntos,
// gera nova senha provisória (troca obrigatória no próximo acesso) e devolve a mensagem de acesso.
// ADM: vendedoras da própria loja. Admin Miz: a dona (ADM) de qualquer loja.
// (Admin Miz não troca o próprio número: cria um admin novo e desativa o antigo.)
import { ErroHttp, json, lerCorpo, servir } from '../_shared/http.ts'
import { clienteAdmin, quemChama } from '../_shared/supabase.ts'
import { emailTecnico, gerarSenha, mensagemAcesso, normalizarWhatsapp, usuarioEmUso, whatsappValido } from '../_shared/acesso.ts'

servir(async (req) => {
  const admin = clienteAdmin()
  const quem = await quemChama(req, admin)
  const corpo = await lerCorpo<{ usuario_id?: string; whatsapp?: string }>(req)
  if (!corpo.usuario_id) throw new ErroHttp('Escolha a pessoa.')
  if (corpo.usuario_id === quem.id) throw new ErroHttp('Você não pode trocar o seu próprio acesso por aqui.', 409)
  const novo = normalizarWhatsapp(corpo.whatsapp)
  if (!whatsappValido(novo)) throw new ErroHttp('Digite o WhatsApp com DDD.')

  const { data: u } = await admin
    .from('mizloja_usuarias')
    .select('id, nome, usuario, whatsapp, perfil, situacao, loja_id, mizloja_lojas(nome)')
    .eq('id', corpo.usuario_id)
    .maybeSingle()
  if (!u) throw new ErroHttp('Pessoa não encontrada.', 404)
  const permitido =
    (quem.papel === 'admin_miz' && u.perfil === 'adm') ||
    (quem.papel === 'adm' && u.perfil === 'vendedora' && u.loja_id === quem.lojaId)
  if (!permitido) throw new ErroHttp('Acesso não autorizado.', 403)
  if (u.situacao !== 'ativa') throw new ErroHttp('Reative o acesso antes de trocar o WhatsApp.', 409)
  if (novo === u.usuario) throw new ErroHttp('Esse já é o WhatsApp de acesso dela.', 409)
  if (await usuarioEmUso(admin, novo)) throw new ErroHttp('Esse WhatsApp já tem acesso ao MIZ Loja.', 409)

  const senha = gerarSenha()
  const { error: erroAuth } = await admin.auth.admin.updateUserById(u.id, {
    email: emailTecnico(novo),
    email_confirm: true,
    password: senha,
  })
  if (erroAuth) {
    console.error(erroAuth)
    if (/already been registered|already exists/i.test(erroAuth.message)) throw new ErroHttp('Esse WhatsApp já tem acesso ao MIZ Loja.', 409)
    throw new ErroHttp('Não foi possível trocar o acesso. Tente de novo.', 500)
  }

  const { error } = await admin
    .from('mizloja_usuarias')
    .update({ whatsapp: novo, usuario: novo, precisa_trocar_senha: true })
    .eq('id', u.id)
  if (error) {
    console.error(error)
    // desfaz o e-mail técnico para o login antigo continuar valendo
    await admin.auth.admin.updateUserById(u.id, { email: emailTecnico(u.usuario), email_confirm: true })
    if (error.code === '23505') throw new ErroHttp('Esse WhatsApp já tem acesso ao MIZ Loja.', 409)
    throw new ErroHttp('Não foi possível trocar o acesso. Tente de novo.', 500)
  }

  const loja = (u.mizloja_lojas as unknown as { nome: string } | null)?.nome ?? null
  return json(req, {
    usuario: novo,
    senha,
    whatsapp: novo,
    nome: u.nome,
    mensagem: mensagemAcesso({ nome: u.nome, loja, usuario: novo, senha }),
  })
})
