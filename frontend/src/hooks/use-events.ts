import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-fetch'

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
  theme?: { themeId?: string; customAccent?: string } | null
  qrGranularity?: 'event' | 'day' | 'session'
  daySessionConfig?: Array<{ date: string; fullDay: boolean; sessions: Array<{ name: string; startTime: string; endTime: string }> }>
  signatureCount?: number
  participantCount?: number
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
      const res = await apiFetch('/api/events?sort=-createdAt&depth=0')
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
      const res = await apiFetch(`/api/events/${id}?depth=1`)
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
      const res = await apiFetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })
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
      const res = await apiFetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })
      const data: PayloadEventResponse = await res.json()
      return data.doc
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['events', id] })
    },
  })
}
