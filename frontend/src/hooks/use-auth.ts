import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface User {
  id: string
  email: string
  role: 'admin' | 'organizer'
  firstName: string
  lastName: string
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/users/me', {
        credentials: 'include', // CRITICAL: send HTTP-only cookies
      })
      if (!res.ok) return null
      const data = await res.json()
      return data.user || null
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // CRITICAL: receive HTTP-only cookies
        body: JSON.stringify(credentials),
      })
      if (!res.ok) throw new Error('Login failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Logout failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null)
    },
  })

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
  }
}
