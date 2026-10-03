import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, SignOut, Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'
import { FabVenda } from './FabVenda'

/* ------------------------------------------------------------------ Logo */

/** Logo MIZ (wordmark provisório até a Miz enviar o arquivo oficial). */
export function Logo({ invertido, className }: { invertido?: boolean; className?: string }) {
  return (
    <span
      className={cn('inline-flex h-logo items-center text-h2 tracking-logo', invertido ? 'text-on-primary' : 'text-pressed', className)}
      aria-label="MIZ Loja"
    >
      MIZ
    </span>
  )
}

/* ------------------------------------------------------------------ Abas */

export interface Aba {
  id: string
  rotulo: string
  contador?: number
}

/** Abas (seção 8): linha rolável, label + contador em caption; ativa com sublinhado de 2 primary. */
export function Tabs({ abas, ativa, onMudar, rotulo }: { abas: Aba[]; ativa: string; onMudar: (id: string) => void; rotulo?: string }) {
  return (
    <div role="tablist" aria-label={rotulo} className="sem-barra-rolagem flex gap-6 overflow-x-auto border-b border-border-subtle">
      {abas.map((a) => {
        const sel = a.id === ativa
        return (
          <button
            key={a.id}
            role="tab"
            type="button"
            aria-selected={sel}
            onClick={() => onMudar(a.id)}
            className={cn(
              'foco flex h-toque shrink-0 items-center gap-1 border-b-2 text-label transition-[color,border-color] duration-fast ease-out',
              sel ? 'border-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary',
            )}
          >
            {a.rotulo}
            {a.contador !== undefined && <span className="numeros text-caption">{a.contador}</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ Controle segmentado */

/** Controle de período (seção 8): altura 40, fundo muted, raio 10; ativa em surface com borda e texto 600. */
export function SegmentedControl<T extends string>({
  opcoes,
  valor,
  onMudar,
  rotulo,
}: {
  opcoes: Array<{ valor: T; rotulo: string }>
  valor: T
  onMudar: (v: T) => void
  rotulo?: string
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="inline-flex h-segmentado items-center gap-1 rounded-md bg-background-muted p-1">
      {opcoes.map((o) => {
        const sel = o.valor === valor
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={sel}
            onClick={() => onMudar(o.valor)}
            className={cn(
              'foco h-full whitespace-nowrap rounded-sm px-3 text-body-sm transition-[background-color] duration-fast ease-out',
              sel ? 'border border-border bg-surface font-semibold text-text-primary' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {o.rotulo}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ Topo da página */

/**
 * Topo (seção 8): altura 64; título h1 à esquerda e ação à direita.
 * Detalhe: seta de voltar + título h2. Ao rolar, título encolhe para h3 com fundo e linha.
 */
export function TopBar({ titulo, onVoltar, acao, className }: { titulo: ReactNode; onVoltar?: () => void; acao?: ReactNode; className?: string }) {
  const [rolou, setRolou] = useState(false)
  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 8)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-topbar items-center gap-2 px-gutter transition-[background-color,border-color] duration-base area-segura-topo',
        rolou ? 'border-b border-border-subtle bg-background' : 'border-b border-transparent bg-background',
        className,
      )}
    >
      {onVoltar && (
        <button
          type="button"
          onClick={onVoltar}
          aria-label="Voltar"
          className="foco alvo-48 -ml-2 flex items-center justify-center rounded-sm text-text-primary"
        >
          <ArrowLeft weight="light" className="h-icone-nav w-icone-nav" />
        </button>
      )}
      <h1 className={cn('min-w-0 flex-1 truncate transition-[font-size] duration-base', rolou ? 'text-h3' : onVoltar ? 'text-h2' : 'text-h1')}>
        {titulo}
      </h1>
      {acao}
    </header>
  )
}

/* ------------------------------------------------------------------ Itens de navegação */

export interface ItemNav {
  id: string
  rotulo: string
  icone: ReactNode
  ativo?: boolean
  onClick: () => void
}

/**
 * Rodapé (seção 8): 72 + área segura, surface, linha shadow-top; cinco posições iguais
 * com o "+ Venda" no centro. Ativo: text-primary, rótulo 600 e traço 16×2 acima do ícone.
 */
export function BottomNav({ itens, onVenda, vendaAtiva }: { itens: ItemNav[]; onVenda: () => void; vendaAtiva?: boolean }) {
  const metade = Math.ceil(itens.length / 2)
  const renderItem = (item: ItemNav) => (
    <button
      key={item.id}
      type="button"
      onClick={item.onClick}
      aria-current={item.ativo ? 'page' : undefined}
      className={cn(
        'foco relative flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-sm',
        item.ativo ? 'text-text-primary' : 'text-icon-muted hover:text-text-secondary',
      )}
    >
      {item.ativo && <span className="absolute top-2 h-0 w-4 border-t-2 border-primary" aria-hidden="true" />}
      <span className="[&>svg]:h-icone-nav [&>svg]:w-icone-nav">{item.icone}</span>
      <span className={cn('text-caption', item.ativo && 'font-semibold')}>{item.rotulo}</span>
    </button>
  )
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-30 bg-surface shadow-top area-segura-baixo lg:hidden">
      <div className="flex h-rodape items-stretch">
        {itens.slice(0, metade).map(renderItem)}
        <div className="flex flex-1 items-start justify-center">
          <FabVenda onClick={onVenda} ativo={vendaAtiva} />
        </div>
        {itens.slice(metade).map(renderItem)}
      </div>
    </nav>
  )
}

/**
 * Barra lateral (seção 8): 248, surface-inverse, logo branco, botão "+ Venda" invertido,
 * itens de 44 com raio 10 em border-strong; ativo com fundo primary-hover e texto branco.
 */
export function Sidebar({
  itens,
  onVenda,
  rodape,
  onSair,
}: {
  itens: ItemNav[]
  onVenda?: () => void
  rodape?: { loja?: string; pessoa?: string }
  onSair?: () => void
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col bg-surface-inverse px-4 py-8 lg:flex">
      <div className="px-4">
        <Logo invertido />
      </div>
      {onVenda && (
        <button
          type="button"
          onClick={onVenda}
          className="foco mt-8 flex h-btn-md w-full items-center justify-center gap-2 rounded-md bg-surface text-label text-text-primary transition-[background-color] duration-fast ease-out hover:bg-background-muted active:scale-98"
        >
          <Plus weight="light" className="h-icone w-icone" />
          Venda
        </button>
      )}
      <nav aria-label="Navegação principal" className="mt-8 flex flex-1 flex-col gap-1">
        {itens.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            aria-current={item.ativo ? 'page' : undefined}
            className={cn(
              'foco flex h-sidebar-item items-center gap-3 rounded-md px-4 text-label transition-[background-color,color] duration-fast ease-out',
              item.ativo ? 'bg-primary-hover text-on-primary' : 'text-border-strong hover:bg-primary-hover hover:text-on-primary',
            )}
          >
            <span className="[&>svg]:h-icone [&>svg]:w-icone">{item.icone}</span>
            {item.rotulo}
          </button>
        ))}
      </nav>
      {(rodape || onSair) && (
        <div className="flex flex-col gap-1 border-t border-primary-hover px-4 pt-4">
          {rodape?.loja && <p className="truncate text-caption text-border-strong">{rodape.loja}</p>}
          {rodape?.pessoa && <p className="truncate text-caption text-on-primary">{rodape.pessoa}</p>}
          {onSair && (
            <button
              type="button"
              onClick={onSair}
              className="foco sublinhado mt-2 flex w-fit items-center gap-1 rounded-sm text-caption text-border-strong hover:text-on-primary"
            >
              <SignOut weight="light" className="h-icone-sm w-icone-sm" />
              Sair
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
