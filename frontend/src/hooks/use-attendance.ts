import { useQuery } from '@tanstack/react-query'

interface AttendanceDay {
  id: string
  date: string
}

interface Session {
  id: string
  name: string
}

interface Signature {
  id: string
  participant: {
    id: string
    lastName: string
    firstName: string
  }
  createdAt: string
}

interface SessionWithSignatures {
  id: string
  name: string
  signatures: Signature[]
  signedCount: number
  totalExpected: number
}

interface AttendanceDayWithSessions {
  id: string
  date: string
  sessions: SessionWithSignatures[]
}

interface AttendanceDashboardData {
  attendanceDays: AttendanceDayWithSessions[]
}

interface PayloadSignaturesResponse {
  docs: any[]
}

interface PayloadSessionsResponse {
  docs: Session[]
}

export function useAttendanceDashboard(eventId: string) {
  return useQuery<AttendanceDashboardData>({
    queryKey: ['attendance', eventId],
    queryFn: async () => {
      // Step a: Get event with attendanceDays IDs and participants IDs
      const eventRes = await fetch(`/api/events/${eventId}?depth=0`, {
        credentials: 'include',
      })
      if (!eventRes.ok) throw new Error('Failed to fetch event')
      const event = await eventRes.json()

      const attendanceDayIds = event.attendanceDays || []
      const totalExpected = (event.participants || []).length

      // Step b: Fetch ALL attendance days in parallel
      const attendanceDaysData = await Promise.all(
        attendanceDayIds.map(async (dayId: string) => {
          const [dayRes, sessionsRes] = await Promise.all([
            fetch(`/api/attendance-days/${dayId}?depth=0`, {
              credentials: 'include',
            }),
            fetch(
              `/api/sessions?where[attendanceDay][equals]=${dayId}&depth=0`,
              {
                credentials: 'include',
              }
            ),
          ])

          if (!dayRes.ok) throw new Error('Failed to fetch attendance day')
          if (!sessionsRes.ok) throw new Error('Failed to fetch sessions')

          const day: AttendanceDay = await dayRes.json()
          const sessionsData: PayloadSessionsResponse = await sessionsRes.json()

          return {
            day,
            sessions: sessionsData.docs,
          }
        })
      )

      // Step c: For each day's sessions, fetch signatures in parallel
      const attendanceDays: AttendanceDayWithSessions[] = await Promise.all(
        attendanceDaysData.map(async ({ day, sessions }) => {
          const sessionsWithSignatures: SessionWithSignatures[] = await Promise.all(
            sessions.map(async (session) => {
              const signaturesRes = await fetch(
                `/api/signatures?where[session][equals]=${session.id}&depth=1`,
                {
                  credentials: 'include',
                }
              )

              if (!signaturesRes.ok) throw new Error('Failed to fetch signatures')

              const signaturesData: PayloadSignaturesResponse =
                await signaturesRes.json()

              const signatures: Signature[] = signaturesData.docs.map((sig) => ({
                id: sig.id,
                participant: {
                  id: sig.participant.id,
                  lastName: sig.participant.lastName,
                  firstName: sig.participant.firstName,
                },
                createdAt: sig.createdAt,
              }))

              return {
                id: session.id,
                name: session.name,
                signatures,
                signedCount: signatures.length,
                totalExpected,
              }
            })
          )

          return {
            id: day.id,
            date: day.date,
            sessions: sessionsWithSignatures,
          }
        })
      )

      return {
        attendanceDays,
      }
    },
    enabled: !!eventId,
    refetchInterval: 10000, // 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 5000,
  })
}
