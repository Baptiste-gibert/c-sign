import { useParams, useNavigate } from '@/lib/navigation'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchAttendanceDay, fetchSessionsByDay } from '@/lib/api'
import { useSignatureSubmission } from '@/hooks/use-signature-submission'
import { ParticipantForm } from '@/components/ParticipantForm'
import type { ParticipantFormData } from '@/lib/schemas'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { PublicPageLayout } from '@/components/PublicPageLayout'

interface Session {
  id: string
  name: string
}

interface Event {
  title: string
  status?: string
  theme?: {
    themeId?: string
    customAccent?: string
    mode?: 'dark' | 'light'
  } | null
}

interface AttendanceDay {
  id: string
  date: string
  event: Event
}

export function SignPage() {
  const { t, i18n } = useTranslation(['public', 'common'])
  const { dayId } = useParams<{ dayId: string }>()
  const searchParams = useSearchParams()
  const sessionFromUrl = searchParams?.get('session') ?? null
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [day, setDay] = useState<AttendanceDay | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [eventStatus, setEventStatus] = useState<string | null>(null)

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
        setEventStatus(dayData.event?.status || null)
        setSessions(sessionsData.docs || [])

        // Auto-select session from URL param, or if only one session
        if (sessionFromUrl && sessionsData.docs?.some((s: Session) => String(s.id) === sessionFromUrl)) {
          setSelectedSessionId(sessionFromUrl)
        } else if (sessionsData.docs?.length === 1) {
          setSelectedSessionId(String(sessionsData.docs[0].id))
        }

        if (!sessionsData.docs || sessionsData.docs.length === 0) {
          setError(t('public:noSessionConfigured'))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common:errors.error'))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dayId])

  const handleSubmit = async (formData: ParticipantFormData, signatureBlob: Blob) => {
    if (!selectedSessionId) {
      setError(t('public:selectSessionRequired'))
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
          const params = new URLSearchParams({ participantName: formData.firstName })
          if (day?.event.theme?.themeId) params.set('themeId', day.event.theme.themeId)
          if (day?.event.theme?.customAccent) params.set('customAccent', day.event.theme.customAccent)
          if (day?.event.theme?.mode) params.set('mode', day.event.theme.mode)
          navigate(`/success?${params.toString()}`)
        },
      }
    )
  }

  // Format date for header
  const formattedDate = day
    ? new Date(day.date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : undefined

  if (loading) {
    return (
      <ThemeProvider>
        <PublicPageLayout>
          <div className="text-center" style={{ color: 'var(--text-sec)' }}>
            {t('common:loading')}
          </div>
        </PublicPageLayout>
      </ThemeProvider>
    )
  }

  if (error && !day) {
    return (
      <ThemeProvider>
        <PublicPageLayout>
          <Card style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-c)' }}>
            <CardContent className="pt-6">
              <p className="text-center" style={{ color: 'var(--error)' }}>
                {error}
              </p>
            </CardContent>
          </Card>
        </PublicPageLayout>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider themeId={day?.event.theme?.themeId} customAccent={day?.event.theme?.customAccent} mode={day?.event.theme?.mode || 'dark'}>
      <PublicPageLayout
        eventTitle={day?.event.title}
        eventDate={formattedDate}
        headerRight={<LanguageSwitcher />}
      >
        {/* Event not open block */}
        {eventStatus && eventStatus !== 'open' && eventStatus !== 'reopened' && (
          <Card style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-c)' }}>
            <CardContent className="pt-6">
              <p className="text-center font-medium" style={{ color: 'var(--error)' }}>
                {eventStatus === 'finalized'
                  ? t('public:eventFinalized')
                  : t('public:eventNotOpen')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Session selection */}
        {(eventStatus === 'open' || eventStatus === 'reopened') && sessions.length > 1 && !sessionFromUrl && (
          <div className="mb-6">
            <Card style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-c)' }}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label className="text-[13px]" style={{ color: 'var(--text)' }}>
                    {t('public:selectSession')} *
                  </Label>
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <label
                        key={session.id}
                        className="flex items-center space-x-2 cursor-pointer min-h-[44px] text-[13px]"
                        style={{ color: 'var(--text)' }}
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
        {(eventStatus === 'open' || eventStatus === 'reopened') && (
          <ParticipantForm
            onSubmit={handleSubmit}
            isPending={mutation.isPending}
            error={mutation.error}
          />
        )}
      </PublicPageLayout>
    </ThemeProvider>
  )
}
