import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchAttendanceDay, fetchSessionsByDay } from '@/lib/api'
import { useSignatureSubmission } from '@/hooks/use-signature-submission'
import { ParticipantForm } from '@/components/ParticipantForm'
import type { ParticipantFormData } from '@/lib/schemas'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

interface Session {
  id: string
  name: string
}

interface Event {
  title: string
}

interface AttendanceDay {
  id: string
  date: string
  event: Event
}

export function SignPage() {
  const { dayId } = useParams<{ dayId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [day, setDay] = useState<AttendanceDay | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const mutation = useSignatureSubmission()

  useEffect(() => {
    if (!dayId) return

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [dayData, sessionsData] = await Promise.all([
          fetchAttendanceDay(dayId),
          fetchSessionsByDay(dayId),
        ])

        setDay(dayData)
        setSessions(sessionsData.docs || [])

        // Auto-select if only one session
        if (sessionsData.docs?.length === 1) {
          setSelectedSessionId(String(sessionsData.docs[0].id))
        }

        if (!sessionsData.docs || sessionsData.docs.length === 0) {
          setError('Aucune session configurée pour cette journée')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dayId])

  const handleSubmit = async (formData: ParticipantFormData, signatureBlob: Blob) => {
    if (!selectedSessionId) {
      setError('Veuillez sélectionner une session')
      return
    }

    mutation.mutate(
      {
        formData,
        signatureBlob,
        sessionId: selectedSessionId,
      },
      {
        onSuccess: () => {
          navigate('/success', {
            state: { participantName: formData.firstName },
          })
        },
      }
    )
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-center text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (error && !day) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Event context */}
      {day && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{day.event.title}</h1>
          <p className="text-muted-foreground">
            {new Date(day.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      )}

      {/* Session selection */}
      {sessions.length > 1 && (
        <div className="mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label>Sélectionnez la session *</Label>
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <label
                      key={session.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="session"
                        value={session.id}
                        checked={selectedSessionId === String(session.id)}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="min-w-[20px] min-h-[20px]"
                      />
                      <span>{session.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Participant form */}
      <ParticipantForm
        onSubmit={handleSubmit}
        isPending={mutation.isPending}
        error={mutation.error}
      />
    </div>
  )
}
