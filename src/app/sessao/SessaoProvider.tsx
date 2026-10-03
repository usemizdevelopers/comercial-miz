import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { emailTecnico } from '@/lib/acesso'
import { mensagemDeErro } from '@/lib/erros'
import { ErroAcesso, guardarAvisoEntrar } from './avisos'
import { SessaoContexto, type EstadoSessao, type SessaoApi, type Usuaria } from './sessaoContexto'

const CHAVE_MODO_VENDEDORA = 'mizloja-modo-vendedora'
/** De quanto em quanto tempo a sessão aberta confere se o acesso continua ativo */
const INTERVALO_CONFERENCIA_MS = 60_000

const MSG_DESATIVADA_VENDEDORA = 'Seu acesso está desativado. Fale com a dona da loja.'
const MSG_DESATIVADA_ADM = 'Seu acesso está desativado. Fale com a Miz.'

/** Descobre o papel (Admin Miz, ADM ou vendedora), a loja e se o acesso está ativo. */
async function carregarUsuaria(userId: string): Promise<Usuaria> {
  const { data: admin, error: erroAdmin } = await supabase
    .from('mizloja_admins')
    .select('id, nome, ativo, usuario, precisa_trocar_senha')
    .eq('id', userId)
    .maybeSingle()
  if (erroAdmin) throw erroAdmin
  if (admin) {
    if (!admin.ativo) throw new ErroAcesso(MSG_DESATIVADA_ADM)
    return {
      id: admin.id,
      nome: admin.nome,
      papel: 'admin_miz',
      usuario: admin.usuario,
      precisaTrocarSenha: admin.precisa_trocar_senha,
      lojaId: null,
      lojaNome: null,
      email: null,
    }
  }

  const { data: u, error: erroUsuaria } = await supabase
    .from('mizloja_usuarias')
    .select('id, nome, perfil, loja_id, situacao, precisa_trocar_senha, usuario, email')
    .eq('id', userId)
    .maybeSingle()
  if (erroUsuaria) throw erroUsuaria
  if (!u) throw new ErroAcesso('Esse acesso não é do MIZ Loja.')

  const msgDesativada = u.perfil === 'adm' ? MSG_DESATIVADA_ADM : MSG_DESATIVADA_VENDEDORA
  if (u.situacao !== 'ativa') throw new ErroAcesso(msgDesativada)

  // Loja inativa: o RLS não devolve a loja (e nenhum dado dela)
  const { data: loja, error: erroLoja } = await supabase.from('mizloja_lojas').select('id, nome').eq('id', u.loja_id).maybeSingle()
  if (erroLoja) throw erroLoja
  if (!loja) throw new ErroAcesso(msgDesativada)

  return {
    id: u.id,
    nome: u.nome,
    papel: u.perfil === 'adm' ? 'adm' : 'vendedora',
    usuario: u.usuario,
    precisaTrocarSenha: u.precisa_trocar_senha,
    lojaId: loja.id,
    lojaNome: loja.nome,
    email: u.email,
  }
}

function lerModoVendedora(): boolean {
  try {
    return localStorage.getItem(CHAVE_MODO_VENDEDORA) === '1'
  } catch {
    return false
  }
}

/**
 * Provedor de sessão do MIZ Loja. Expõe a usuária (id, nome, papel, loja), se é Admin Miz
 * e se está em modo vendedora. Confere o acesso ao abrir, ao voltar para a aba e a cada minuto:
 * usuária ou loja desativada sai na hora.
 */
