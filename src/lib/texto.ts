/** Minúsculas e sem acento, para busca no navegador (igual à ideia de mizloja_sem_acento). */
export function semAcento(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
