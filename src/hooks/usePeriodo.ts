import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { periodoDoPreset, periodoValido, type Periodo, type Preset } from '@/lib/periodo'

/**
 * Período e vendedora do painel guardados na URL (?periodo=mes&de=…&ate=…&vendedora=…),
 * para o filtro sobreviver ao recarregar e virar link.
 */
export function usePeriodo(padrao: Exclude<Preset, 'datas'> = 'mes') {
  const [params, setParams] = useSearchParams()
  const preset = (params.get('periodo') as Preset | null) ?? padrao
  const vendedora = params.get('vendedora')

  const periodo: Periodo = useMemo(() => {
    if (preset === 'datas') {
      const p = { inicio: params.get('de') ?? '', fim: params.get('ate') ?? '' }
      if (periodoValido(p)) return p
      return periodoDoPreset(padrao)
    }
    return periodoDoPreset(preset)
  }, [preset, params, padrao])

  const mudar = (novo: Record<string, string | null>) => {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(novo)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    setParams(p, { replace: true })
  }

  return {
    preset,
    periodo,
    vendedora,
    escolherPreset: (p: Preset) =>
      p === 'datas' ? mudar({ periodo: 'datas', de: periodo.inicio, ate: periodo.fim }) : mudar({ periodo: p, de: null, ate: null }),
    escolherDatas: (de: string, ate: string) => mudar({ periodo: 'datas', de, ate }),
    escolherVendedora: (id: string | null) => mudar({ vendedora: id }),
  }
}
