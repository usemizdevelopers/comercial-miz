/**
 * Traduz erros do Supabase (banco, Auth, Edge Functions, rede) para frases
 * curtas no tom da seção 11 do design system.
 */

type ErroQualquer = {
  message?: string
  code?: string
  status?: number
  name?: string
  details?: string | null
}

const PADRAO = 'Não deu certo. Tente de novo.'

// Códigos que o banco do MIZ Loja usa nas mensagens próprias (já em português)
const CODIGOS_COM_MENSAGEM_PROPRIA = new Set(['P0001', '23514', '23503', '42501', '22023'])

function pareceMensagemNossa(msg: string): boolean {
  // Mensagens dos gatilhos e funções do MIZ Loja: português, sem jargão do Postgres
  return /[ãçéêíóôõú]|^(Você|Digite|Escolha|Cliente|Venda|Peça|Essa|A |O |Só|Use|Meta|Acesso|Perfil)/.test(msg) &&
    !/violates|row-level|policy|constraint|relation|column/i.test(msg)
}

export function mensagemDeErro(erro: unknown): string {
  if (!erro) return PADRAO
  if (typeof erro === 'string') return erro

  const e = erro as ErroQualquer
  const msg = e.message ?? ''

  // Rede
  if (
    (e.name === 'TypeError' && /fetch/i.test(msg)) ||
    /Failed to fetch|NetworkError|Load failed|network/i.test(msg) ||
    e.name === 'FunctionsFetchError'
  ) {
    return 'Sem conexão. Confira a internet e tente de novo.'
  }

  // Auth
  if (/Invalid login credentials/i.test(msg)) return 'Usuário ou senha incorretos'
  if (/should be different from the old password|same_password/i.test(msg) || e.code === 'same_password') {
    return 'A nova senha precisa ser diferente da senha provisória.'
  }
  if (/Password should be at least|weak_password/i.test(msg) || e.code === 'weak_password') {
    return 'A senha precisa ter pelo menos 6 caracteres.'
  }
  if (/User is banned|user_banned/i.test(msg) || e.code === 'user_banned') {
    return 'Seu acesso está desativado.'
  }
  if (/JWT expired|refresh_token_not_found|Invalid Refresh Token/i.test(msg)) {
    return 'Sua sessão terminou. Entre de novo.'
  }

  // Duplicidade
  if (e.code === '23505') {
    if (/whatsapp/i.test(msg + (e.details ?? ''))) return 'Esse WhatsApp já está cadastrado nesta loja.'
    if (/cnpj/i.test(msg + (e.details ?? ''))) return 'Já existe uma loja com esse CNPJ.'
    if (/usuario/i.test(msg + (e.details ?? ''))) return 'Esse WhatsApp já é usado como acesso.'
    if (/codigo/i.test(msg + (e.details ?? ''))) return 'Já existe uma peça com esse código.'
    return 'Esse cadastro já existe.'
  }

  // Sem permissão (RLS)
  if (/row-level security|permission denied/i.test(msg) || (e.code === '42501' && !pareceMensagemNossa(msg))) {
    return 'Você não tem permissão para fazer isso.'
  }

  // Mensagens próprias do banco e das Edge Functions (já escritas para a usuária)
  if (msg && (CODIGOS_COM_MENSAGEM_PROPRIA.has(e.code ?? '') || pareceMensagemNossa(msg))) return msg

  if (e.code === '23503') return 'Esse registro está ligado a outros dados e não pode ser removido.'

  return PADRAO
}
