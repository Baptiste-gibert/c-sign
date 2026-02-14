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
}

export function AttendanceDashboard({ eventId, participants, qrGranularity }: AttendanceDashboardProps) {
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
      <div className="text-red-600 py-4">
        {t('common:errors.error')}: {error instanceof Error ? error.message : t('common:errors.unknownError')}
      </div>
    )
  }

  if (!data || data.attendanceDays.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        {t('organizer:attendance.noDays')}
      </div>
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
            className={`py-0 overflow-hidden ${
              day.isToday ? 'border-blue-200 ring-1 ring-blue-100' : ''
            }`}
          >
            {/* Day header — clickable for collapse */}
            <div
              className={`px-4 py-2.5 flex items-center justify-between cursor-pointer select-none ${
                day.isToday ? 'bg-blue-50/60' : 'bg-gray-50'
              }`}
              onClick={() => toggleCollapse(day.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <ChevronDown
                  className={`w-3 h-3 text-gray-400 transition-transform duration-200 shrink-0 ${
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-xs font-semibold text-gray-800 capitalize truncate">
                  {format(new Date(day.date), 'EEEE d MMMM yyyy', { locale })}
                </span>

                {day.isToday && (
                  <Badge className="text-[8px] font-bold px-1.5 py-0 bg-blue-600 text-white">
                    {t('organizer:eventDetail.today')}
                  </Badge>
                )}

                {isFullDay ? (
                  <Badge variant="secondary" className="text-[9px] bg-gray-200/60 text-gray-500">
                    {t('organizer:eventDetail.fullDay')}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[9px] bg-gray-200/60 text-gray-500">
                    {day.sessions.length} {t('organizer:eventDetail.sessions')}
                  </Badge>
                )}

                {isDone && (
                  <Badge variant="secondary" className="text-[8px] bg-emerald-100 text-emerald-700 font-semibold">
                    ✓ {t('organizer:eventDetail.complete')}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-gray-500 tabular-nums">
                  {daySigned}/{dayTotal}
                </span>

                {/* QR button — stopPropagation to avoid collapse toggle */}
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
                        value={`${window.location.origin}/sign/${day.id}`}
                        size={256}
                        level="H"
                      />
                      <p className="text-sm text-neutral-600 text-center">
                        {t('organizer:qrCodes.scanPrompt')}
                      </p>
                      <code className="text-xs bg-neutral-100 px-2 py-1 rounded">
                        {window.location.origin}/sign/{day.id}
                      </code>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Sessions — conditionally rendered */}
            {!isCollapsed && (
              <div className="divide-y divide-gray-100">
                {day.sessions.map((session) => {
                  const pct = session.totalExpected > 0
                    ? Math.round((session.signedCount / session.totalExpected) * 100)
                    : 0

                  // Determine missing participants
                  const signedSet = new Set(
                    session.signatures.map((s) => s.participant.id)
                  )
                  const missingParticipants = participants.filter(
                    (p) => !signedSet.has(p.id)
                  )

                  return (
                    <div key={session.id} className="px-4 py-3 space-y-2">
                      {/* Session header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-gray-700">
                          {session.name}
                        </span>
                        <span className="text-[10px] text-gray-400 tabular-nums">
                          {session.signedCount}/{session.totalExpected}
                        </span>
                      </div>

                      {/* Mini progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
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
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
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
                              <Circle className="w-3.5 h-3.5 text-gray-300" />
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
                          <div className="text-[11px] text-gray-400 py-1">
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
