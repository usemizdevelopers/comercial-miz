import { ChipFiltro, ChipGroup, SelectField, TextField } from '@/components/ui'
import { useEquipe } from '@/hooks/useDadosLoja'
import { PRESETS, periodoValido, rotuloPeriodo, type Periodo, type Preset } from '@/lib/periodo'

/** Filtros do painel da ADM: período (Hoje · 7 dias · Este mês · Mês passado · Escolher datas) e vendedora. */
export function FiltroPeriodo({
  preset,
  periodo,
  onPreset,
  onDatas,
  vendedora,
  onVendedora,
}: {
  preset: Preset
  periodo: Periodo
  onPreset: (p: Preset) => void
  onDatas: (de: string, ate: string) => void
  vendedora?: string | null
  /** sem esta função, o filtro de vendedora não aparece */
  onVendedora?: (id: string | null) => void
}) {
  const { data: equipe } = useEquipe()
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <ChipGroup rotulo="Período">
          {PRESETS.map((p) => (
            <ChipFiltro key={p.valor} rotulo={p.rotulo} selecionado={preset === p.valor} onClick={() => onPreset(p.valor)} />
          ))}
        </ChipGroup>
        {onVendedora && (
          <SelectField
            aria-label="Vendedora"
            className="min-w-0 lg:w-grafico"
            value={vendedora ?? ''}
            onChange={(e) => onVendedora(e.target.value || null)}
            placeholder="Todas as vendedoras"
            opcoes={(equipe ?? []).map((u) => ({ valor: u.id, rotulo: u.situacao === 'ativa' ? u.nome : `${u.nome} (inativa)` }))}
          />
        )}
      </div>
      {preset === 'datas' ? (
        <div className="flex flex-wrap gap-3">
          <TextField
            rotulo="De"
            type="date"
            value={periodo.inicio}
            onChange={(e) => periodoValido({ inicio: e.target.value, fim: periodo.fim }) && onDatas(e.target.value, periodo.fim)}
          />
          <TextField
            rotulo="Até"
            type="date"
            value={periodo.fim}
            onChange={(e) => periodoValido({ inicio: periodo.inicio, fim: e.target.value }) && onDatas(periodo.inicio, e.target.value)}
          />
        </div>
      ) : (
        <p className="text-caption text-text-tertiary">{rotuloPeriodo(periodo)}</p>
      )}
    </div>
  )
}
