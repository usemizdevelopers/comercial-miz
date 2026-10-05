/**
 * Planilha CSV no formato que o Excel em português abre direto:
 * separador ";", vírgula decimal, BOM UTF-8 e aspas quando precisa.
 */
export interface ColunaCsv<T> {
  titulo: string
  valor: (linha: T) => string | number | null | undefined
}

function celula(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'number' ? v.toLocaleString('pt-BR', { useGrouping: false, maximumFractionDigits: 2 }) : v
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function gerarCsv<T>(linhas: T[], colunas: ColunaCsv<T>[]): string {
  const cab = colunas.map((c) => celula(c.titulo)).join(';')
  const corpo = linhas.map((l) => colunas.map((c) => celula(c.valor(l))).join(';'))
  return '﻿' + [cab, ...corpo].join('\r\n')
}

/** Baixa um texto como arquivo (no navegador). */
export function baixarArquivo(nome: string, conteudo: string, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
