import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAttendanceDashboard } from '@/hooks/use-attendance'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Circle, ChevronDown, Calendar, QrCode, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Participant } from '@/hooks/use-participants'

interface AttendanceDashboardProps {
  eventId: string
  participants: Participant[]
  qrGranularity?: 'event' | 'day' | 'session'
  signingToken?: string
}

export function AttendanceDashboard({
  eventId,
  participants,
  qrGranularity,
  signingToken,
}: AttendanceDashboardProps) {
  const { t, i18n } = useTranslation(['organizer', 'common'])
  const { data, isLoading, isError, error } = useAttendanceDashboard(eventId)
  const locale = i18n.language === 'en' ? enUS : fr

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Sort days: today first, then most recent
  const sortedDays = useMemo(() => {
    if (!data) return []
    return [...data.attendanceDays]
      .map((day) => {
        const dateStr = new Date(day.date).toISOString().split('T')[0]
        return { ...day, dateStr, isToday: dateStr === today }
      })
      .sort((a, b) => {
        if (a.isToday && !b.isToday) return -1
        if (!a.isToday && b.isToday) return 1
        return b.dateStr.localeCompare(a.dateStr)
      })
  }, [data, today])

  // Compute initial collapsed state: auto-collapse past days at 100%
  const initialCollapsed = useMemo(() => {
    const collapsed: Record<string, boolean> = {}
    for (const day of sortedDays) {
      const dayTotal = day.sessions.reduce((a, s) => a + s.totalExpected, 0)
      const daySigned = day.sessions.reduce((a, s) => a + s.signedCount, 0)
      const isPast = day.dateStr < today
      if (isPast && dayTotal > 0 && daySigned === dayTotal) {
        collapsed[day.id] = true
      }
    }
    return collapsed
  }, [sortedDays, today])

  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({})

  // Seed collapsed state once when data arrives
  useEffect(() => {
    if (Object.keys(initialCollapsed).length > 0) {
      setCollapsedDays((prev) => {
        // Only seed keys that don't already have user overrides
        const next = { ...prev }
        for (const [key, val] of Object.entries(initialCollapsed)) {
          if (!(key in next)) next[key] = val
        }
        return next
      })
    }
  }, [initialCollapsed])

  const toggleCollapse = (dayId: string) => {
    setCollapsedDays((prev) => ({ ...prev, [dayId]: !prev[dayId] }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        <span className="ml-2 text-neutral-600">{t('organizer:attendance.loading')}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-4 text-red-600">
        {t('common:errors.error')}:{' '}
        {error instanceof Error ? error.message : t('common:errors.unknownError')}
      </div>
    )
  }

  if (!data || data.attendanceDays.length === 0) {
    return (
      <div className="py-8 text-center text-neutral-500">{t('organizer:attendance.noDays')}</div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedDays.map((day) => {
        const isCollapsed = !!collapsedDays[day.id]
        const dayTotal = day.sessions.reduce((a, s) => a + s.totalExpected, 0)
        const daySigned = day.sessions.reduce((a, s) => a + s.signedCount, 0)
        const isDone = dayTotal > 0 && daySigned === dayTotal
        const isFullDay = day.sessions.length === 1

        return (
          <Card
            key={day.id}
            className={`overflow-hidden py-0 ${
              day.isToday ? 'border-blue-200 ring-1 ring-blue-100' : ''
            }`}
          >
            {/* Day header — clickable for collapse */}
            <div
              className={`flex cursor-pointer items-center justify-between px-4 py-2.5 select-none ${
                day.isToday ? 'bg-blue-200/70' : 'bg-blue-100/60'
              }`}
              onClick={() => toggleCollapse(day.id)}
            >
              <div className="flex min-w-0 items-center gap-2">
                <ChevronDown
                  className={`h-3 w-3 shrink-0 text-gray-400 transition-transform duration-200 ${
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
                <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="truncate text-xs font-semibold text-gray-800 capitalize">
                  {format(new Date(day.date), 'EEEE d MMMM yyyy', { locale })}
                </span>

                {day.isToday && (
                  <Badge className="bg-blue-600 px-1.5 py-0 text-[8px] font-bold text-white">
                    {t('organizer:eventDetail.today')}
                  </Badge>
                )}

                {isFullDay ? (
                  <Badge variant="secondary" className="bg-gray-200/60 text-[9px] text-gray-500">
                    {t('organizer:eventDetail.fullDay')}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-200/60 text-[9px] text-gray-500">
                    {day.sessions.length} {t('organizer:eventDetail.sessions')}
                  </Badge>
                )}

                {isDone && (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-[8px] font-semibold text-emerald-700"
                  >
                    ✓ {t('organizer:eventDetail.complete')}
                  </Badge>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[10px] text-gray-500 tabular-nums">
                  {daySigned}/{dayTotal}
                </span>

                {/* QR button per day (only when granularity is not 'session') */}
                {qrGranularity !== 'session' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <QrCode className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          QR Code - {format(new Date(day.date), 'd MMMM yyyy', { locale })}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col items-center gap-4 py-4">
                        <QRCodeSVG
                          value={`${window.location.origin}/sign/${signingToken}?day=${day.id}`}
                          size={256}
                          level="H"
                        />
                        <p className="text-center text-sm text-neutral-600">
                          {t('organizer:qrCodes.scanPrompt')}
                        </p>
                        <code className="rounded bg-neutral-100 px-2 py-1 text-xs">
                          {window.location.origin}/sign/{signingToken}?day={day.id}
                        </code>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Sessions — conditionally rendered */}
            {!isCollapsed && (
              <div className="divide-y divide-gray-300">
                {day.sessions.map((session) => {
                  const pct =
                    session.totalExpected > 0
                      ? Math.round((session.signedCount / session.totalExpected) * 100)
                      : 0

                  // Determine missing participants
                  const signedSet = new Set(session.signatures.map((s) => s.participant.id))
                  const missingParticipants = participants.filter((p) => !signedSet.has(p.id))

                  return (
                    <div key={session.id} className="space-y-2 px-4 py-3">
                      {/* Session header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-gray-700">
                          {session.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 tabular-nums">
                            {session.signedCount}/{session.totalExpected}
                          </span>

                          {/* QR button per session (only when granularity is 'session') */}
                          {qrGranularity === 'session' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                  <QrCode className="h-3 w-3 text-gray-500" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    QR Code - {session.name} (
                                    {format(new Date(day.date), 'd MMM', { locale })})
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col items-center gap-4 py-4">
                                  <QRCodeSVG
                                    value={`${window.location.origin}/sign/${signingToken}?day=${day.id}&session=${session.id}`}
                                    size={256}
                                    level="H"
                                  />
                                  <p className="text-center text-sm text-neutral-600">
                                    {t('organizer:qrCodes.scanPrompt')}
                                  </p>
                                  <code className="rounded bg-neutral-100 px-2 py-1 text-center text-xs break-all">
                                    {window.location.origin}/sign/{signingToken}?day={day.id}
                                    &session={session.id}
                                  </code>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>

                      {/* Mini progress bar */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: pct === 100 ? '#22c55e' : '#3b82f6',
                          }}
                        />
                      </div>

                      {/* Participants list */}
                      <div className="space-y-0.5">
                        {/* Signed participants */}
                        {session.signatures.map((sig) => (
                          <div key={sig.id} className="flex items-center justify-between py-0.5">
                            <div className="flex items-center gap-2">
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-[11px] font-medium text-gray-700">
                                {sig.participant.lastName.toUpperCase()} {sig.participant.firstName}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 tabular-nums">
                              {format(new Date(sig.createdAt), 'HH:mm', { locale })}
                            </span>
                          </div>
                        ))}

                        {/* Missing participants */}
                        {missingParticipants.map((p) => (
                          <div key={p.id} className="flex items-center justify-between py-0.5">
                            <div className="flex items-center gap-2">
                              <Circle className="h-3.5 w-3.5 text-gray-300" />
                              <span className="text-[11px] text-gray-400">
                                {p.lastName.toUpperCase()} {p.firstName}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-300">
                              {t('organizer:eventDetail.pending')}
                            </span>
                          </div>
                        ))}

                        {/* No participants at all */}
                        {session.signatures.length === 0 && missingParticipants.length === 0 && (
                          <div className="py-1 text-[11px] text-gray-400">
                            {t('organizer:attendance.noSignatures')}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
