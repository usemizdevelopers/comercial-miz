import {
  ChartBar,
  DotsThree,
  Gear,
  House,
  Package,
  Receipt,
  ShieldCheck,
  Storefront,
  Target,
  UserCircle,
  UsersThree,
  IdentificationBadge,
} from '@phosphor-icons/react'
import type { ReactNode } from 'react'

/** Itens de navegação de cada painel (rota, rótulo e ícone). As páginas futuras já existem como provisórias. */
export interface DestinoNav {
  rota: string
  rotulo: string
  icone: ReactNode
  /** rota ativa também para sub-rotas (ex.: /clientes/123) */
  prefixo?: boolean
}

export const NAV_VENDEDORA: DestinoNav[] = [
  { rota: '/hoje', rotulo: 'Hoje', icone: <House weight="light" /> },
  { rota: '/clientes', rotulo: 'Clientes', icone: <UsersThree weight="light" />, prefixo: true },
  { rota: '/metas', rotulo: 'Metas', icone: <Target weight="light" /> },
  { rota: '/perfil', rotulo: 'Perfil', icone: <UserCircle weight="light" /> },
]

export const NAV_ADM: DestinoNav[] = [
  { rota: '/adm', rotulo: 'Visão geral', icone: <ChartBar weight="light" /> },
  { rota: '/adm/vendas', rotulo: 'Vendas', icone: <Receipt weight="light" />, prefixo: true },
  { rota: '/adm/clientes', rotulo: 'Clientes', icone: <UsersThree weight="light" />, prefixo: true },
  { rota: '/adm/equipe', rotulo: 'Equipe', icone: <IdentificationBadge weight="light" />, prefixo: true },
  { rota: '/adm/metas', rotulo: 'Metas e prêmios', icone: <Target weight="light" /> },
  { rota: '/adm/config', rotulo: 'Configurações', icone: <Gear weight="light" /> },
]

/** Rodapé da ADM no celular: Visão geral · Vendas · + Venda · Clientes · Mais */
export const NAV_ADM_RODAPE_ROTAS = ['/adm', '/adm/vendas', '/adm/clientes']

export const NAV_ADMIN_MIZ: DestinoNav[] = [
  { rota: '/miz/lojas', rotulo: 'Lojas', icone: <Storefront weight="light" />, prefixo: true },
  { rota: '/miz/catalogo', rotulo: 'Catálogo', icone: <Package weight="light" />, prefixo: true },
  { rota: '/miz/admins', rotulo: 'Admins Miz', icone: <ShieldCheck weight="light" /> },
]

export const ICONE_MAIS = <DotsThree weight="light" />
export const ICONE_MODO_VENDEDORA = <Storefront weight="light" />

export function rotaAtiva(destino: DestinoNav, caminho: string): boolean {
  if (destino.prefixo) return caminho === destino.rota || caminho.startsWith(`${destino.rota}/`)
  return caminho === destino.rota
}
