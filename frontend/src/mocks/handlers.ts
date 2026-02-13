import { http, HttpResponse } from 'msw'
import { mockParticipants } from './data'

export const handlers = [
  // Mock SIMV search endpoint
  http.get('/api/simv/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')?.toLowerCase() || ''

    if (!query) {
      return HttpResponse.json({ results: [] })
    }

    // Filter by lastName, firstName, or professionalNumber
    const filtered = mockParticipants.filter((participant) => {
      const lastNameMatch = participant.lastName.toLowerCase().includes(query)
      const firstNameMatch = participant.firstName.toLowerCase().includes(query)
      const professionalNumberMatch = participant.professionalNumber?.includes(
        query,
      )

      return lastNameMatch || firstNameMatch || professionalNumberMatch
    })

    // Return max 10 results
    return HttpResponse.json({ results: filtered.slice(0, 10) })
  }),
]
