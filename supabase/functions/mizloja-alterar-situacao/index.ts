// MIZ Loja · mizloja-alterar-situacao
// tipo 'usuaria': ADM ativa/desativa vendedora da própria loja; Admin Miz ativa/desativa a ADM.
// tipo 'loja':    só Admin Miz; desativar bloqueia todas as usuárias da loja.
// tipo 'admin':   só Admin Miz; nunca a si mesma.
// Desativar também bloqueia o login no Auth (a sessão aberta não renova e o RLS já corta os dados).
import { ErroHttp, json, lerCorpo, servir } from '../_shared/http.ts'
import { clienteAdmin, exigirAdminMiz, quemChama } from '../_shared/supabase.ts'
import { bloquearLogin } from '../_shared/acesso.ts'

interface Corpo {
  tipo?: 'usuaria' | 'loja' | 'admin'
  id?: string
  situacao?: 'ativa' | 'inativa'
}

servir(async (req) => {
  const admin = clienteAdmin()
  const quem = await quemChama(req, admin)
  const { tipo, id, situacao } = await lerCorpo<Corpo>(req)
  if (!id || !tipo) throw new ErroHttp('Dados inválidos.')
  if (situacao !== 'ativa' && situacao !== 'inativa') throw new ErroHttp('Escolha ativar ou desativar.')
  const desativar = situacao === 'inativa'

  if (tipo === 'usuaria') {
    const { data: u } = await admin.from('mizloja_usuarias').select('id, perfil, loja_id').eq('id', id).maybeSingle()
    if (!u) throw new ErroHttp('Pessoa não encontrada.', 404)
    if (u.id === quem.id) throw new ErroHttp('Você não pode desativar o seu próprio acesso.', 409)
    const permitido =
      (quem.papel === 'admin_miz' && u.perfil === 'adm') ||
      (quem.papel === 'adm' && u.perfil === 'vendedora' && u.loja_id === quem.lojaId)
    if (!permitido) throw new ErroHttp('Acesso não autorizado.', 403)
    await bloquearLogin(admin, u.id, desativar)
    const { error } = await admin.from('mizloja_usuarias').update({ situacao }).eq('id', u.id)
    if (error) throw new ErroHttp('Não foi possível alterar a situação. Tente de novo.', 500)
    return json(req, { ok: true, afetadas: 1 })
  }

  exigirAdminMiz(quem)

  if (tipo === 'admin') {
    if (id === quem.id) throw new ErroHttp('Você não pode desativar o seu próprio acesso.', 409)
    const { data: a } = await admin.from('mizloja_admins').select('id').eq('id', id).maybeSingle()
    if (!a) throw new ErroHttp('Admin não encontrado.', 404)
    await bloquearLogin(admin, a.id, desativar)
    const { error } = await admin.from('mizloja_admins').update({ ativo: !desativar }).eq('id', a.id)
    if (error) throw new ErroHttp('Não foi possível alterar a situação. Tente de novo.', 500)
    return json(req, { ok: true, afetadas: 1 })
  }

  if (tipo === 'loja') {
    const { data: loja } = await admin.from('mizloja_lojas').select('id').eq('id', id).maybeSingle()
    if (!loja) throw new ErroHttp('Loja não encontrada.', 404)
    // Ao reativar a loja, só volta o login de quem continua ativa na loja
    const { data: usuarias } = await admin.from('mizloja_usuarias').select('id, situacao').eq('loja_id', loja.id)
    const alvo = (usuarias ?? []).filter((u) => desativar || u.situacao === 'ativa')
    for (const u of alvo) await bloquearLogin(admin, u.id, desativar)
    const { error } = await admin.from('mizloja_lojas').update({ situacao }).eq('id', loja.id)
    if (error) throw new ErroHttp('Não foi possível alterar a situação da loja. Tente de novo.', 500)
    return json(req, { ok: true, afetadas: alvo.length })
  }

  throw new ErroHttp('Dados inválidos.')
})
