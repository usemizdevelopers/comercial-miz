import { addDays, endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { dataLocal } from './formatadores'

/** Períodos do painel da ADM (seção 11). Datas sempre como 'yyyy-MM-dd' do calendário de São Paulo. */
export type Preset = 'hoje' | '7dias' | 'mes' | 'mes_passado' | 'datas'

export const PRESETS: Array<{ valor: Preset; rotulo: string }> = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7dias', rotulo: '7 dias' },
  { valor: 'mes', rotulo: 'Este mês' },
  { valor: 'mes_passado', rotulo: 'Mês passado' },
  { valor: 'datas', rotulo: 'Escolher datas' },
]

export interface Periodo {
  inicio: string
  fim: string
}

export const iso = (d: Date) => format(d, 'yyyy-MM-dd')

/** Converte 'yyyy-MM-dd' em Date local (meio-dia, sem risco de virar o dia). */
export function lerIso(s: string): Date {
  const [a, m, d] = s.split('-').map(Number)
  return new Date(a ?? 1970, (m ?? 1) - 1, d ?? 1, 12)
}

export function hojeIso(agora: Date = new Date()): string {
  return iso(dataLocal(agora))
}

export function periodoDoPreset(p: Exclude<Preset, 'datas'>, agora: Date = new Date()): Periodo {
  const hoje = dataLocal(agora)
  switch (p) {
    case 'hoje':
      return { inicio: iso(hoje), fim: iso(hoje) }
    case '7dias':
      return { inicio: iso(addDays(hoje, -6)), fim: iso(hoje) }
    case 'mes':
      return { inicio: iso(startOfMonth(hoje)), fim: iso(hoje) }
    case 'mes_passado': {
      const m = subMonths(hoje, 1)
      return { inicio: iso(startOfMonth(m)), fim: iso(endOfMonth(m)) }
    }
  }
}

/** Período válido (início ≤ fim, até 2 anos). */
export function periodoValido(p: Periodo): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(p.fim)) return false
  const dias = (lerIso(p.fim).getTime() - lerIso(p.inicio).getTime()) / 86_400_000
  return dias >= 0 && dias <= 731
}

/** "1 a 15 de out." / "3 de out." */
export function rotuloPeriodo(p: Periodo): string {
  const i = lerIso(p.inicio)
  const f = lerIso(p.fim)
  if (p.inicio === p.fim) return format(i, "d 'de' MMM", { locale: ptBR })
  if (i.getMonth() === f.getMonth() && i.getFullYear() === f.getFullYear()) return `${format(i, 'd')} a ${format(f, "d 'de' MMM", { locale: ptBR })}`
  return `${format(i, "d 'de' MMM", { locale: ptBR })} a ${format(f, "d 'de' MMM", { locale: ptBR })}`
}

/** Primeiro dia do mês ('yyyy-MM-01') de uma data ISO, com deslocamento em meses. */
export function mesIso(base: string, deslocamento = 0): string {
  return iso(startOfMonth(subMonths(lerIso(base), -deslocamento)))
}

/** "outubro de 2026" com inicial maiúscula. */
export function nomeMes(mes: string): string {
  const t = format(lerIso(mes), "MMMM 'de' yyyy", { locale: ptBR })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/**
 * Variação contra o período anterior, em texto (sem seta colorida):
 * valores → "+12% vs. período anterior"; percentuais → "+3,2 p.p.".
 */
export function variacao(atual: number | null | undefined, anterior: number | null | undefined, tipo: 'valor' | 'pontos' = 'valor'): string {
  if (atual === null || atual === undefined) return 'sem dados'
  if (anterior === null || anterior === undefined) return 'sem período anterior'
  const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  if (tipo === 'pontos') {
    const d = atual - anterior
    if (Math.abs(d) < 0.05) return 'igual ao período anterior'
    return `${d > 0 ? '+' : '−'}${fmt(Math.abs(d))} p.p. vs. período anterior`
  }
  if (anterior === 0) return atual === 0 ? 'igual ao período anterior' : 'sem vendas no período anterior'
  const pct = ((atual - anterior) / anterior) * 100
  if (Math.abs(pct) < 0.5) return 'igual ao período anterior'
  return `${pct > 0 ? '+' : '−'}${fmt(Math.abs(Math.round(pct)))}% vs. período anterior`
}
