/** Divide a meta da loja em partes iguais, em reais inteiros; o resto vai para as primeiras. */
export function dividirIgualmente(total: number, partes: number): number[] {
  if (partes <= 0 || total <= 0) return []
  const base = Math.floor(total / partes)
  let resto = Math.round(total - base * partes)
  return Array.from({ length: partes }, () => {
    const extra = resto > 0 ? 1 : 0
    resto -= extra
    return base + extra
  })
}

/** Soma ignorando vazios. */
export function somar(valores: Array<number | null | undefined>): number {
  return valores.reduce<number>((s, v) => s + (v ?? 0), 0)
}
