import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/ui'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

// Vitrine dos componentes: só existe em desenvolvimento (fica fora do build de produção)
const VitrineComponentes = import.meta.env.DEV ? lazy(() => import('@/features/dev/VitrineComponentes')) : null

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              {VitrineComponentes && <Route path="/dev/componentes" element={<VitrineComponentes />} />}
              <Route path="/" element={import.meta.env.DEV ? <Navigate to="/dev/componentes" replace /> : null} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
