/** Data de nascimento em partes (dia, mês, ano opcional), como digitada no DateParts. */
export interface DataPartes {
  dia: string
  mes: string
  ano: string
}

/** Converte as partes em {aniv_dia, aniv_mes, aniv_ano}; devolve erro em texto se inválido. */
export function lerDataPartes(p: DataPartes): { dia: number | null; mes: number | null; ano: number | null; erro?: string } {
  const dia = p.dia ? Number(p.dia) : null
  const mes = p.mes ? Number(p.mes) : null
  const ano = p.ano ? Number(p.ano) : null
  if (dia === null && mes === null && ano === null) return { dia, mes, ano }
  if (dia === null || mes === null) return { dia, mes, ano, erro: 'Informe dia e mês' }
  if (mes < 1 || mes > 12) return { dia, mes, ano, erro: 'Mês vai de 1 a 12' }
  const maxDia = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1] ?? 31
  if (dia < 1 || dia > maxDia) return { dia, mes, ano, erro: 'Confira o dia' }
  if (ano !== null && (ano < 1900 || ano > new Date().getFullYear())) return { dia, mes, ano, erro: 'Confira o ano' }
  return { dia, mes, ano }
}
