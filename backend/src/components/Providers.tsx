'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { ApiError } from '@/lib/api-fetch'
import '@/i18n'

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

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
