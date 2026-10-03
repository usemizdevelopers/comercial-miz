import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Storefront } from '@phosphor-icons/react'
import { Button, Card, EmptyState, SearchField, Selo } from '@/components/ui'
import { CabecalhoPagina } from '@/components/shared/CabecalhoPagina'
import { ListaCarregando } from '@/components/shared/EstadoCarregando'
import { mascararCnpj } from '@/lib/cnpj'
import { formatarData } from '@/lib/formatadores'
import { mensagemDeErro } from '@/lib/erros'
import { listarLojas, type LojaResumo } from './api'
import { NovaLoja } from './NovaLoja'
import { semAcento } from './texto'

function SeloSituacao({ situacao }: { situacao: string }) {
  return situacao === 'ativa' ? <Selo tom="contorno">Ativa</Selo> : <Selo tom="perigo">Inativa</Selo>
}

/** /miz/lojas — todas as lojas, busca por nome, cidade ou CNPJ, e "+ Loja". */
export default function Lojas() {
  const navegar = useNavigate()
  const [busca, setBusca] = useState('')
  const [nova, setNova] = useState(false)
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['miz', 'lojas'], queryFn: listarLojas })

  const filtradas = useMemo(() => {
    const termo = semAcento(busca)
    const digitos = busca.replace(/\D/g, '')
    if (!termo) return data ?? []
    return (data ?? []).filter(
      (l) => semAcento(l.nome).includes(termo) || semAcento(l.cidade).includes(termo) || (digitos.length >= 2 && l.cnpj.includes(digitos)),
    )
  }, [data, busca])

  const abrir = (l: LojaResumo) => navegar(`/miz/lojas/${l.id}`)

  return (
    <div className="mx-auto w-full max-w-conteudo px-gutter">
      <CabecalhoPagina
        titulo="Lojas"
        subtitulo={data ? `${data.length} ${data.length === 1 ? 'loja' : 'lojas'}` : undefined}
        acao={
          <Button icone={<Plus weight="light" className="h-icone w-icone" />} onClick={() => setNova(true)}>
            Loja
          </Button>
        }
      />
      <SearchField value={busca} onChange={setBusca} placeholder="Buscar por nome, cidade ou CNPJ" className="mb-6 max-w-form" />

      {isLoading ? (
        <ListaCarregando />
      ) : error ? (
        <Card>
          <EmptyState texto={mensagemDeErro(error)} acao={<Button variante="secundario" onClick={() => void refetch()}>Tentar de novo</Button>} />
        </Card>
      ) : filtradas.length === 0 ? (
        <Card>
          <EmptyState
            icone={<Storefront weight="light" />}
            texto={busca ? `Não encontramos "${busca}".` : 'Nenhuma loja ainda.'}
            acao={!busca && <Button variante="secundario" onClick={() => setNova(true)}>Criar a primeira loja</Button>}
          />
        </Card>
      ) : (
        <>
          {/* Computador: tabela */}
          <div className="hidden overflow-hidden rounded-lg border border-border-subtle bg-surface lg:block">
            <table className="w-full text-left">
              <thead className="bg-background-muted text-overline uppercase text-text-secondary">
                <tr>
                  <th className="px-5 py-3 font-semibold">Loja</th>
                  <th className="px-5 py-3 font-semibold">Cidade</th>
                  <th className="px-5 py-3 font-semibold">CNPJ</th>
                  <th className="px-5 py-3 font-semibold">Dona</th>
                  <th className="px-5 py-3 text-right font-semibold">Vendedoras</th>
                  <th className="px-5 py-3 font-semibold">Situação</th>
                  <th className="px-5 py-3 font-semibold">Criada em</th>
                </tr>
              </thead>
              <tbody className="text-body-sm">
                {filtradas.map((l) => (
                  <tr
                    key={l.id}
                    tabIndex={0}
                    onClick={() => abrir(l)}
                    onKeyDown={(e) => e.key === 'Enter' && abrir(l)}
                    className="foco cursor-pointer border-t border-border-subtle transition-[background-color] duration-fast ease-out hover:bg-background-muted"
                  >
                    <td className="px-5 py-4 text-label">{l.nome}</td>
                    <td className="px-5 py-4">
                      {l.cidade}/{l.uf}
                    </td>
                    <td className="numeros px-5 py-4">{mascararCnpj(l.cnpj)}</td>
                    <td className="px-5 py-4">{l.dona?.nome ?? '—'}</td>
                    <td className="numeros px-5 py-4 text-right">{l.vendedorasAtivas}</td>
                    <td className="px-5 py-4">
                      <SeloSituacao situacao={l.situacao} />
                    </td>
                    <td className="numeros px-5 py-4 text-text-tertiary">{formatarData(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular e tablet: cards */}
          <div className="flex flex-col gap-3 lg:hidden">
            {filtradas.map((l) => (
              <Card key={l.id} tocavel onClick={() => abrir(l)} className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-h3">{l.nome}</p>
                  <SeloSituacao situacao={l.situacao} />
                </div>
                <p className="text-body-sm text-text-secondary">
                  {l.cidade}/{l.uf} · {mascararCnpj(l.cnpj)}
                </p>
                <p className="text-caption text-text-tertiary">
                  Dona: {l.dona?.nome ?? '—'} · {l.vendedorasAtivas} {l.vendedorasAtivas === 1 ? 'vendedora' : 'vendedoras'} · desde {formatarData(l.created_at)}
                </p>
              </Card>
            ))}
          </div>
        </>
      )}
      <NovaLoja aberta={nova} onFechar={() => setNova(false)} />
    </div>
  )
}
