import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SignPage } from '@/pages/SignPage'
import { SuccessPage } from '@/pages/SuccessPage'

const queryClient = new QueryClient()

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <h1 className="text-4xl font-bold text-neutral-900">c-sign</h1>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign/:dayId" element={<SignPage />} />
        <Route path="/success" element={<SuccessPage />} />
      </Routes>
    </QueryClientProvider>
  )
}

export default App
