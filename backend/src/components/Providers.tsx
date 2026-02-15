'use client'

import '@/i18n'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

import { ApiError } from '@/lib/api-fetch'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    function handleAuthError(error: unknown) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        qc.setQueryData(['auth', 'me'], null)
      }
    }

    const qc = new QueryClient({
      queryCache: new QueryCache({ onError: handleAuthError }),
      mutationCache: new MutationCache({ onError: handleAuthError }),
    })
    return qc
  })

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