export function SessaoProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSessao>({ status: 'carregando' })
  const [modoVendedora, setModoVendedora] = useState(lerModoVendedora)
  const queryClient = useQueryClient()
  const sessaoAtual = useRef<Session | null>(null)
  const estadoRef = useRef(estado)
  estadoRef.current = estado

  const encerrar = useCallback(
    async (aviso?: string) => {
      if (aviso) guardarAvisoEntrar(aviso)
      await supabase.auth.signOut({ scope: 'local' })
      sessaoAtual.current = null
      queryClient.clear()
      setEstado({ status: 'deslogada' })
    },
    [queryClient],
  )

  const resolver = useCallback(
    async (session: Session | null): Promise<Usuaria | null> => {
      sessaoAtual.current = session
      if (!session) {
        setEstado({ status: 'deslogada' })
        return null
      }
      try {
        const usuaria = await carregarUsuaria(session.user.id)
        setEstado({ status: 'logada', session, usuaria })
        return usuaria
      } catch (e) {
        if (e instanceof ErroAcesso) {
          await encerrar(e.message)
          return null
        }
        // erro de rede: mantém a sessão e o estado atual
        if (estadoRef.current.status === 'carregando') setEstado({ status: 'deslogada' })
        return null
      }
    },
    [encerrar],
  )

  useEffect(() => {
    let ativo = true
    supabase.auth.getSession().then(({ data }) => {
      if (ativo) void resolver(data.session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === 'SIGNED_OUT') {
        sessaoAtual.current = null
        setEstado({ status: 'deslogada' })
      } else if (evento === 'TOKEN_REFRESHED' && session) {
        sessaoAtual.current = session
        setEstado((e) => (e.status === 'logada' ? { ...e, session } : e))
      }
    })
    return () => {
      ativo = false
      sub.subscription.unsubscribe()
    }
  }, [resolver])

  // Sessão aberta confere o acesso: ao voltar para a aba e a cada minuto
  useEffect(() => {
    if (estado.status !== 'logada') return
    const conferir = () => {
      if (document.visibilityState === 'visible' && sessaoAtual.current) void resolver(sessaoAtual.current)
    }
    const timer = window.setInterval(conferir, INTERVALO_CONFERENCIA_MS)
    document.addEventListener('visibilitychange', conferir)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', conferir)
    }
  }, [estado.status, resolver])

  const entrar = useCallback(
    async (usuario: string, senha: string): Promise<Usuaria> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailTecnico(usuario), password: senha })
      if (error || !data.session) {
        // Nunca diz se foi o usuário ou a senha
        const msg = mensagemDeErro(error)
        throw new ErroAcesso(/conexão/.test(msg) ? msg : /desativado/.test(msg) ? 'Seu acesso está desativado.' : 'Usuário ou senha incorretos')
      }
      let usuaria: Usuaria
      try {
        usuaria = await carregarUsuaria(data.session.user.id)
      } catch (e) {
        await supabase.auth.signOut({ scope: 'local' })
        throw e instanceof ErroAcesso ? e : new ErroAcesso(mensagemDeErro(e))
      }
      sessaoAtual.current = data.session
      setEstado({ status: 'logada', session: data.session, usuaria })
      // último acesso (não bloqueia a entrada se falhar)
      void supabase.rpc('mizloja_registrar_acesso')
      return usuaria
    },
    [],
  )

  const sair = useCallback(async () => {
    try {
      localStorage.removeItem(CHAVE_MODO_VENDEDORA)
    } catch {
      // ignora
    }
    setModoVendedora(false)
    await encerrar()
  }, [encerrar])

  const recarregar = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return resolver(data.session)
  }, [resolver])

  const alternarModoVendedora = useCallback((ativoModo: boolean) => {
    setModoVendedora(ativoModo)
    try {
      if (ativoModo) localStorage.setItem(CHAVE_MODO_VENDEDORA, '1')
      else localStorage.removeItem(CHAVE_MODO_VENDEDORA)
    } catch {
      // ignora
    }
  }, [])

  const usuaria = estado.status === 'logada' ? estado.usuaria : null

  const valor = useMemo<SessaoApi>(
    () => ({
      estado,
      usuaria,
      ehAdminMiz: usuaria?.papel === 'admin_miz',
      modoVendedora: usuaria?.papel === 'adm' && modoVendedora,
      entrar,
      sair,
      recarregar,
      alternarModoVendedora,
    }),
    [estado, usuaria, modoVendedora, entrar, sair, recarregar, alternarModoVendedora],
  )

  return <SessaoContexto.Provider value={valor}>{children}</SessaoContexto.Provider>
}
