import { differenceInCalendarDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const FUSO = 'America/Sao_Paulo'

const moedaTabela = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const moedaInteira = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})
const numero = new Intl.NumberFormat('pt-BR')

/**
 * R$ 1.680,00 em tabelas; R$ 1.680 em destaques (sem centavos quando são zero).
 * O espaço depois de "R$" é inseparável, para o valor não quebrar de linha.
 */
export function formatarMoeda(valor: number | string | null | undefined, opcoes?: { destaque?: boolean }): string {
  const n = Number(valor ?? 0)
  if (opcoes?.destaque && Math.round(n * 100) % 100 === 0) {
    return moedaInteira.format(n)
  }
  return moedaTabela.format(n)
}

/** Só o número, sem "R$" (para o "R$" menor ao lado do display). */
export function formatarValor(valor: number | string | null | undefined, opcoes?: { destaque?: boolean }): string {
  return formatarMoeda(valor, opcoes).replace(/^R\$\s/, '')
}

export function formatarNumero(valor: number | null | undefined): string {
  return numero.format(valor ?? 0)
}

/** Data de calendário no fuso de São Paulo (independe do fuso do aparelho). */
export function dataLocal(data: Date | string | number): Date {
  const d = new Date(data)
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
  const [ano, mes, dia] = partes.split('-').map(Number)
  return new Date(ano ?? 1970, (mes ?? 1) - 1, dia ?? 1)
}

/** 03/10/2026 */
export function formatarData(data: Date | string | number): string {
  return format(dataLocal(data), 'dd/MM/yyyy')
}

/** 14:32 (São Paulo) */
export function formatarHora(data: Date | string | number): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' }).format(new Date(data))
}

/** 03/10/2026 · 14:32 */
export function formatarDataHora(data: Date | string | number): string {
  return `${formatarData(data)} · ${formatarHora(data)}`
}

/** "sábado, 3 de outubro" */
export function formatarDiaPorExtenso(data: Date | string | number): string {
  return format(dataLocal(data), "EEEE, d 'de' MMMM", { locale: ptBR })
}

/** "12 de set." */
export function formatarDiaMesCurto(data: Date | string | number): string {
  return `${format(dataLocal(data), "d 'de' MMM", { locale: ptBR })}.`
}

/**
 * Datas relativas até 7 dias ("hoje", "ontem", "há 3 dias");
 * depois, "12 de set.". `agora` é injetável para testes.
 */
export function dataRelativa(data: Date | string | number, agora: Date = new Date()): string {
  const dias = differenceInCalendarDays(dataLocal(agora), dataLocal(data))
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias <= 7) return `há ${dias} dias`
  return formatarDiaMesCurto(data)
}

/** "há 18 dias" sem limite de 7 dias (usado em "Última compra há 54 dias"). */
export function haDias(data: Date | string | number, agora: Date = new Date()): string {
  const dias = differenceInCalendarDays(dataLocal(agora), dataLocal(data))
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  return `há ${dias} dias`
}

/** Aniversário "6 de outubro" (com ano: "6 de outubro de 1990"). Sem dia/mês: ''. */
export function formatarAniversario(dia: number | null | undefined, mes: number | null | undefined, ano?: number | null): string {
  if (!dia || !mes) return ''
  const base = format(new Date(2000, mes - 1, dia), "d 'de' MMMM", { locale: ptBR })
  return ano ? `${base} de ${ano}` : base
}

/** "Bom dia" até 11h59, "Boa tarde" até 17h59, depois "Boa noite" (hora de São Paulo). */
export function saudacao(agora: Date = new Date()): string {
  const hora = Number(new Intl.DateTimeFormat('en-GB', { timeZone: FUSO, hour: '2-digit', hourCycle: 'h23' }).format(agora))
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}
