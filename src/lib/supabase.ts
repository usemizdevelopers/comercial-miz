import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/supabase'

const url = import.meta.env.VITE_SUPABASE_URL
const chaveAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !chaveAnon) {
  // Falha cedo e com mensagem clara se o .env não foi preenchido
  throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env (veja .env.example).')
}

/**
 * Cliente do Supabase do site. Só usa a chave pública (anon): o que cada pessoa vê
 * é decidido pelo RLS do banco. A service role NUNCA entra no site.
 * A sessão fica salva no navegador e é renovada sozinha (fica aberta até a pessoa sair).
 */
export const supabase = createClient<Database>(url, chaveAnon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'mizloja-sessao',
  },
})
