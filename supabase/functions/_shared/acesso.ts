// MIZ Loja · senha provisória, usuário/e-mail técnico e mensagem de acesso.
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { ErroHttp } from './http.ts'

export const DOMINIO = 'mizloja.usemiz.app'

/** Igual a public.mizloja_normalizar_whatsapp */
export function normalizarWhatsapp(valor: unknown): string | null {
  const d = String(valor ?? '').replace(/\D/g, '')
  if (d === '') return null
  if (d.length === 10 || d.length === 11) return `55${d}`
  return d
}

export function whatsappValido(n: string | null): n is string {
  return n !== null && /^55\d{10,11}$/.test(n)
}

export function emailTecnico(usuario: string): string {
  return `${usuario}@${DOMINIO}`
}

// Sem 0/O, 1/l/I: fácil de ler e digitar no celular
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789'

/** Senha provisória de 8 caracteres, gerada com crypto. */
export function gerarSenha(tamanho = 8): string {
  const bytes = new Uint8Array(tamanho)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('')
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome
}

/** Mensagem de acesso (Prompt 2 · B4). Para Admin Miz, "da Miz" no lugar de "da [LOJA]". */
export function mensagemAcesso(p: { nome: string; loja: string | null; usuario: string; senha: string }): string {
  const link = `${(Deno.env.get('APP_URL') ?? 'http://localhost:5173').replace(/\/$/, '')}/entrar`
  const onde = p.loja ? `da ${p.loja}` : 'da Miz'
  return [
    `Oi, ${primeiroNome(p.nome)}! Seu acesso ao MIZ Loja ${onde} está pronto.`,
    '',
    `Link de acesso: ${link}`,
    `Usuário: ${p.usuario}`,
    `Senha: ${p.senha}`,
    '',
    'No primeiro acesso você vai criar a sua senha.',
  ].join('\n')
}

/** O WhatsApp já é login de alguém (usuária, admin ou conta do Auth)? */
export async function usuarioEmUso(admin: SupabaseClient, usuario: string): Promise<boolean> {
  const [{ count: c1 }, { count: c2 }] = await Promise.all([
    admin.from('mizloja_usuarias').select('id', { count: 'exact', head: true }).eq('usuario', usuario),
    admin.from('mizloja_admins').select('id', { count: 'exact', head: true }).eq('usuario', usuario),
  ])
  return (c1 ?? 0) + (c2 ?? 0) > 0
}

/** Cria a conta no Auth com e-mail técnico, e-mail confirmado e app = mizloja. */
export async function criarContaAuth(admin: SupabaseClient, usuario: string, nome: string, senha: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email: emailTecnico(usuario),
    password: senha,
    email_confirm: true,
    user_metadata: { app: 'mizloja', nome },
  })
  if (error || !data.user) {
    if (/already been registered|already exists/i.test(error?.message ?? '')) {
      throw new ErroHttp('Esse WhatsApp já tem acesso ao MIZ Loja.', 409)
    }
    console.error(error)
    throw new ErroHttp('Não foi possível criar o acesso. Tente de novo.', 500)
  }
  return data.user.id
}

/** Bloqueia (ou libera) o login no Auth. Bloquear impede renovar a sessão aberta. */
export async function bloquearLogin(admin: SupabaseClient, userId: string, bloquear: boolean): Promise<void> {
  const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: bloquear ? '876000h' : 'none' })
  if (error) {
    console.error(error)
    throw new ErroHttp('Não foi possível atualizar o acesso no login. Tente de novo.', 500)
  }
}
