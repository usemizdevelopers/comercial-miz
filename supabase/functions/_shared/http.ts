// MIZ Loja · respostas JSON e CORS das Edge Functions.
// Origens permitidas vêm da variável ALLOWED_ORIGINS (separadas por vírgula).
// Padrão: só o ambiente local. Depois do deploy, inclua o domínio do Easypanel (docs/DEPLOY-EASYPANEL.md).

const PADRAO_ORIGENS = 'http://localhost:5173,http://127.0.0.1:5173'

function origensPermitidas(): string[] {
  return (Deno.env.get('ALLOWED_ORIGINS') ?? PADRAO_ORIGENS)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

export function cabecalhosCors(req: Request): Record<string, string> {
  const origem = req.headers.get('Origin') ?? ''
  const permitidas = origensPermitidas()
  return {
    'Access-Control-Allow-Origin': permitidas.includes(origem) ? origem : permitidas[0] ?? '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

/** Navegador de origem não permitida é recusado. Chamada sem Origin (servidor) segue para a checagem de token. */
export function origemRecusada(req: Request): boolean {
  const origem = req.headers.get('Origin')
  return origem !== null && !origensPermitidas().includes(origem)
}

export function json(req: Request, corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhosCors(req), 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export function erro(req: Request, mensagem: string, status = 400): Response {
  return json(req, { erro: mensagem }, status)
}

/** Erro com mensagem pronta para a tela e o status HTTP. */
export class ErroHttp extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

/** Envolve o handler: CORS, só POST, JSON e tradução de erros. */
export function servir(handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecalhosCors(req) })
    if (origemRecusada(req)) return erro(req, 'Origem não permitida.', 403)
    if (req.method !== 'POST') return erro(req, 'Método não permitido.', 405)
    try {
      return await handler(req)
    } catch (e) {
      if (e instanceof ErroHttp) return erro(req, e.message, e.status)
      console.error(e)
      return erro(req, 'Não deu certo. Tente de novo.', 500)
    }
  })
}

export async function lerCorpo<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    throw new ErroHttp('Dados inválidos.', 400)
  }
}
