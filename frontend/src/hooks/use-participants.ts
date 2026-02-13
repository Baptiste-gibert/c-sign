import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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
      const res = await fetch(`/api/simv/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to search SIMV registry')
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
      const createRes = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(participantData),
      })
      if (!createRes.ok) {
        const error = await createRes.json()
        throw new Error(error.message || 'Failed to create participant')
      }
      const participantResult: PayloadParticipantResponse = await createRes.json()
      const newParticipant = participantResult.doc

      // Step 2: Get current event to read existing participants
      const eventRes = await fetch(`/api/events/${eventId}?depth=0`, {
        credentials: 'include',
      })
      if (!eventRes.ok) throw new Error('Failed to fetch event')
      const event = await eventRes.json()

      // Step 3: Add new participant to participants array
      const currentParticipants = event.participants || []
      const updatedParticipants = [...currentParticipants, newParticipant.id]

      // Step 4: Update event with merged participants array
      const updateRes = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ participants: updatedParticipants }),
      })
      if (!updateRes.ok) {
        const error = await updateRes.json()
        throw new Error(error.message || 'Failed to update event')
      }

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
      const eventRes = await fetch(`/api/events/${eventId}?depth=0`, {
        credentials: 'include',
      })
      if (!eventRes.ok) throw new Error('Failed to fetch event')
      const event = await eventRes.json()

      // Step 2: Filter out the participant ID
      const currentParticipants = event.participants || []
      const updatedParticipants = currentParticipants.filter(
        (id: string) => id !== participantId
      )

      // Step 3: Update event with remaining participants
      const updateRes = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ participants: updatedParticipants }),
      })
      if (!updateRes.ok) {
        const error = await updateRes.json()
        throw new Error(error.message || 'Failed to update event')
      }
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
      const createRes = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(participantData),
      })
      if (!createRes.ok) {
        const error = await createRes.json()
        throw new Error(error.message || 'Failed to create walk-in participant')
      }
      const participantResult: PayloadParticipantResponse = await createRes.json()
      const newParticipant = participantResult.doc

      // Step 2: Get current event
      const eventRes = await fetch(`/api/events/${eventId}?depth=0`, {
        credentials: 'include',
      })
      if (!eventRes.ok) throw new Error('Failed to fetch event')
      const event = await eventRes.json()

      // Step 3: Add to participants array
      const currentParticipants = event.participants || []
      const updatedParticipants = [...currentParticipants, newParticipant.id]

      // Step 4: Update event
      const updateRes = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ participants: updatedParticipants }),
      })
      if (!updateRes.ok) {
        const error = await updateRes.json()
        throw new Error(error.message || 'Failed to update event')
      }

      return newParticipant
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId] })
    },
  })
}
