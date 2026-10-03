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
import type { Icon } from '@phosphor-icons/react'

/** Itens de navegação de cada painel (rota, rótulo e ícone). As páginas futuras já existem como provisórias. */
export interface DestinoNav {
  rota: string
  rotulo: string
  /** componente do ícone (Phosphor); renderizar com weight="light" */
  icone: Icon
  /** rota ativa também para sub-rotas (ex.: /clientes/123) */
  prefixo?: boolean
}

export const NAV_VENDEDORA: DestinoNav[] = [
  { rota: '/hoje', rotulo: 'Hoje', icone: House },
  { rota: '/clientes', rotulo: 'Clientes', icone: UsersThree, prefixo: true },
  { rota: '/metas', rotulo: 'Metas', icone: Target },
  { rota: '/perfil', rotulo: 'Perfil', icone: UserCircle },
]

export const NAV_ADM: DestinoNav[] = [
  { rota: '/adm', rotulo: 'Visão geral', icone: ChartBar },
  { rota: '/adm/vendas', rotulo: 'Vendas', icone: Receipt, prefixo: true },
  { rota: '/adm/clientes', rotulo: 'Clientes', icone: UsersThree, prefixo: true },
  { rota: '/adm/equipe', rotulo: 'Equipe', icone: IdentificationBadge, prefixo: true },
  { rota: '/adm/metas', rotulo: 'Metas e prêmios', icone: Target },
  { rota: '/adm/config', rotulo: 'Configurações', icone: Gear },
]

/** Rodapé da ADM no celular: Visão geral · Vendas · + Venda · Clientes · Mais */
export const NAV_ADM_RODAPE_ROTAS = ['/adm', '/adm/vendas', '/adm/clientes']

export const NAV_ADMIN_MIZ: DestinoNav[] = [
  { rota: '/miz/lojas', rotulo: 'Lojas', icone: Storefront, prefixo: true },
  { rota: '/miz/catalogo', rotulo: 'Catálogo', icone: Package, prefixo: true },
  { rota: '/miz/admins', rotulo: 'Admins Miz', icone: ShieldCheck },
]

export const ICONE_MAIS: Icon = DotsThree
export const ICONE_MODO_VENDEDORA: Icon = Storefront

export function rotaAtiva(destino: DestinoNav, caminho: string): boolean {
  if (destino.prefixo) return caminho === destino.rota || caminho.startsWith(`${destino.rota}/`)
  return caminho === destino.rota
}
