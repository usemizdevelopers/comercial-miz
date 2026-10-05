import { useLocation } from 'react-router-dom'

/**
 * Caminhos que mudam conforme o painel: as mesmas telas (ficha, kanban, lançar venda) servem
 * à vendedora (/clientes/…) e à ADM (/adm/clientes/…, sem sair do layout da dona).
 */
export function useCaminhos() {
  const { pathname } = useLocation()
  const adm = pathname.startsWith('/adm')
  return {
    adm,
    ficha: (id: string) => (adm ? `/adm/clientes/${id}` : `/clientes/${id}`),
    clientes: adm ? '/adm/clientes' : '/clientes',
    novaVenda: (clienteId?: string) => `${adm ? '/adm/venda/nova' : '/venda/nova'}${clienteId ? `?cliente=${clienteId}` : ''}`,
    inicio: adm ? '/adm' : '/hoje',
  }
}
