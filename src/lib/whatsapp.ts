/**
 * WhatsApp: normalização (igual a public.mizloja_normalizar_whatsapp),
 * máscara para digitação, formato para exibição, link wa.me e mensagens.
 */

export function somenteDigitos(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '')
}

/** Só dígitos; com 10 ou 11 dígitos (DDD + número) prefixa o DDI 55. Vazio vira null. */
export function normalizarWhatsapp(valor: string | null | undefined): string | null {
  const d = somenteDigitos(valor)
  if (d === '') return null
  if (d.length === 10 || d.length === 11) return `55${d}`
  return d
}

/** Retira o DDI 55 de um número já normalizado (12 ou 13 dígitos). */
function semDdi(digitos: string): string {
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) return digitos.slice(2)
  return digitos
}

/** Máscara enquanto digita: (31) 99999-9999 ou (31) 3333-0001. Aceita colar com +55. */
export function mascararWhatsapp(valor: string): string {
  const d = semDdi(somenteDigitos(valor)).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  const ddd = d.slice(0, 2)
  const resto = d.slice(2)
  if (resto.length <= 4) return `(${ddd}) ${resto}`
  // 11 dígitos: 5 + 4; até 10 dígitos: 4 + 4
  const corte = d.length === 11 ? 5 : 4
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

/** Exibição de um número guardado (ex.: 5531999998888 → (31) 99999-8888). */
export function formatarWhatsapp(valor: string | null | undefined): string {
  const d = semDdi(somenteDigitos(valor))
  if (d.length === 10 || d.length === 11) return mascararWhatsapp(d)
  return d
}

/** O número tem DDD + 8 ou 9 dígitos? */
export function whatsappValido(valor: string | null | undefined): boolean {
  const n = normalizarWhatsapp(valor)
  return n !== null && /^55\d{10,11}$/.test(n)
}

/** https://wa.me/<numero>?text=<texto codificado> */
export function linkWhatsapp(numero: string, texto?: string): string {
  const n = normalizarWhatsapp(numero) ?? ''
  const base = `https://wa.me/${n}`
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base
}

export function primeiroNome(nome: string | null | undefined): string {
  return (nome ?? '').trim().split(/\s+/)[0] ?? ''
}

/** Troca [NOME] pelo primeiro nome da cliente e [LOJA] pelo nome da loja. */
export function montarMensagem(modelo: string, dados: { nome?: string | null; loja?: string | null }): string {
  return modelo
    .replace(/\[NOME\]/g, primeiroNome(dados.nome))
    .replace(/\[LOJA\]/g, (dados.loja ?? '').trim())
}
