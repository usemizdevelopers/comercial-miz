// MIZ Loja · mizloja-nova-senha
// Admin Miz: para ADM ou para outro Admin Miz. ADM: para vendedora da própria loja.
// Gera nova senha provisória, marca troca obrigatória e devolve a mensagem de acesso.
import { ErroHttp, json, lerCorpo, servir } from '../_shared/http.ts'
import { clienteAdmin, quemChama } from '../_shared/supabase.ts'
import { gerarSenha, mensagemAcesso } from '../_shared/acesso.ts'

servir(async (req) => {
  const admin = clienteAdmin()
  const quem = await quemChama(req, admin)
  const { usuario_id } = await lerCorpo<{ usuario_id?: string }>(req)
  if (!usuario_id) throw new ErroHttp('Escolha a pessoa.')
  if (usuario_id === quem.id) throw new ErroHttp('Para trocar a sua própria senha, use o Perfil.', 409)

  let alvo: { id: string; nome: string; usuario: string; whatsapp: string; loja: string | null; tabela: 'mizloja_usuarias' | 'mizloja_admins' }

  const { data: a } = await admin.from('mizloja_admins').select('id, nome, usuario, whatsapp, ativo').eq('id', usuario_id).maybeSingle()
  if (a) {
    if (quem.papel !== 'admin_miz') throw new ErroHttp('Acesso não autorizado.', 403)
    if (!a.usuario) throw new ErroHttp('Esse admin ainda não tem usuário de acesso.', 409)
    alvo = { id: a.id, nome: a.nome, usuario: a.usuario, whatsapp: a.whatsapp ?? a.usuario, loja: null, tabela: 'mizloja_admins' }
  } else {
    const { data: u } = await admin
      .from('mizloja_usuarias')
      .select('id, nome, usuario, whatsapp, perfil, loja_id, mizloja_lojas(nome)')
      .eq('id', usuario_id)
      .maybeSingle()
    if (!u) throw new ErroHttp('Pessoa não encontrada.', 404)
    const permitido =
      (quem.papel === 'admin_miz' && u.perfil === 'adm') ||
      (quem.papel === 'adm' && u.perfil === 'vendedora' && u.loja_id === quem.lojaId)
    if (!permitido) throw new ErroHttp('Acesso não autorizado.', 403)
    const loja = (u.mizloja_lojas as unknown as { nome: string } | null)?.nome ?? null
    alvo = { id: u.id, nome: u.nome, usuario: u.usuario, whatsapp: u.whatsapp, loja, tabela: 'mizloja_usuarias' }
  }

  const senha = gerarSenha()
  const { error: erroAuth } = await admin.auth.admin.updateUserById(alvo.id, { password: senha })
  if (erroAuth) {
    console.error(erroAuth)
    throw new ErroHttp('Não foi possível gerar a nova senha. Tente de novo.', 500)
  }
  const { error } = await admin.from(alvo.tabela).update({ precisa_trocar_senha: true }).eq('id', alvo.id)
  if (error) {
    console.error(error)
    throw new ErroHttp('Não foi possível gerar a nova senha. Tente de novo.', 500)
  }

  return json(req, {
    usuario: alvo.usuario,
    senha,
    whatsapp: alvo.whatsapp,
    nome: alvo.nome,
    mensagem: mensagemAcesso({ nome: alvo.nome, loja: alvo.loja, usuario: alvo.usuario, senha }),
  })
})
