import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import { BottomNav, Sidebar } from '@/components/ui'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { NAV_VENDEDORA, rotaAtiva } from './navegacao'

/**
 * Layout da vendedora (e da ADM em modo vendedora): celular com rodapé
 * Hoje · Clientes · + Venda · Metas · Perfil; computador com barra lateral.
 */
export function LayoutVendedora() {
  const { usuaria, modoVendedora, alternarModoVendedora, sair } = useSessao()
  const navegar = useNavigate()
  const { pathname } = useLocation()

  const itens = NAV_VENDEDORA.map((d) => ({
    id: d.rota,
    rotulo: d.rotulo,
    icone: <d.icone weight="light" />,
    ativo: rotaAtiva(d, pathname),
    onClick: () => navegar(d.rota),
  }))

  return (
    <div className="min-h-tela lg:pl-sidebar">
      <Sidebar
        itens={itens}
        onVenda={() => navegar('/venda/nova')}
        rodape={{ loja: usuaria?.lojaNome ?? undefined, pessoa: usuaria?.nome }}
        onSair={() => void sair()}
      />
      {modoVendedora && (
        <div className="sticky top-0 z-30 flex min-h-faixa items-center justify-between gap-3 bg-background-muted px-gutter py-2 text-body-sm area-segura-topo">
          <span className="text-text-secondary">Você está no modo vendedora</span>
          <button
            type="button"
            onClick={() => {
              alternarModoVendedora(false)
              navegar('/adm')
            }}
            className="foco sublinhado flex items-center gap-1 rounded-sm text-label text-text-primary"
          >
            <ArrowLeft weight="light" className="h-icone-sm w-icone-sm" />
            Voltar ao painel
          </button>
        </div>
      )}
      <main className="pb-rodape lg:pb-10">
        <div className="area-segura-baixo">
          <Outlet />
        </div>
      </main>
      <BottomNav itens={itens} onVenda={() => navegar('/venda/nova')} vendaAtiva={pathname === '/venda/nova'} />
    </div>
  )
}
