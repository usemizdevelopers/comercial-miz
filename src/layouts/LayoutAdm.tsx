import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { SignOut } from '@phosphor-icons/react'
import { BottomNav, BottomSheet, Sidebar } from '@/components/ui'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { cn } from '@/lib/cn'
import { ICONE_MAIS, ICONE_MODO_VENDEDORA, NAV_ADM, NAV_ADM_RODAPE_ROTAS, rotaAtiva } from './navegacao'

/**
 * Layout da ADM (dona): computador com barra lateral (Visão geral · Vendas · Clientes ·
 * Equipe · Metas e prêmios · Configurações · Modo vendedora); celular com rodapé
 * Visão geral · Vendas · + Venda · Clientes · Mais.
 */
export function LayoutAdm() {
  const { usuaria, alternarModoVendedora, sair } = useSessao()
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const [maisAberto, setMaisAberto] = useState(false)

  const entrarModoVendedora = () => {
    alternarModoVendedora(true)
    navegar('/hoje')
  }

  const itensLaterais = [
    ...NAV_ADM.map((d) => ({ id: d.rota, rotulo: d.rotulo, icone: d.icone, ativo: rotaAtiva(d, pathname), onClick: () => navegar(d.rota) })),
    { id: 'modo-vendedora', rotulo: 'Modo vendedora', icone: ICONE_MODO_VENDEDORA, onClick: entrarModoVendedora },
  ]

  const doRodape = NAV_ADM.filter((d) => NAV_ADM_RODAPE_ROTAS.includes(d.rota))
  const doMais = NAV_ADM.filter((d) => !NAV_ADM_RODAPE_ROTAS.includes(d.rota))
  const maisAtivo = doMais.some((d) => rotaAtiva(d, pathname))

  const itensRodape = [
    ...doRodape.map((d) => ({ id: d.rota, rotulo: d.rotulo, icone: d.icone, ativo: rotaAtiva(d, pathname), onClick: () => navegar(d.rota) })),
    { id: 'mais', rotulo: 'Mais', icone: ICONE_MAIS, ativo: maisAtivo, onClick: () => setMaisAberto(true) },
  ]

  const itemMais = 'foco flex min-h-toque w-full items-center gap-3 rounded-md px-3 text-label transition-[background-color] duration-fast ease-out hover:bg-background-muted [&>svg]:h-icone-nav [&>svg]:w-icone-nav'

  return (
    <div className="min-h-tela lg:pl-sidebar">
      <Sidebar
        itens={itensLaterais}
        onVenda={() => navegar('/venda/nova')}
        rodape={{ loja: usuaria?.lojaNome ?? undefined, pessoa: usuaria?.nome }}
        onSair={() => void sair()}
      />
      <main className="pb-rodape lg:pb-10">
        <div className="area-segura-baixo">
          <Outlet />
        </div>
      </main>
      <BottomNav itens={itensRodape} onVenda={() => navegar('/venda/nova')} vendaAtiva={pathname === '/venda/nova'} />

      <BottomSheet aberta={maisAberto} onFechar={() => setMaisAberto(false)} titulo="Mais">
        <nav aria-label="Mais opções" className="flex flex-col gap-1">
          {doMais.map((d) => (
            <button
              key={d.rota}
              type="button"
              className={cn(itemMais, rotaAtiva(d, pathname) && 'bg-background-muted')}
              aria-current={rotaAtiva(d, pathname) ? 'page' : undefined}
              onClick={() => {
                setMaisAberto(false)
                navegar(d.rota)
              }}
            >
              {d.icone}
              {d.rotulo}
            </button>
          ))}
          <button
            type="button"
            className={itemMais}
            onClick={() => {
              setMaisAberto(false)
              entrarModoVendedora()
            }}
          >
            {ICONE_MODO_VENDEDORA}
            Modo vendedora
          </button>
          <div className="my-2 border-t border-border-subtle" />
          <button type="button" className={cn(itemMais, 'text-text-secondary')} onClick={() => void sair()}>
            <SignOut weight="light" />
            Sair
          </button>
        </nav>
      </BottomSheet>
    </div>
  )
}
