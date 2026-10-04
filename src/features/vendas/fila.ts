import { mensagemDeErro } from '@/lib/erros'
import { ehErroDeRede, salvarVenda, type PacoteVenda } from './api'

/**
 * Fila de vendas sem conexão (guardada no navegador).
 * A venda já tem id próprio: reenviar não duplica (mizloja_salvar_venda devolve a que existe).
 * Cada venda fica marcada com quem lançou; só sobe com essa mesma pessoa logada.
 */
export interface VendaNaFila {
  pacote: PacoteVenda
  usuariaId: string
  clienteNome: string
  criadaEm: string
  /** erro do banco (não de rede) na última tentativa */
  erro?: string
}

const CHAVE = 'mizloja-fila-vendas'
const ouvintes = new Set<() => void>()
let cache: VendaNaFila[] | null = null

function ler(): VendaNaFila[] {
  if (cache) return cache
  try {
    const bruto = localStorage.getItem(CHAVE)
    cache = bruto ? (JSON.parse(bruto) as VendaNaFila[]) : []
  } catch {
    cache = []
  }
  return cache
}

function gravar(lista: VendaNaFila[]) {
  cache = lista
  try {
    if (lista.length) localStorage.setItem(CHAVE, JSON.stringify(lista))
    else localStorage.removeItem(CHAVE)
  } catch {
    // navegador sem espaço: a fila continua só na memória até fechar a página
  }
  ouvintes.forEach((o) => o())
}

export function assinarFila(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte)
  const aoMudarOutraAba = (e: StorageEvent) => {
    if (e.key === CHAVE) {
      cache = null
      ouvinte()
    }
  }
  window.addEventListener('storage', aoMudarOutraAba)
  return () => {
    ouvintes.delete(ouvinte)
    window.removeEventListener('storage', aoMudarOutraAba)
  }
}

export function vendasNaFila(): VendaNaFila[] {
  return ler()
}

export function guardarNaFila(v: VendaNaFila) {
  gravar([...ler().filter((x) => x.pacote.venda_id !== v.pacote.venda_id), v])
}

export function tirarDaFila(vendaId: string) {
  gravar(ler().filter((x) => x.pacote.venda_id !== vendaId))
}

let enviando = false

/**
 * Tenta subir as vendas da usuária. Para no primeiro erro de rede.
 * Erro do banco (ex.: peça desativada nesse meio-tempo) fica anotado na venda, para ela ver e decidir.
 * Devolve quantas subiram.
 */
export async function enviarFila(usuariaId: string, enviar: (p: PacoteVenda) => Promise<unknown> = salvarVenda): Promise<number> {
  if (enviando) return 0
  enviando = true
  let enviadas = 0
  try {
    for (const v of ler().filter((x) => x.usuariaId === usuariaId)) {
      try {
        await enviar(v.pacote)
        tirarDaFila(v.pacote.venda_id)
        enviadas++
      } catch (e) {
        if (ehErroDeRede(e)) break
        gravar(ler().map((x) => (x.pacote.venda_id === v.pacote.venda_id ? { ...x, erro: mensagemDeErro(e) } : x)))
      }
    }
  } finally {
    enviando = false
  }
  return enviadas
}
