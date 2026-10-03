// MIZ Loja · cliente com service role (só no servidor) e identificação de quem chama.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { ErroHttp } from './http.ts'

export function clienteAdmin(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const chave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !chave) throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente')
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
}

export type QuemChama =
  | { papel: 'admin_miz'; id: string; nome: string }
  | { papel: 'adm' | 'vendedora'; id: string; nome: string; lojaId: string; lojaNome: string }

/** Valida o token (Authorization: Bearer) e descobre o papel de quem chama. Inativo = recusado. */
export async function quemChama(req: Request, admin: SupabaseClient): Promise<QuemChama> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) throw new ErroHttp('Entre no MIZ Loja para continuar.', 401)
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new ErroHttp('Sua sessão terminou. Entre de novo.', 401)
  const uid = data.user.id

  const { data: adm } = await admin.from('mizloja_admins').select('id, nome, ativo').eq('id', uid).maybeSingle()
  if (adm) {
    if (!adm.ativo) throw new ErroHttp('Seu acesso está desativado.', 403)
    return { papel: 'admin_miz', id: adm.id, nome: adm.nome }
  }

  const { data: u } = await admin
    .from('mizloja_usuarias')
    .select('id, nome, perfil, situacao, loja_id, mizloja_lojas(nome, situacao)')
    .eq('id', uid)
    .maybeSingle()
  if (!u) throw new ErroHttp('Acesso não autorizado.', 403)
  const loja = u.mizloja_lojas as unknown as { nome: string; situacao: string } | null
  if (u.situacao !== 'ativa' || !loja || loja.situacao !== 'ativa') throw new ErroHttp('Seu acesso está desativado.', 403)
  return { papel: u.perfil as 'adm' | 'vendedora', id: u.id, nome: u.nome, lojaId: u.loja_id, lojaNome: loja.nome }
}

export function exigirAdminMiz(q: QuemChama): asserts q is Extract<QuemChama, { papel: 'admin_miz' }> {
  if (q.papel !== 'admin_miz') throw new ErroHttp('Só o time Miz pode fazer isso.', 403)
}
