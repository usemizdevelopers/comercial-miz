import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PaginaEmConstrucao } from '@/components/shared/PaginaEmConstrucao'
import { LayoutVendedora } from '@/layouts/LayoutVendedora'
import { LayoutAdm } from '@/layouts/LayoutAdm'
import { LayoutAdminMiz } from '@/layouts/LayoutAdminMiz'
import { Protegida, RedirecionarInicio, SoDeslogada, SoTrocaDeSenha } from './guardas'
import { PerfilProvisorio } from '@/features/auth/PerfilProvisorio'

const Entrar = lazy(() => import('@/features/auth/Entrar'))
const TrocarSenha = lazy(() => import('@/features/auth/TrocarSenha'))
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
        <Route path="/hoje" element={<PaginaEmConstrucao titulo="Hoje" etapa={5} descricao="Quanto falta para a meta e quem chamar hoje." />} />
        <Route path="/clientes" element={<PaginaEmConstrucao titulo="Clientes" etapa={4} descricao="Kanban das clientes." />} />
        <Route path="/clientes/:id" element={<PaginaEmConstrucao titulo="Ficha da cliente" etapa={4} />} />
        <Route path="/venda/nova" element={<PaginaEmConstrucao titulo="Nova venda" etapa={4} descricao="Cliente → Peças → Valor." />} />
        <Route path="/metas" element={<PaginaEmConstrucao titulo="Metas" etapa={5} />} />
        <Route path="/perfil" element={<PerfilProvisorio />} />
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
        <Route path="/adm/equipe" element={<PaginaEmConstrucao titulo="Equipe" etapa={3} descricao="Criar vendedoras, nova senha e desativar." />} />
        <Route path="/adm/metas" element={<PaginaEmConstrucao titulo="Metas e prêmios" etapa={5} />} />
        <Route path="/adm/config" element={<PaginaEmConstrucao titulo="Configurações" etapa={3} />} />
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
        <Route path="/miz/lojas" element={<PaginaEmConstrucao titulo="Lojas" etapa={2} descricao="Parte C desta etapa." />} />
        <Route path="/miz/lojas/:id" element={<PaginaEmConstrucao titulo="Loja" etapa={2} descricao="Parte C desta etapa." />} />
        <Route path="/miz/catalogo" element={<PaginaEmConstrucao titulo="Catálogo" etapa={2} descricao="Parte C desta etapa." />} />
        <Route path="/miz/catalogo/:id" element={<PaginaEmConstrucao titulo="Peça" etapa={2} descricao="Parte C desta etapa." />} />
        <Route path="/miz/admins" element={<PaginaEmConstrucao titulo="Admins Miz" etapa={2} descricao="Parte C desta etapa." />} />
      </Route>

      {VitrineComponentes && <Route path="/dev/componentes" element={<VitrineComponentes />} />}
      <Route path="*" element={<RedirecionarInicio />} />
    </Routes>
  )
}
