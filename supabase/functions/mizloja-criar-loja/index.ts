// MIZ Loja · mizloja-criar-loja (só Admin Miz)
// Cria a loja e a ADM (dona) juntas. Se a ADM falhar, a loja é desfeita.
import { ErroHttp, json, lerCorpo, servir } from '../_shared/http.ts'
import { clienteAdmin, exigirAdminMiz, quemChama } from '../_shared/supabase.ts'
import { normalizarWhatsapp } from '../_shared/acesso.ts'
import { criarUsuaria, validarNomeWhatsapp } from '../_shared/usuarias.ts'

interface Corpo {
  loja?: { nome?: string; cnpj?: string; cidade?: string; uf?: string; whatsapp?: string | null }
  dona?: { nome?: string; whatsapp?: string }
}

function cnpjValido(valor: string): boolean {
  const d = valor.replace(/\D/g, '')
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false
  const dv = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const soma = base.split('').reduce((acc, c, i) => acc + Number(c) * pesos[i], 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const d1 = dv(d.slice(0, 12))
  const d2 = dv(d.slice(0, 12) + d1)
  return d.endsWith(`${d1}${d2}`)
}

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

servir(async (req) => {
  const admin = clienteAdmin()
  const quem = await quemChama(req, admin)
  exigirAdminMiz(quem)

  const { loja, dona } = await lerCorpo<Corpo>(req)
  const nome = String(loja?.nome ?? '').trim()
  const cnpj = String(loja?.cnpj ?? '').replace(/\D/g, '')
  const cidade = String(loja?.cidade ?? '').trim()
  const uf = String(loja?.uf ?? '').trim().toUpperCase()
  if (nome.length < 2) throw new ErroHttp('Digite o nome da loja.')
  if (!cnpjValido(cnpj)) throw new ErroHttp('Confira o CNPJ.')
  if (cidade.length < 2) throw new ErroHttp('Digite a cidade.')
  if (!UFS.includes(uf)) throw new ErroHttp('Escolha a UF.')
  const whatsLoja = loja?.whatsapp ? normalizarWhatsapp(loja.whatsapp) : null
  const donaOk = validarNomeWhatsapp(dona?.nome, dona?.whatsapp)

  const { data: criada, error } = await admin
    .from('mizloja_lojas')
    .insert({ nome, cnpj, cidade, uf, whatsapp: whatsLoja, criado_por: quem.id })
    .select('id, nome')
    .single()
  if (error || !criada) {
    if (error?.code === '23505') throw new ErroHttp('Já existe uma loja com esse CNPJ.', 409)
    console.error(error)
    throw new ErroHttp('Não foi possível criar a loja. Tente de novo.', 500)
  }

  try {
    const acesso = await criarUsuaria(admin, {
      lojaId: criada.id,
      lojaNome: criada.nome,
      perfil: 'adm',
      nome: donaOk.nome,
      whatsapp: donaOk.whatsapp,
      criadoPor: quem.id,
    })
    return json(req, { loja_id: criada.id, ...acesso })
  } catch (e) {
    // desfaz a loja (config e mensagens saem em cascata)
    await admin.from('mizloja_lojas').delete().eq('id', criada.id)
    throw e
  }
})
