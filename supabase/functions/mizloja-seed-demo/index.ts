// MIZ Loja · mizloja-seed-demo (TEMPORÁRIA, só Admin Miz) — ver docs/DEMO.md
//
// acao 'carregar': cria a Loja Demonstração (CNPJ de teste 99.999.999/0001-91), 1 ADM e 2 vendedoras
//                  com senha definida aqui e SEM troca obrigatória. Devolve usuários e senhas (só nesta resposta).
//                  Depois rode supabase/seed-demo/dados.sql (clientes, vendas, contatos, transferência e meta).
// acao 'remover':  apaga SÓ a Loja Demonstração (tudo dela sai em cascata) e as 3 contas dela no Auth.
//
// Publicar com verify_jwt = true. Remover pelo painel do Supabase quando não precisar mais.
import { ErroHttp, json, lerCorpo, servir } from '../_shared/http.ts'
import { clienteAdmin, exigirAdminMiz, quemChama } from '../_shared/supabase.ts'
import { criarContaAuth, emailTecnico, gerarSenha } from '../_shared/acesso.ts'

const CNPJ_DEMO = '99999999000191'

const PESSOAS = [
  { perfil: 'adm', nome: 'Mariana Souza', whatsapp: '5531900001001' },
  { perfil: 'vendedora', nome: 'Júlia Lima', whatsapp: '5531900001002' },
  { perfil: 'vendedora', nome: 'Paula Ribeiro', whatsapp: '5531900001003' },
] as const

servir(async (req) => {
  const admin = clienteAdmin()
  const quem = await quemChama(req, admin)
  exigirAdminMiz(quem)
  const { acao } = await lerCorpo<{ acao?: 'carregar' | 'remover' }>(req)

  const { data: existente } = await admin.from('mizloja_lojas').select('id').eq('cnpj', CNPJ_DEMO).maybeSingle()

  if (acao === 'remover') {
    if (!existente) return json(req, { ok: true, removida: false })
    const { data: usuarias } = await admin.from('mizloja_usuarias').select('id').eq('loja_id', existente.id)
    const { error } = await admin.from('mizloja_lojas').delete().eq('id', existente.id)
    if (error) {
      console.error(error)
      throw new ErroHttp('Não foi possível remover a Loja Demonstração.', 500)
    }
    for (const u of usuarias ?? []) await admin.auth.admin.deleteUser(u.id)
    return json(req, { ok: true, removida: true, contas_removidas: (usuarias ?? []).length })
  }

  if (acao !== 'carregar') throw new ErroHttp('Use acao "carregar" ou "remover".')
  if (existente) throw new ErroHttp('A Loja Demonstração já existe. Remova antes de carregar de novo.', 409)

  const { data: loja, error: erroLoja } = await admin
    .from('mizloja_lojas')
    .insert({ nome: 'Loja Demonstração', cnpj: CNPJ_DEMO, cidade: 'Cidade Demonstração', uf: 'MG', whatsapp: '5531900001000', criado_por: quem.id })
    .select('id')
    .single()
  if (erroLoja || !loja) {
    console.error(erroLoja)
    throw new ErroHttp('Não foi possível criar a Loja Demonstração.', 500)
  }

  const contas: Array<{ perfil: string; nome: string; usuario: string; senha: string }> = []
  const criados: string[] = []
  try {
    for (const p of PESSOAS) {
      const senha = gerarSenha(10)
      const id = await criarContaAuth(admin, p.whatsapp, p.nome, senha)
      criados.push(id)
      const { error } = await admin.from('mizloja_usuarias').insert({
        id,
        loja_id: loja.id,
        perfil: p.perfil,
        nome: p.nome,
        whatsapp: p.whatsapp,
        usuario: p.whatsapp,
        precisa_trocar_senha: false,
        criado_por: quem.id,
      })
      if (error) throw error
      contas.push({ perfil: p.perfil, nome: p.nome, usuario: p.whatsapp, senha })
    }
  } catch (e) {
    console.error(e)
    await admin.from('mizloja_lojas').delete().eq('id', loja.id)
    for (const id of criados) await admin.auth.admin.deleteUser(id)
    throw new ErroHttp('Não foi possível criar as contas da demonstração.', 500)
  }

  return json(req, {
    loja_id: loja.id,
    contas,
    emails_tecnicos: contas.map((c) => emailTecnico(c.usuario)),
    proximo_passo: 'Rode supabase/seed-demo/dados.sql no SQL Editor (ou pelo conector).',
  })
})
