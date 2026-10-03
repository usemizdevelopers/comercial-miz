const CHAVE_AVISO = 'mizloja-aviso-entrar'

/** Erro de acesso com a frase pronta para a tela de entrar. */
export class ErroAcesso extends Error {}

/** Aviso que a tela de entrar mostra depois de uma saída forçada (acesso desativado). */
export function lerAvisoEntrar(): string | null {
  try {
    const aviso = sessionStorage.getItem(CHAVE_AVISO)
    sessionStorage.removeItem(CHAVE_AVISO)
    return aviso
  } catch {
    return null
  }
}

export function guardarAvisoEntrar(texto: string) {
  try {
    sessionStorage.setItem(CHAVE_AVISO, texto)
  } catch {
    // sem armazenamento: a tela de entrar abre sem aviso
  }
}
