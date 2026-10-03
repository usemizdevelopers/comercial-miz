import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { TelaCarregando } from '@/components/shared/TelaCarregando'
import { paginaInicial, useSessao, type Papel } from './sessao/sessaoContexto'

/**
 * Guarda de rota: exige login, exige a troca de senha resolvida e exige o papel certo.
 * Acesso negado volta para a página inicial do papel.
 */
export function Protegida({ papeis, children }: { papeis: Papel[]; children: ReactNode }) {
  const { estado, usuaria, modoVendedora } = useSessao()
  const local = useLocation()

  if (estado.status === 'carregando') return <TelaCarregando />
  if (!usuaria) return <Navigate to="/entrar" replace state={{ de: local.pathname }} />
  if (usuaria.precisaTrocarSenha) return <Navigate to="/trocar-senha" replace />
  if (!papeis.includes(usuaria.papel)) return <Navigate to={paginaInicial(usuaria, modoVendedora)} replace />
  return <>{children}</>
}

/** Telas de quem não está logada (/entrar): quem já entrou vai para a página inicial. */
export function SoDeslogada({ children }: { children: ReactNode }) {
  const { estado, usuaria, modoVendedora } = useSessao()
  if (estado.status === 'carregando') return <TelaCarregando />
  if (usuaria) return <Navigate to={paginaInicial(usuaria, modoVendedora)} replace />
  return <>{children}</>
}

/** /trocar-senha: só para quem está logada e ainda precisa trocar. */
export function SoTrocaDeSenha({ children }: { children: ReactNode }) {
  const { estado, usuaria, modoVendedora } = useSessao()
  if (estado.status === 'carregando') return <TelaCarregando />
  if (!usuaria) return <Navigate to="/entrar" replace />
  if (!usuaria.precisaTrocarSenha) return <Navigate to={paginaInicial(usuaria, modoVendedora)} replace />
  return <>{children}</>
}

/** Raiz "/": manda cada papel para a sua página inicial. */
export function RedirecionarInicio() {
  const { estado, usuaria, modoVendedora } = useSessao()
  if (estado.status === 'carregando') return <TelaCarregando />
  return <Navigate to={paginaInicial(usuaria, modoVendedora)} replace />
}
