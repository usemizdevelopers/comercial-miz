import { somenteDigitos } from './whatsapp'

/** Valida os dois dígitos verificadores do CNPJ. */
export function validarCnpj(valor: string | null | undefined): boolean {
  const d = somenteDigitos(valor)
  if (d.length !== 14) return false
  if (/^(\d)\1{13}$/.test(d)) return false

  const calcular = (base: string): number => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const soma = base.split('').reduce((acc, c, i) => acc + Number(c) * (pesos[i] ?? 0), 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const dv1 = calcular(d.slice(0, 12))
  const dv2 = calcular(d.slice(0, 12) + dv1)
  return d.endsWith(`${dv1}${dv2}`)
}

/** Máscara progressiva: 11.111.111/0001-11 */
export function mascararCnpj(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 14)
  let r = d.slice(0, 2)
  if (d.length > 2) r += `.${d.slice(2, 5)}`
  if (d.length > 5) r += `.${d.slice(5, 8)}`
  if (d.length > 8) r += `/${d.slice(8, 12)}`
  if (d.length > 12) r += `-${d.slice(12, 14)}`
  return r
}
