import { normalizarWhatsapp } from './whatsapp'

/** Domínio dos e-mails técnicos do Auth (nunca recebem e-mail). */
export const DOMINIO_EMAIL_TECNICO = 'mizloja.usemiz.app'

/** Usuário (WhatsApp, com ou sem máscara) → e-mail técnico usado no Auth. */
export function emailTecnico(usuario: string): string {
  const n = normalizarWhatsapp(usuario) ?? usuario.trim().toLowerCase()
  return `${n}@${DOMINIO_EMAIL_TECNICO}`
}

export const SENHA_MINIMO = 6

export function linkSuporteMiz(): string {
  return `https://wa.me/${import.meta.env.VITE_WHATSAPP_SUPORTE_MIZ ?? ''}`
}
