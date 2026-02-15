import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api-fetch'

export interface SimvParticipant {
  id: string
  lastName: string
  firstName: string
  email: string
  city: string
  professionalNumber?: string
  beneficiaryType: string
}

export interface Participant {
  id: string
  lastName: string
  firstName: string
  email: string
  city: string
  professionalNumber?: string
  beneficiaryType: string
}

interface SimvSearchResponse {
  results: SimvParticipant[]
}

interface PayloadParticipantResponse {
  doc: Participant
}

export function useSimvSearch(query: string) {
  return useQuery<SimvParticipant[]>({
    queryKey: ['simv', 'search', query],
    queryFn: async () => {
      const res = await apiFetch(`/api/simv/search?q=${encodeURIComponent(query)}`)
      const data: SimvSearchResponse = await res.json()
      return data.results
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useAddParticipant(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (participantData: {
      lastName: string
      firstName: string
      email: string
      city: string
      professionalNumber?: string
      beneficiaryType: string
    }) => {
      // Step 1: Create participant in Payload
      const createRes = await apiFetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participantData),
      })
      const participantResult: PayloadParticipantResponse = await createRes.json()
      const newParticipant = participantResult.doc

      // Step 2: Get current event to read existing participants
      const eventRes = await apiFetch(`/api/events/${eventId}?depth=0`)
      const event = await eventRes.json()

      // Step 3: Add new participant to participants array
      const currentParticipants = event.participants || []
      const updatedParticipants = [...currentParticipants, newParticipant.id]

      // Step 4: Update event with merged participants array
      await apiFetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: updatedParticipants }),
      })

      return newParticipant
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId] })
    },
  })
}

export function useRemoveParticipant(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (participantId: string) => {
      // Step 1: Get current event to read existing participants
      const eventRes = await apiFetch(`/api/events/${eventId}?depth=0`)
      const event = await eventRes.json()

      // Step 2: Filter out the participant ID
      const currentParticipants = event.participants || []
      const updatedParticipants = currentParticipants.filter((id: string) => id !== participantId)

      // Step 3: Update event with remaining participants
      await apiFetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: updatedParticipants }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId] })
    },
  })
}

export function useAddWalkIn(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (participantData: {
      lastName: string
      firstName: string
      email: string
      city: string
      professionalNumber?: string
      beneficiaryType: string
    }) => {
      // Step 1: Create participant
      const createRes = await apiFetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participantData),
      })
      const participantResult: PayloadParticipantResponse = await createRes.json()
      const newParticipant = participantResult.doc

      // Step 2: Get current event
      const eventRes = await apiFetch(`/api/events/${eventId}?depth=0`)
      const event = await eventRes.json()

      // Step 3: Add to participants array
      const currentParticipants = event.participants || []
      const updatedParticipants = [...currentParticipants, newParticipant.id]

      // Step 4: Update event
      await apiFetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: updatedParticipants }),
      })

      return newParticipant
    },
    onMutate: async (newParticipant) => {
      await queryClient.cancelQueries({ queryKey: ['events', eventId] })
      const previousEvent = queryClient.getQueryData(['events', eventId])
      queryClient.setQueryData(
        ['events', eventId],
        (old: { participants?: Participant[] } | undefined) => {
          if (!old) return old
          return {
            ...old,
            participants: [
              ...(old.participants || []),
              {
                id: 'temp-' + Date.now(),
                ...newParticipant,
              },
            ],
          }
        },
      )
      return { previousEvent }
    },
    onError: (_err, _newParticipant, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData(['events', eventId], context.previousEvent)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId] })
    },
  })
}
