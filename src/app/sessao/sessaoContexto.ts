import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type Papel = 'admin_miz' | 'adm' | 'vendedora'

/** Quem está logado no MIZ Loja (usado por todas as páginas). */
export interface Usuaria {
  id: string
  nome: string
  papel: Papel
  /** usuário de login (WhatsApp normalizado) */
  usuario: string | null
  precisaTrocarSenha: boolean
  /** só ADM e vendedora */
  lojaId: string | null
  lojaNome: string | null
  email: string | null
}

export type EstadoSessao =
  | { status: 'carregando' }
  | { status: 'deslogada' }
  | { status: 'logada'; session: Session; usuaria: Usuaria }

export interface SessaoApi {
  estado: EstadoSessao
  /** atalho: usuária logada ou null */
  usuaria: Usuaria | null
  ehAdminMiz: boolean
  /** ADM usando o painel da vendedora */
  modoVendedora: boolean
  /** Entra com usuário (WhatsApp) e senha. Lança erro com mensagem pronta para a tela. */
  entrar: (usuario: string, senha: string) => Promise<Usuaria>
  sair: () => Promise<void>
  /** Relê papel, loja e situação (ex.: depois de trocar a senha) */
  recarregar: () => Promise<Usuaria | null>
  alternarModoVendedora: (ativo: boolean) => void
}

export const SessaoContexto = createContext<SessaoApi | null>(null)

export function useSessao(): SessaoApi {
  const ctx = useContext(SessaoContexto)
  if (!ctx) throw new Error('useSessao precisa estar dentro de SessaoProvider')
  return ctx
}

/** Página inicial de cada papel (o modo vendedora leva a ADM para /hoje). */
export function paginaInicial(usuaria: Usuaria | null, modoVendedora = false): string {
  if (!usuaria) return '/entrar'
  if (usuaria.precisaTrocarSenha) return '/trocar-senha'
  if (usuaria.papel === 'admin_miz') return '/miz/lojas'
  if (usuaria.papel === 'adm') return modoVendedora ? '/hoje' : '/adm'
  return '/hoje'
}
