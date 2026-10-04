import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, Plus } from '@phosphor-icons/react'
import { Button, Card, CardPeca, EmptyState, SearchField, SegmentedControl } from '@/components/ui'
import { CabecalhoPagina } from '@/components/shared/CabecalhoPagina'
import { ListaCarregando } from '@/components/shared/EstadoCarregando'
import { mensagemDeErro } from '@/lib/erros'
import { listarPecas } from './api'
import { semAcento } from '@/lib/texto'

type Filtro = 'ativas' | 'inativas' | 'todas'

/** /miz/catalogo — peças Miz (sem foto): nome, código e bolinhas das cores ativas. */
export default function Catalogo() {
  const navegar = useNavigate()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('ativas')
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['miz', 'pecas'], queryFn: listarPecas })

  const filtradas = useMemo(() => {
    const termo = semAcento(busca)
    return (data ?? [])
      .filter((p) => (filtro === 'todas' ? true : filtro === 'ativas' ? p.ativa : !p.ativa))
      .filter((p) => !termo || semAcento(p.nome).includes(termo) || semAcento(p.codigo_referencia).includes(termo))
  }, [data, busca, filtro])

  const contagem = (f: Filtro) => (data ?? []).filter((p) => (f === 'todas' ? true : f === 'ativas' ? p.ativa : !p.ativa)).length

  return (
    <div className="mx-auto w-full max-w-conteudo px-gutter">
      <CabecalhoPagina
        titulo="Catálogo"
        subtitulo="Peças Miz, iguais para todas as lojas"
        acao={
          <Button icone={<Plus weight="light" className="h-icone w-icone" />} onClick={() => navegar('/miz/catalogo/nova')}>
            Peça
          </Button>
        }
      />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
        <SearchField value={busca} onChange={setBusca} placeholder="Buscar por nome ou código" className="w-full lg:max-w-folha" />
        <SegmentedControl<Filtro>
          rotulo="Mostrar"
          valor={filtro}
          onMudar={setFiltro}
          opcoes={[
            { valor: 'ativas', rotulo: `Ativas ${contagem('ativas')}` },
            { valor: 'inativas', rotulo: `Inativas ${contagem('inativas')}` },
            { valor: 'todas', rotulo: 'Todas' },
          ]}
        />
      </div>

      {isLoading ? (
        <ListaCarregando />
      ) : error ? (
        <Card>
          <EmptyState texto={mensagemDeErro(error)} acao={<Button variante="secundario" onClick={() => void refetch()}>Tentar de novo</Button>} />
        </Card>
      ) : filtradas.length === 0 ? (
        <Card>
          <EmptyState icone={<Package weight="light" />} texto={busca ? `Não encontramos "${busca}".` : 'Nenhuma peça aqui.'} />
        </Card>
      ) : (
        <div className="grid gap-3 pb-10 md:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((p) => (
            <CardPeca
              key={p.id}
              nome={p.nome}
              codigo={`${p.codigo_referencia} · ${p.tamanhos.map((t) => (t.valor === 'Unico' ? 'Único' : t.valor)).join(', ') || 'sem tamanho'}`}
              cores={p.cores.filter((c) => c.ativa).map((c) => ({ id: c.id, nome: c.nome, hex: c.valor }))}
              inativa={!p.ativa}
              onClick={() => navegar(`/miz/catalogo/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
