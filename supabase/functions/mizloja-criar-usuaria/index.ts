// MIZ Loja · mizloja-criar-usuaria
// Admin Miz cria a ADM de uma loja; ADM cria vendedora da própria loja. Vendedora não cria ninguém.
import { ErroHttp, json, lerCorpo, servir } from '../_shared/http.ts'
import { clienteAdmin, quemChama } from '../_shared/supabase.ts'
import { criarUsuaria, validarNomeWhatsapp } from '../_shared/usuarias.ts'

interface Corpo {
  loja_id?: string
  perfil?: 'adm' | 'vendedora'
  nome?: string
  whatsapp?: string
}

servir(async (req) => {
  const admin = clienteAdmin()
  const quem = await quemChama(req, admin)
  const corpo = await lerCorpo<Corpo>(req)
  const dados = validarNomeWhatsapp(corpo.nome, corpo.whatsapp)

  let lojaId: string
  let lojaNome: string
  let perfil: 'adm' | 'vendedora'

  if (quem.papel === 'admin_miz') {
    if (corpo.perfil !== 'adm') throw new ErroHttp('O time Miz cria só a dona (ADM) da loja.', 403)
    if (!corpo.loja_id) throw new ErroHttp('Escolha a loja.')
    const { data: loja } = await admin.from('mizloja_lojas').select('id, nome, situacao').eq('id', corpo.loja_id).maybeSingle()
    if (!loja) throw new ErroHttp('Loja não encontrada.', 404)
    if (loja.situacao !== 'ativa') throw new ErroHttp('A loja está desativada.', 409)
    // v1: uma ADM ativa por loja
    const { count } = await admin
      .from('mizloja_usuarias')
      .select('id', { count: 'exact', head: true })
      .eq('loja_id', loja.id)
      .eq('perfil', 'adm')
      .eq('situacao', 'ativa')
    if ((count ?? 0) > 0) throw new ErroHttp('Essa loja já tem uma dona ativa.', 409)
    lojaId = loja.id
    lojaNome = loja.nome
    perfil = 'adm'
  } else if (quem.papel === 'adm') {
    if (corpo.perfil && corpo.perfil !== 'vendedora') throw new ErroHttp('A dona da loja cria só vendedoras.', 403)
    if (corpo.loja_id && corpo.loja_id !== quem.lojaId) throw new ErroHttp('Você só pode criar vendedoras da sua loja.', 403)
    lojaId = quem.lojaId
    lojaNome = quem.lojaNome
    perfil = 'vendedora'
  } else {
    throw new ErroHttp('Só a dona da loja pode criar acessos.', 403)
  }

  const acesso = await criarUsuaria(admin, { lojaId, lojaNome, perfil, nome: dados.nome, whatsapp: dados.whatsapp, criadoPor: quem.id })
  return json(req, acesso)
})
