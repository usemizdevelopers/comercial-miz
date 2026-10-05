import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { DownloadSimple, Plus } from '@phosphor-icons/react'
import { Button, Card, CardVenda, Checkbox, EmptyState, SegmentedControl, SelectField, Selo, SkeletonCard, useToast } from '@/components/ui'
import { CabecalhoPagina } from '@/components/shared/CabecalhoPagina'
import { FiltroPeriodo } from '@/components/shared/FiltroPeriodo'
import { useCatalogo } from '@/hooks/useDadosLoja'
import { usePeriodo } from '@/hooks/usePeriodo'
import { useTelaGrande } from '@/hooks/useTelaGrande'
import { baixarArquivo, gerarCsv } from '@/lib/csv'
import { mensagemDeErro } from '@/lib/erros'
import { formatarData, formatarHora, formatarMoeda, formatarNumero } from '@/lib/formatadores'
import { PAGAMENTOS, TAMANHOS_OUTRA, resumirItens, rotuloPagamento, rotuloTamanho, textoItem } from '@/lib/vendas'
import { buscarVendasAdm, todasAsVendas, type FiltrosVendas } from './admApi'

const POR_PAGINA = 50
const TAMANHOS = ['PP', 'PP/P', 'P', 'M', 'M/G', 'G', 'GG', 'Unico'] as const satisfies ReadonlyArray<string>

