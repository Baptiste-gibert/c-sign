import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface PayloadEvent {
  id: string
  title: string
  location: string
  organizerName: string
  organizerEmail: string
  expenseType: string
  status: 'draft' | 'open' | 'finalized' | 'reopened'
  selectedDates: Array<{ id: string; date: string }>
  attendanceDays?: Array<{ id: string; date: string }>
  participants?: Array<{ id: string; lastName: string; firstName: string }>
  cnovDeclarationNumber?: string
  createdBy: string | { id: string }
  createdAt: string
  updatedAt: string
}

interface PayloadEventsResponse {
  docs: PayloadEvent[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

interface PayloadEventResponse {
  doc: PayloadEvent
}

export function useEvents() {
  return useQuery<PayloadEvent[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch('/api/events?sort=-createdAt&depth=0', {
        credentials: 'include', // CRITICAL: send HTTP-only cookies
      })
      if (!res.ok) throw new Error('Failed to fetch events')
      const data: PayloadEventsResponse = await res.json()
      return data.docs
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useEvent(id: string) {
  return useQuery<PayloadEvent>({
    queryKey: ['events', id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}?depth=1`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch event')
      const data = await res.json()
      return data
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

export function useCreateEvent(options?: { onSuccess?: (event: PayloadEvent) => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (eventData: any) => {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // CRITICAL: send HTTP-only cookies
        body: JSON.stringify(eventData),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create event')
      }
      const data: PayloadEventResponse = await res.json()
      return data.doc
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      options?.onSuccess?.(event)
    },
  })
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (eventData: any) => {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(eventData),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to update event')
      }
      const data: PayloadEventResponse = await res.json()
      return data.doc
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['events', id] })
    },
  })
}
