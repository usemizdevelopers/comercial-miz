// MIZ Loja · mizloja-primeiro-admin (TEMPORÁRIA, uso único)
//
// Cria a primeira conta de Admin Miz do MIZ Loja (WhatsApp 5531984810586, e-mail técnico,
// senha provisória e troca obrigatória) e retira de mizloja_admins a linha antiga sem usuário
// (a conta usemizdigital@gmail.com do app MIZ), SEM alterar nem apagar essa conta no Auth.
//
// ESTA É A VERSÃO DESLIGADA: com CODIGO_USO_UNICO vazio, a função sempre responde 410.
// Para usar (só na sessão de testes, ver docs/TESTES-PENDENTES.md, passo 2):
//   1. gerar um código aleatório na hora e colocá-lo em CODIGO_USO_UNICO SÓ na cópia publicada
//      (nunca commitar o código);
//   2. publicar com verify_jwt = false (ainda não existe nenhum admin para ter token);
//   3. chamar uma vez com o cabeçalho x-mizloja-codigo;
//   4. publicar de novo ESTE arquivo (desligado) logo em seguida.
// Travas: código de uso único, só funciona enquanto não existir admin com usuário de WhatsApp,
// e só aceita o número 5531984810586.
import { ErroHttp, json, servir } from '../_shared/http.ts'
import { clienteAdmin } from '../_shared/supabase.ts'
import { criarContaAuth, gerarSenha } from '../_shared/acesso.ts'

const CODIGO_USO_UNICO = '' // desligada: nunca preencher no repositório
const WHATSAPP_PERMITIDO = '5531984810586'

function iguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let dif = 0
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return dif === 0
}

servir(async (req) => {
  if (CODIGO_USO_UNICO.length < 32) throw new ErroHttp('Função desligada.', 410)
  const codigo = req.headers.get('x-mizloja-codigo') ?? ''
  if (!iguais(codigo, CODIGO_USO_UNICO)) throw new ErroHttp('Acesso não autorizado.', 403)

  const admin = clienteAdmin()

  const { count } = await admin.from('mizloja_admins').select('id', { count: 'exact', head: true }).not('usuario', 'is', null)
  if ((count ?? 0) > 0) throw new ErroHttp('Já existe Admin Miz com acesso. Função desligada.', 410)

  const senha = gerarSenha()
  const userId = await criarContaAuth(admin, WHATSAPP_PERMITIDO, 'Admin MIZ', senha)
  const { error } = await admin.from('mizloja_admins').insert({
    id: userId,
    nome: 'Admin MIZ',
    whatsapp: WHATSAPP_PERMITIDO,
    usuario: WHATSAPP_PERMITIDO,
    precisa_trocar_senha: true,
  })
  if (error) {
    await admin.auth.admin.deleteUser(userId)
    console.error(error)
    throw new ErroHttp('Não foi possível criar o admin.', 500)
  }

  // Retira o vínculo antigo (linha sem usuário = conta do app MIZ). A conta no Auth não é tocada.
  const { data: removidos, error: erroRemover } = await admin
    .from('mizloja_admins')
    .delete()
    .is('usuario', null)
    .select('id')
  if (erroRemover) console.error(erroRemover)

  return json(req, {
    usuario: WHATSAPP_PERMITIDO,
    senha,
    admin_id: userId,
    vinculos_antigos_removidos: (removidos ?? []).length,
  })
})
