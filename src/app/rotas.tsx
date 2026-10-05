import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PaginaEmConstrucao } from '@/components/shared/PaginaEmConstrucao'
import { LayoutVendedora } from '@/layouts/LayoutVendedora'
import { LayoutAdm } from '@/layouts/LayoutAdm'
import { LayoutAdminMiz } from '@/layouts/LayoutAdminMiz'
import { Protegida, RedirecionarInicio, SoDeslogada, SoTrocaDeSenha } from './guardas'

const Entrar = lazy(() => import('@/features/auth/Entrar'))
const TrocarSenha = lazy(() => import('@/features/auth/TrocarSenha'))
const Lojas = lazy(() => import('@/features/admin-miz/Lojas'))
const LojaDetalhe = lazy(() => import('@/features/admin-miz/LojaDetalhe'))
const Catalogo = lazy(() => import('@/features/admin-miz/Catalogo'))
const PecaEditar = lazy(() => import('@/features/admin-miz/PecaEditar'))
const Admins = lazy(() => import('@/features/admin-miz/Admins'))
const LancarVenda = lazy(() => import('@/features/vendas/LancarVenda'))
const FichaCliente = lazy(() => import('@/features/clientes/FichaCliente'))
const Clientes = lazy(() => import('@/features/clientes/Clientes'))
const Hoje = lazy(() => import('@/features/hoje/Hoje'))
const Metas = lazy(() => import('@/features/metas/Metas'))
const Perfil = lazy(() => import('@/features/perfil/Perfil'))
const Equipe = lazy(() => import('@/features/equipe/Equipe'))
const Vendedora = lazy(() => import('@/features/equipe/Vendedora'))
const Configuracoes = lazy(() => import('@/features/config/Configuracoes'))
const MetasAdm = lazy(() => import('@/features/metas/MetasAdm'))
// Vitrine dos componentes: só existe em desenvolvimento (fica fora do build de produção)
const VitrineComponentes = import.meta.env.DEV ? lazy(() => import('@/features/dev/VitrineComponentes')) : null

/**
 * Mapa de rotas. As páginas das etapas 3 a 6 já existem como provisórias
 * ("Em construção · Etapa X"); cada etapa troca o elemento pela página real.
 */
export function Rotas() {
  return (
    <Routes>
      <Route path="/" element={<RedirecionarInicio />} />
      <Route
        path="/entrar"
        element={
          <SoDeslogada>
            <Entrar />
          </SoDeslogada>
        }
      />
      <Route
        path="/trocar-senha"
        element={
          <SoTrocaDeSenha>
            <TrocarSenha />
          </SoTrocaDeSenha>
        }
      />

      {/* Vendedora (e ADM em modo vendedora) */}
      <Route
        element={
          <Protegida papeis={['vendedora', 'adm']}>
            <LayoutVendedora />
          </Protegida>
        }
      >
        <Route path="/hoje" element={<Hoje />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/:id" element={<FichaCliente />} />
        <Route path="/venda/nova" element={<LancarVenda />} />
        <Route path="/metas" element={<Metas />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>

      {/* ADM (dona) */}
      <Route
        element={
          <Protegida papeis={['adm']}>
            <LayoutAdm />
          </Protegida>
        }
      >
        <Route path="/adm" element={<PaginaEmConstrucao titulo="Visão geral" etapa={6} />} />
        <Route path="/adm/vendas" element={<PaginaEmConstrucao titulo="Vendas" etapa={6} />} />
        <Route path="/adm/clientes" element={<PaginaEmConstrucao titulo="Clientes" etapa={4} />} />
        <Route path="/adm/equipe" element={<Equipe />} />
        <Route path="/adm/equipe/:id" element={<Vendedora />} />
        <Route path="/adm/clientes/:id" element={<FichaCliente />} />
        <Route path="/adm/venda/nova" element={<LancarVenda />} />
        <Route path="/adm/metas" element={<MetasAdm />} />
        <Route path="/adm/config" element={<Configuracoes />} />
      </Route>

      {/* Admin Miz */}
      <Route
        element={
          <Protegida papeis={['admin_miz']}>
            <LayoutAdminMiz />
          </Protegida>
        }
      >
        <Route path="/miz" element={<Navigate to="/miz/lojas" replace />} />
        <Route path="/miz/lojas" element={<Lojas />} />
        <Route path="/miz/lojas/:id" element={<LojaDetalhe />} />
        <Route path="/miz/catalogo" element={<Catalogo />} />
        <Route path="/miz/catalogo/:id" element={<PecaEditar />} />
        <Route path="/miz/admins" element={<Admins />} />
      </Route>

      {VitrineComponentes && <Route path="/dev/componentes" element={<VitrineComponentes />} />}
      <Route path="*" element={<RedirecionarInicio />} />
    </Routes>
  )
}