/** /adm/vendas — todas as vendas da loja (especificação, seção 15). */
export default function VendasAdm() {
  const navegar = useNavigate()
  const toast = useToast()
  const telaGrande = useTelaGrande()
  const { preset, periodo, vendedora, escolherPreset, escolherDatas, escolherVendedora } = usePeriodo('mes')
  const { data: catalogo } = useCatalogo()
  const [miz, setMiz] = useState<'todas' | 'com' | 'sem'>('todas')
  const [peca, setPeca] = useState('')
  const [cor, setCor] = useState('')
  const [tamanho, setTamanho] = useState('')
  const [pagamento, setPagamento] = useState('')
  const [excluidas, setExcluidas] = useState(false)
  const [pagina, setPagina] = useState(0)
  const [exportando, setExportando] = useState(false)

  const filtros: FiltrosVendas = useMemo(
    () => ({
      periodo,
      vendedora,
      miz: miz === 'todas' ? null : miz === 'com',
      peca: peca || null,
      cor: cor || null,
      tamanho: tamanho || null,
      pagamento: pagamento || null,
      excluidas,
    }),
    [periodo, vendedora, miz, peca, cor, tamanho, pagamento, excluidas],
  )
  const chaveFiltros = JSON.stringify(filtros)
  const [chaveAnterior, setChaveAnterior] = useState(chaveFiltros)
  if (chaveAnterior !== chaveFiltros) {
    // filtro mudou: volta para a primeira página
    setChaveAnterior(chaveFiltros)
    setPagina(0)
  }

  const lista = useQuery({
    queryKey: ['adm', 'vendas', filtros, pagina],
    queryFn: () => buscarVendasAdm(filtros, POR_PAGINA, pagina * POR_PAGINA),
    placeholderData: keepPreviousData,
  })

  const cores = useMemo(() => {
    const s = new Set<string>()
    for (const p of catalogo ?? []) for (const c of p.cores) s.add(c.nome)
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [catalogo])

  const exportar = async () => {
    setExportando(true)
    try {
      const todas = await todasAsVendas(filtros)
      const csv = gerarCsv(todas, [
        { titulo: 'Data', valor: (v) => formatarData(v.data_venda) },
        { titulo: 'Hora', valor: (v) => formatarHora(v.data_venda) },
        { titulo: 'Cliente', valor: (v) => v.cliente_nome },
        { titulo: 'Vendedora', valor: (v) => v.vendedora_nome },
        { titulo: 'Itens', valor: (v) => v.itens.map(textoItem).join(' | ') },
        { titulo: 'Peças', valor: (v) => v.itens.reduce((s, i) => s + i.quantidade, 0) },
        { titulo: 'Tem Miz', valor: (v) => (v.tem_peca_miz ? 'Sim' : 'Não') },
        { titulo: 'Valor', valor: (v) => v.valor_total },
        { titulo: 'Pagamento', valor: (v) => rotuloPagamento(v.forma_pagamento) },
        { titulo: 'Excluída', valor: (v) => (v.excluida ? `Sim · ${v.motivo_exclusao ?? ''}` : '') },
      ])
      baixarArquivo(`vendas-${periodo.inicio}-a-${periodo.fim}.csv`, csv)
      toast.mostrar(`${todas.length} vendas exportadas`)
    } catch (e) {
      toast.mostrar(mensagemDeErro(e))
    } finally {
      setExportando(false)
    }
  }

  const d = lista.data
  const paginas = Math.max(1, Math.ceil((d?.total_linhas ?? 0) / POR_PAGINA))

  return (
    <div className="mx-auto flex w-full max-w-conteudo flex-col gap-4 px-gutter pb-10">
      <CabecalhoPagina
        titulo="Vendas"
        acao={
          <div className="flex flex-wrap gap-3">
            <Button variante="secundario" icone={<DownloadSimple weight="light" className="h-icone w-icone" />} carregando={exportando} disabled={!d?.total_linhas} onClick={() => void exportar()}>
              Exportar
            </Button>
            <Button icone={<Plus weight="light" className="h-icone w-icone" />} onClick={() => navegar('/adm/venda/nova')}>
              Venda
            </Button>
          </div>
        }
      />

      <FiltroPeriodo preset={preset} periodo={periodo} onPreset={escolherPreset} onDatas={escolherDatas} vendedora={vendedora} onVendedora={escolherVendedora} />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <SelectField aria-label="Peça Miz" value={peca} onChange={(e) => setPeca(e.target.value)} placeholder="Qualquer peça Miz" opcoes={(catalogo ?? []).map((p) => ({ valor: p.id, rotulo: `${p.codigo_referencia} · ${p.nome}` }))} />
        <SelectField aria-label="Cor" value={cor} onChange={(e) => setCor(e.target.value)} placeholder="Qualquer cor" opcoes={cores.map((c) => ({ valor: c, rotulo: c }))} />
        <SelectField
          aria-label="Tamanho"
          value={tamanho}
          onChange={(e) => setTamanho(e.target.value)}
          placeholder="Qualquer tamanho"
          opcoes={[...new Set<string>([...TAMANHOS, ...TAMANHOS_OUTRA])].map((t) => ({ valor: t, rotulo: rotuloTamanho(t) }))}
        />
        <SelectField aria-label="Pagamento" value={pagamento} onChange={(e) => setPagamento(e.target.value)} placeholder="Qualquer pagamento" opcoes={PAGAMENTOS.map((p) => ({ valor: p.valor, rotulo: p.rotulo }))} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl
          rotulo="Peça Miz no pedido"
          valor={miz}
          onMudar={setMiz}
          opcoes={[
            { valor: 'todas', rotulo: 'Todas' },
            { valor: 'com', rotulo: 'Com Miz' },
            { valor: 'sem', rotulo: 'Sem Miz' },
          ]}
        />
        <label className="flex items-center gap-1 text-body-sm">
          <Checkbox rotulo="Mostrar excluídas" marcado={excluidas} onMudar={setExcluidas} />
          Mostrar excluídas
        </label>
      </div>

      {lista.isLoading ? (
        <SkeletonCard linhas={6} />
      ) : lista.error ? (
        <Card>
          <EmptyState texto={mensagemDeErro(lista.error)} acao={<Button variante="secundario" onClick={() => void lista.refetch()}>Tentar de novo</Button>} />
        </Card>
      ) : !d || d.linhas.length === 0 ? (
        <Card>
          <EmptyState texto="Nenhuma venda com esses filtros." acao={<Button variante="secundario" onClick={() => navegar('/adm/venda/nova')}>Lançar venda</Button>} />
        </Card>
      ) : telaGrande ? (
        <Card semPadding className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="bg-background-muted text-label text-text-secondary">
              <tr>
                <th className="px-3 py-3">Data</th>
                <th className="px-3 py-3">Cliente</th>
                <th className="px-3 py-3">Vendedora</th>
                <th className="px-3 py-3">Itens</th>
                <th className="px-3 py-3">Miz</th>
                <th className="px-3 py-3 text-right">Valor</th>
                <th className="px-3 py-3">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {d.linhas.map((v) => (
                <tr key={v.id} className="cursor-pointer border-t border-border-subtle hover:bg-background-muted" onClick={() => navegar(`/adm/vendas/${v.id}`)}>
                  <td className="numeros whitespace-nowrap px-3 py-3">{formatarData(v.data_venda)}</td>
                  <td className="px-3 py-3 text-label">
                    {v.cliente_nome}
                    {v.excluida && <Selo tom="perigo" className="ml-2">Excluída</Selo>}
                  </td>
                  <td className="px-3 py-3">{v.vendedora_nome ?? '—'}</td>
                  <td className="max-w-form truncate px-3 py-3 text-text-secondary">{resumirItens(v.itens)}</td>
                  <td className="px-3 py-3">{v.tem_peca_miz ? <Selo tom="escuro">Miz</Selo> : null}</td>
                  <td className="numeros whitespace-nowrap px-3 py-3 text-right">{formatarMoeda(v.valor_total)}</td>
                  <td className="whitespace-nowrap px-3 py-3">{rotuloPagamento(v.forma_pagamento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {d.linhas.map((v) => (
            <CardVenda
              key={v.id}
              cliente={`${v.cliente_nome}${v.excluida ? ' (excluída)' : ''}`}
              valor={v.valor_total}
              itens={`${v.tem_peca_miz ? 'Miz · ' : ''}${resumirItens(v.itens)}`}
              rodape={`${formatarData(v.data_venda)} · ${v.vendedora_nome ?? ''} · ${rotuloPagamento(v.forma_pagamento)}`}
              onClick={() => navegar(`/adm/vendas/${v.id}`)}
            />
          ))}
        </div>
      )}

      {d && d.total_linhas > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 bg-background-muted">
          <p className="numeros text-body">
            {formatarNumero(d.vendas)} {d.vendas === 1 ? 'venda' : 'vendas'} · {formatarNumero(d.pecas)} peças ·{' '}
            <span className="text-label">{formatarMoeda(d.faturamento)}</span>
          </p>
          {excluidas && <p className="text-caption text-text-tertiary">Excluídas aparecem na lista, mas não entram nos totais.</p>}
        </Card>
      )}

      {paginas > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button variante="secundario" tamanho="pequeno" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>
            Anterior
          </Button>
          <p className="numeros text-body-sm text-text-secondary">
            Página {pagina + 1} de {paginas}
          </p>
          <Button variante="secundario" tamanho="pequeno" disabled={pagina + 1 >= paginas} onClick={() => setPagina(pagina + 1)}>
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
