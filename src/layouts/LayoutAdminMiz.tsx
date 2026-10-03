import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { SignOut } from '@phosphor-icons/react'
import { Logo, Sidebar, Tabs } from '@/components/ui'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { NAV_ADMIN_MIZ, rotaAtiva } from './navegacao'

/**
 * Layout da Admin Miz (time Miz, uso no computador): barra lateral com Lojas · Catálogo ·
 * Admins Miz · Sair. No celular, topo com logo e abas.
 */
export function LayoutAdminMiz() {
  const { usuaria, sair } = useSessao()
  const navegar = useNavigate()
  const { pathname } = useLocation()

  const itens = NAV_ADMIN_MIZ.map((d) => ({
    id: d.rota,
    rotulo: d.rotulo,
    icone: d.icone,
    ativo: rotaAtiva(d, pathname),
    onClick: () => navegar(d.rota),
  }))
  const ativa = NAV_ADMIN_MIZ.find((d) => rotaAtiva(d, pathname))?.rota ?? NAV_ADMIN_MIZ[0]!.rota

  return (
    <div className="min-h-tela lg:pl-sidebar">
      <Sidebar itens={itens} rodape={{ loja: 'Admin Miz', pessoa: usuaria?.nome }} onSair={() => void sair()} />
      <header className="sticky top-0 z-20 bg-background px-gutter area-segura-topo lg:hidden">
        <div className="flex h-topbar items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => void sair()}
            className="foco sublinhado flex items-center gap-1 rounded-sm text-label text-text-secondary"
          >
            <SignOut weight="light" className="h-icone w-icone" />
            Sair
          </button>
        </div>
        <Tabs rotulo="Painel Admin Miz" abas={NAV_ADMIN_MIZ.map((d) => ({ id: d.rota, rotulo: d.rotulo }))} ativa={ativa} onMudar={(rota) => navegar(rota)} />
      </header>
      <main className="pb-10 area-segura-baixo">
        <Outlet />
      </main>
    </div>
  )
}
