import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, X } from 'lucide-react'

export interface SessionConfig {
  id: string
  name: string
  startTime: string
  endTime: string
}

export interface AttendanceDay {
  date: string
  fullDay: boolean
  sessions: SessionConfig[]
}

interface DaySessionEditorProps {
  days: AttendanceDay[]
  onDaysChange: (days: AttendanceDay[]) => void
  qrGranularity: 'event' | 'day' | 'session'
  onQrGranularityChange: (g: 'event' | 'day' | 'session') => void
}

const SESSION_PRESETS = [
  { label: 'Matin', icon: '\u2600\uFE0F', start: '09:00', end: '12:00' },
  { label: 'Midi', icon: '\uD83C\uDF7D', start: '12:00', end: '14:00' },
  { label: 'Apres-midi', icon: '\uD83C\uDF24', start: '14:00', end: '17:00' },
]

const GENERIC_NAMES = ['Nouvelle session', 'New session', 'Session principale']

let nextId = 1
function generateId() {
  return `s_${Date.now()}_${nextId++}`
}

function makeDefaultSession(): SessionConfig {
  return { id: generateId(), name: 'Nouvelle session', startTime: '09:00', endTime: '17:00' }
}

export function DaySessionEditor({
  days,
  onDaysChange,
  qrGranularity,
  onQrGranularityChange,
}: DaySessionEditorProps) {
  const { t } = useTranslation('organizer')
  const { t: tc } = useTranslation('common')
  const [dateInput, setDateInput] = useState('')

  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date))

  const addDay = () => {
    if (!dateInput) return
    // Prevent duplicate dates
    if (days.some((d) => d.date === dateInput)) return
    onDaysChange([
      ...days,
      { date: dateInput, fullDay: true, sessions: [makeDefaultSession()] },
    ])
    setDateInput('')
  }

  const removeDay = (date: string) => {
    onDaysChange(days.filter((d) => d.date !== date))
  }

  const toggleFullDay = (date: string) => {
    onDaysChange(
      days.map((d) => {
        if (d.date !== date) return d
        if (d.fullDay) {
          // Switching to multi-session: split into morning/afternoon
          return {
            ...d,
            fullDay: false,
            sessions:
              d.sessions.length === 1
                ? [
                    { id: generateId(), name: 'Matin', startTime: '09:00', endTime: '12:00' },
                    { id: generateId(), name: 'Apres-midi', startTime: '14:00', endTime: '17:00' },
                  ]
                : d.sessions,
          }
        }
        // Switching to full day: merge into single session
        return {
          ...d,
          fullDay: true,
          sessions: [{ id: d.sessions[0]?.id || generateId(), name: d.sessions[0]?.name || 'Session principale', startTime: '09:00', endTime: '17:00' }],
        }
      })
    )
  }

  const addSession = (date: string) => {
    onDaysChange(
      days.map((d) =>
        d.date === date ? { ...d, sessions: [...d.sessions, makeDefaultSession()] } : d
      )
    )
  }

  const removeSession = (date: string, sessionId: string) => {
    onDaysChange(
      days.map((d) => {
        if (d.date !== date) return d
        if (d.sessions.length <= 1) return d
        return { ...d, sessions: d.sessions.filter((s) => s.id !== sessionId) }
      })
    )
  }

  const updateSessionName = (date: string, sessionId: string, name: string) => {
    onDaysChange(
      days.map((d) =>
        d.date === date
          ? { ...d, sessions: d.sessions.map((s) => (s.id === sessionId ? { ...s, name } : s)) }
          : d
      )
    )
  }

  const updateSessionTime = (
    date: string,
    sessionId: string,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    onDaysChange(
      days.map((d) =>
        d.date === date
          ? {
              ...d,
              sessions: d.sessions.map((s) =>
                s.id === sessionId ? { ...s, [field]: value } : s
              ),
            }
          : d
      )
    )
  }

  const applyPreset = (date: string, sessionId: string, preset: (typeof SESSION_PRESETS)[0]) => {
    onDaysChange(
      days.map((d) =>
        d.date === date
          ? {
              ...d,
              sessions: d.sessions.map((s) => {
                if (s.id !== sessionId) return s
                const shouldRename = GENERIC_NAMES.includes(s.name) || s.name === ''
                return {
                  ...s,
                  name: shouldRename ? preset.label : s.name,
                  startTime: preset.start,
                  endTime: preset.end,
                }
              }),
            }
          : d
      )
    )
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const totalSessions = days.reduce((sum, d) => sum + d.sessions.length, 0)
  const qrCount =
    qrGranularity === 'event' ? 1 : qrGranularity === 'day' ? days.length : totalSessions

  const qrOptions: Array<{ value: 'event' | 'day' | 'session'; labelKey: string; descKey: string }> = [
    { value: 'event', labelKey: 'eventCreate.qrEvent', descKey: 'eventCreate.qrEventDesc' },
    { value: 'day', labelKey: 'eventCreate.qrDay', descKey: 'eventCreate.qrDayDesc' },
    { value: 'session', labelKey: 'eventCreate.qrSession', descKey: 'eventCreate.qrSessionDesc' },
  ]

  return (
    <div className="space-y-4">
      {/* Date input bar */}
      <div className="flex gap-2">
        <Input
          type="date"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          className="h-8 text-xs flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={addDay}
          disabled={!dateInput}
        >
          <Plus className="h-3 w-3 mr-1" />
          {t('eventCreate.addDay')}
        </Button>
      </div>

      {/* Empty state */}
      {sortedDays.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500">{t('eventCreate.noDays')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('eventCreate.noDaysHint')}</p>
        </div>
      )}

      {/* Day cards */}
      {sortedDays.map((day) => (
        <Card key={day.date} className="py-3">
          <CardContent className="px-4 space-y-3">
            {/* Day header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {formatDate(day.date)}
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {day.sessions.length} session{day.sessions.length > 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.fullDay}
                    onChange={() => toggleFullDay(day.date)}
                    className="rounded border-gray-300"
                  />
                  {t('eventCreate.fullDay')}
                </label>
                <button
                  type="button"
                  onClick={() => removeDay(day.date)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Sessions */}
            <div className="space-y-2">
              {day.sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-2 bg-gray-50 rounded-md p-2"
                >
                  {/* Session name */}
                  <Input
                    value={session.name}
                    onChange={(e) => updateSessionName(day.date, session.id, e.target.value)}
                    placeholder={t('eventCreate.sessionName')}
                    className="h-7 text-xs flex-1 min-w-0"
                    disabled={day.fullDay}
                  />
                  {/* Time inputs */}
                  <Input
                    type="time"
                    value={session.startTime}
                    onChange={(e) =>
                      updateSessionTime(day.date, session.id, 'startTime', e.target.value)
                    }
                    className="h-7 text-xs w-24"
                  />
                  <span className="text-xs text-gray-400">-</span>
                  <Input
                    type="time"
                    value={session.endTime}
                    onChange={(e) =>
                      updateSessionTime(day.date, session.id, 'endTime', e.target.value)
                    }
                    className="h-7 text-xs w-24"
                  />
                  {/* Preset buttons */}
                  {!day.fullDay && (
                    <div className="flex gap-0.5">
                      {SESSION_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyPreset(day.date, session.id, preset)}
                          className="p-1 text-sm hover:bg-gray-200 rounded transition-colors"
                          title={preset.label}
                        >
                          {preset.icon}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Delete session */}
                  {!day.fullDay && day.sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSession(day.date, session.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add session button */}
            {!day.fullDay && (
              <button
                type="button"
                onClick={() => addSession(day.date)}
                className="w-full border-2 border-dashed border-gray-200 rounded-md p-2 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
              >
                <Plus className="h-3 w-3 inline mr-1" />
                {t('eventCreate.addSession')}
              </button>
            )}
          </CardContent>
        </Card>
      ))}

      {/* QR Granularity selector */}
      {days.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">{t('eventCreate.qrGranularity')}</p>
          <p className="text-xs text-gray-400">{t('eventCreate.qrGranularityDesc')}</p>
          <div className="grid grid-cols-3 gap-2">
            {qrOptions.map((opt) => {
              const isSelected = qrGranularity === opt.value
              const count =
                opt.value === 'event' ? 1 : opt.value === 'day' ? days.length : totalSessions
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onQrGranularityChange(opt.value)}
                  className={`rounded-lg border-2 p-3 text-left transition-all ${
                    isSelected
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-900">{t(opt.labelKey)}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{t(opt.descKey)}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{count} QR</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Summary banner */}
      {days.length > 0 && (
        <div className="bg-gray-50 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs text-gray-600">
          <span>
            {tc('plurals.days', { count: days.length })} &middot; {totalSessions} session
            {totalSessions > 1 ? 's' : ''}
          </span>
          <span>
            QR: {qrCount} ({t(`eventCreate.qr${qrGranularity.charAt(0).toUpperCase() + qrGranularity.slice(1)}`)})
          </span>
        </div>
      )}
    </div>
  )
}
