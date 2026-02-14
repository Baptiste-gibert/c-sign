'use client'

// Compatibility layer: maps react-router-dom APIs to Next.js equivalents
// This avoids rewriting every component that uses useNavigate/useParams/Link

import { useParams as useNextParams } from 'next/navigation'

// Typed useParams compatible with react-router-dom generic signature
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useNextParams() as T
}

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function useNavigate() {
  const router = useRouter()
  return useCallback(
    (to: string, options?: { replace?: boolean; state?: Record<string, unknown> }) => {
      // Next.js doesn't support navigation state — encode in query if needed
      if (options?.state) {
        const params = new URLSearchParams()
        for (const [key, value] of Object.entries(options.state)) {
          params.set(key, String(value))
        }
        to = `${to}?${params.toString()}`
      }
      if (options?.replace) {
        router.replace(to)
      } else {
        router.push(to)
      }
    },
    [router],
  )
}

// SuccessPage uses useLocation().state — replace with useSearchParams
export function useLocationState() {
  const searchParams = useSearchParams()
  return {
    state: searchParams ? Object.fromEntries(searchParams.entries()) : {},
  }
}
