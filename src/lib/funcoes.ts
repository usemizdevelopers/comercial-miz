import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

/**
 * Chamada às Edge Functions do MIZ Loja (service role só no servidor).
 * Toda função responde JSON: sucesso = dados; erro = { erro: "mensagem em português" }.
 */

export interface AcessoCriado {
  usuario: string
  senha: string
  /** WhatsApp (normalizado) de quem recebe o acesso */
  whatsapp: string
  nome: string
  /** Texto pronto da mensagem de acesso (link, usuário e senha provisória) */
  mensagem: string
}

export interface RespostasFuncoes {
  'mizloja-criar-loja': AcessoCriado & { loja_id: string; usuaria_id: string }
  'mizloja-criar-usuaria': AcessoCriado & { usuaria_id: string }
  'mizloja-nova-senha': AcessoCriado
  'mizloja-alterar-situacao': { ok: true; afetadas: number }
  'mizloja-criar-admin': AcessoCriado & { admin_id: string }
  'mizloja-alterar-login': AcessoCriado
}

export class ErroFuncao extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = 'ErroFuncao'
  }
}

export async function chamarFuncao<N extends keyof RespostasFuncoes>(
  nome: N,
  corpo: Record<string, unknown>,
): Promise<RespostasFuncoes[N]> {
  const { data, error } = await supabase.functions.invoke(nome, { body: corpo })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      let mensagem = 'Não deu certo. Tente de novo.'
      try {
        const json = (await error.context.json()) as { erro?: string }
        if (json?.erro) mensagem = json.erro
      } catch {
        // resposta sem JSON: mantém a mensagem padrão
      }
      throw new ErroFuncao(mensagem, error.context.status)
    }
    throw error
  }
  return data as RespostasFuncoes[N]
}
