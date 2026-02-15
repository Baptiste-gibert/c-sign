import { useParams, useNavigate } from '@/lib/navigation'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchEventByToken, fetchSessionsByDay } from '@/lib/api'
import { useSignatureSubmission } from '@/hooks/use-signature-submission'
import { ParticipantForm } from '@/components/ParticipantForm'
import type { ParticipantFormData } from '@/lib/schemas'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { PublicPageLayout } from '@/components/PublicPageLayout'
import { getFingerprint } from '@/lib/security/fingerprint'

interface Session {
  id: string
  name: string
}

interface AttendanceDay {
  id: string
  date: string
}

interface Event {
  id: string
  title: string
  status?: string
  attendanceDays: AttendanceDay[]
  theme?: {
    themeId?: string
    customAccent?: string
    mode?: 'dark' | 'light'
  } | null
}

export function SignPage() {
  const { t, i18n } = useTranslation(['public', 'common'])
  const { token } = useParams<{ token: string }>()
  const searchParams = useSearchParams()
  const dayFromUrl = searchParams?.get('day') ?? null
  const sessionFromUrl = searchParams?.get('session') ?? null
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [eventStatus, setEventStatus] = useState<string | null>(null)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)

  const mutation = useSignatureSubmission()

  // Load event by token
  useEffect(() => {
    if (!token) return

    const loadEvent = async () => {
      try {
        setLoading(true)
        setError(null)

        const eventData = await fetchEventByToken(token)
        setEvent(eventData)
        setEventStatus(eventData.status || null)

        // Check if event is open or reopened
        if (eventData.status !== 'open' && eventData.status !== 'reopened') {
          setLoading(false)
          return
        }

        // Handle day selection
        const days = eventData.attendanceDays || []
        if (days.length === 0) {
          setError(t('public:noSessionConfigured'))
          setLoading(false)
          return
        }

        // If URL has a day param, use that specific day
        if (dayFromUrl) {
          const matchingDay = days.find((d: AttendanceDay) => String(d.id) === dayFromUrl)
          if (matchingDay) {
            setSelectedDayId(matchingDay.id)
          } else {
            setError(t('public:invalidDay'))
            setLoading(false)
            return
          }
        } else if (days.length === 1) {
          // Auto-select if only one day
          setSelectedDayId(days[0].id)
        }
        // Otherwise, user needs to select a day (will show day selector)

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common:errors.error'))
        setLoading(false)
      }
    }

    loadEvent()
  }, [token, dayFromUrl])

  // Load sessions when a day is selected
  useEffect(() => {
    if (!selectedDayId) return

    const loadSessions = async () => {
      try {
        const sessionsData = await fetchSessionsByDay(selectedDayId)
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
      }
    }

    loadSessions()
  }, [selectedDayId, sessionFromUrl])

  // Load Turnstile script and handle CAPTCHA completion
  useEffect(() => {
    if (showCaptcha) {
      // Define global callback for Turnstile success
      ;(window as any).onTurnstileSuccess = (token: string) => {
        setCaptchaToken(token)
      }

      // Load Turnstile script if not already loaded
      if (!document.querySelector('script[src*="turnstile"]')) {
        const script = document.createElement('script')
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
        script.async = true
        document.body.appendChild(script)
      }
    }

    return () => {
      delete (window as any).onTurnstileSuccess
    }
  }, [showCaptcha])

  // Auto-retry submission when CAPTCHA is completed
  useEffect(() => {
    if (captchaToken && showCaptcha) {
      // CAPTCHA was completed, hide it and trigger form submission
      setShowCaptcha(false)
      // The form will be re-submitted automatically via the mutation
    }
  }, [captchaToken, showCaptcha])

  const handleSubmit = async (formData: ParticipantFormData, signatureBlob: Blob) => {
    if (!selectedSessionId) {
      setError(t('public:selectSessionRequired'))
      return
    }

    // Get device fingerprint
    const fingerprint = await getFingerprint()

    // Check rate limit before submission
    try {
      const rateCheckResponse = await fetch('/api/signatures/check-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceFingerprint: fingerprint }),
      })

      if (!rateCheckResponse.ok) {
        const errorData = await rateCheckResponse.json().catch(() => ({}))
        setRateLimitError(errorData.error || 'Trop de soumissions')
        return
      }

      const rateCheckResult = await rateCheckResponse.json()

      // If CAPTCHA challenge is required and no token yet, show CAPTCHA
      if (rateCheckResult.shouldChallenge && !captchaToken) {
        setShowCaptcha(true)
        return // Wait for user to complete CAPTCHA
      }
    } catch (err) {
      console.error('Rate check failed:', err)
      // Continue with submission if rate check fails (graceful degradation)
    }

    // Proceed with submission
    mutation.mutate(
      {
        formData,
        signatureBlob,
        sessionId: selectedSessionId,
        deviceFingerprint: fingerprint,
        captchaToken: captchaToken || undefined,
      },
      {
        onSuccess: () => {
          const params = new URLSearchParams({ participantName: formData.firstName })
          if (event?.theme?.themeId) params.set('themeId', event.theme.themeId)
          if (event?.theme?.customAccent) params.set('customAccent', event.theme.customAccent)
          if (event?.theme?.mode) params.set('mode', event.theme.mode)
          navigate(`/success?${params.toString()}`)
        },
      }
    )
  }

  // Format date for header
  const selectedDay = event?.attendanceDays?.find((d) => d.id === selectedDayId)
  const formattedDate = selectedDay
    ? new Date(selectedDay.date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', {
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

  if (error && !event) {
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
    <ThemeProvider themeId={event?.theme?.themeId} customAccent={event?.theme?.customAccent} mode={event?.theme?.mode || 'dark'}>
      <PublicPageLayout
        eventTitle={event?.title}
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

        {/* Day selection (when event has multiple days and no day selected) */}
        {(eventStatus === 'open' || eventStatus === 'reopened') && !selectedDayId && event && event.attendanceDays && event.attendanceDays.length > 1 && (
          <div className="mb-6">
            <Card style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-c)' }}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label className="text-[13px]" style={{ color: 'var(--text)' }}>
                    {t('public:selectDay')} *
                  </Label>
                  <div className="space-y-2">
                    {event.attendanceDays.map((day) => {
                      const dayDate = new Date(day.date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                      return (
                        <label
                          key={day.id}
                          className="flex items-center space-x-2 cursor-pointer min-h-[44px] text-[13px]"
                          style={{ color: 'var(--text)' }}
                        >
                          <input
                            type="radio"
                            name="day"
                            value={day.id}
                            checked={selectedDayId === String(day.id)}
                            onChange={(e) => setSelectedDayId(e.target.value)}
                            className="min-w-[20px] min-h-[20px]"
                          />
                          <span>{dayDate}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Session selection (when day is selected and event is open) */}
        {(eventStatus === 'open' || eventStatus === 'reopened') && selectedDayId && sessions.length > 1 && !sessionFromUrl && (
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

        {/* Rate limit error */}
        {rateLimitError && (
          <Card style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-c)' }}>
            <CardContent className="pt-6">
              <p className="text-center" style={{ color: 'var(--error)' }}>
                {rateLimitError}
              </p>
            </CardContent>
          </Card>
        )}

        {/* CAPTCHA challenge (shown when rate limit triggered) */}
        {showCaptcha && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <div className="mb-6">
            <Card style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-c)' }}>
              <CardContent className="pt-6">
                <p className="text-center mb-4" style={{ color: 'var(--text)' }}>
                  {t('public:captchaRequired', 'Veuillez compléter la vérification ci-dessous')}
                </p>
                <div className="flex justify-center">
                  <div
                    className="cf-turnstile"
                    data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                    data-callback="onTurnstileSuccess"
                    data-theme="dark"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Participant form (when event is open and day/session selected) */}
        {(eventStatus === 'open' || eventStatus === 'reopened') && selectedDayId && !showCaptcha && (
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
