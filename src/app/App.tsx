import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/ui'
import { TelaCarregando } from '@/components/shared/TelaCarregando'
import { SessaoProvider } from './sessao/SessaoProvider'
import { Rotas } from './rotas'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SessaoProvider>
          <BrowserRouter>
            <Suspense fallback={<TelaCarregando />}>
              <Rotas />
            </Suspense>
          </BrowserRouter>
        </SessaoProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
