import { format } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import {
  AlertCircle,
  ChevronLeft,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Loader2,
  Palette,
  Pen,
  Pencil,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AttendanceDashboard } from '@/components/AttendanceDashboard'
import { ParticipantSearch } from '@/components/ParticipantSearch'
import { ParticipantTable } from '@/components/ParticipantTable'
import { StatusActionButton } from '@/components/StatusActionButton'
import { ThemeSelector } from '@/components/ThemeSelector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type EventStatus, statusContext } from '@/config/status'
import { BUILT_IN_THEMES } from '@/config/themes'
import { useAttendanceDashboard } from '@/hooks/use-attendance'
import { useEvent, useRegenerateToken, useUpdateEvent } from '@/hooks/use-events'
import { useDownloadExport } from '@/hooks/use-export'
import {
  type Participant,
  type SimvParticipant,
  useAddParticipant,
  useAddWalkIn,
  useRemoveParticipant,
} from '@/hooks/use-participants'
import { useNavigate, useParams } from '@/lib/navigation'

const BENEFICIARY_TYPE_KEYS = [
  'asv',
  'autre',
  'eleveur',
  'etudiant',
  'pharmacien',
  'technicien',
  'veterinaire',
] as const

export function EventDetailPage() {
  const { t, i18n } = useTranslation(['organizer', 'common'])
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const locale = i18n.language === 'en' ? enUS : fr

  const { data: event, isLoading, isError, error } = useEvent(id || '')
  const {
    mutate: updateEvent,
    isPending: isUpdating,
    isError: isUpdateError,
    error: updateError,
  } = useUpdateEvent(id || '')
  const { mutate: addParticipant } = useAddParticipant(id || '')
  const { mutate: removeParticipant } = useRemoveParticipant(id || '')
  const { mutate: addWalkIn } = useAddWalkIn(id || '')
  const downloadMutation = useDownloadExport()
  const regenerateTokenMutation = useRegenerateToken()
  const { data: attendanceData } = useAttendanceDashboard(id || '')

  const [showWalkInForm, setShowWalkInForm] = useState(false)
  const [walkInData, setWalkInData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    city: '',
    professionalNumber: '',
    beneficiaryType: '',
  })
  const [statusErrorDismissed, setStatusErrorDismissed] = useState(false)
  const [editingCnov, setEditingCnov] = useState(false)
  const [cnovValue, setCnovValue] = useState('')
  const [editingTheme, setEditingTheme] = useState(false)
  const [themeValue, setThemeValue] = useState<{
    themeId?: string
    customAccent?: string
    mode?: 'dark' | 'light'
  } | null>(null)
  const [editingQr, setEditingQr] = useState(false)
  const [qrMode, setQrMode] = useState<'event' | 'day' | 'session'>('day')

  // Sync CNOV value when event data changes
  useEffect(() => {
    setCnovValue(event?.cnovDeclarationNumber || '')
  }, [event?.cnovDeclarationNumber])

  // Sync theme value when event data changes
  useEffect(() => {
    setThemeValue(event?.theme || null)
  }, [event?.theme])

  // Sync QR granularity
  useEffect(() => {
    if (event?.qrGranularity) {
      setQrMode(event.qrGranularity)
    }
  }, [event?.qrGranularity])

  // Compute global metrics from attendance data
  const globalMetrics = useMemo(() => {
    if (!attendanceData)
      return { uniqueSigners: 0, totalSigned: 0, totalSlots: 0, totalSessions: 0, globalPct: 0 }

    const uniqueSignerSet = new Set<string>()
    let totalSigned = 0
    let totalSlots = 0
    let totalSessions = 0

    for (const day of attendanceData.attendanceDays) {
      for (const session of day.sessions) {
        totalSessions++
        totalSigned += session.signedCount
        totalSlots += session.totalExpected
        for (const sig of session.signatures) {
          uniqueSignerSet.add(sig.participant.id)
        }
      }
    }

    const globalPct = totalSlots > 0 ? Math.round((totalSigned / totalSlots) * 100) : 0

    return {
      uniqueSigners: uniqueSignerSet.size,
      totalSigned,
      totalSlots,
      totalSessions,
      globalPct,
    }
  }, [attendanceData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-0.5 text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('organizer:eventDetail.backToDashboard')}
        </button>
        <div className="text-red-600">
          {t('common:errors.error')}:{' '}
          {error instanceof Error ? error.message : t('organizer:eventDetail.eventNotFound')}
        </div>
      </div>
    )
  }

  const handleStatusChange = (nextStatus: EventStatus) => {
    setStatusErrorDismissed(false)
    updateEvent({ status: nextStatus })
  }

  const handleDownload = () => {
    if (!id) return
    downloadMutation.mutate(id)
  }

  const handleSaveCnov = () => {
    updateEvent({ cnovDeclarationNumber: cnovValue })
    setEditingCnov(false)
  }

  const handleCancelCnov = () => {
    setCnovValue(event?.cnovDeclarationNumber || '')
    setEditingCnov(false)
  }

  const handleSaveTheme = () => {
    updateEvent({ theme: themeValue })
    setEditingTheme(false)
  }

  const handleSaveQrGranularity = () => {
    updateEvent({ qrGranularity: qrMode })
    setEditingQr(false)
  }

  const handleRegenerateToken = () => {
    if (!id) return
    if (window.confirm(t('organizer:eventDetail.regenerateLinkConfirm'))) {
      regenerateTokenMutation.mutate(id)
    }
  }

  const handleAddFromSimv = (participant: SimvParticipant) => {
    addParticipant({
      lastName: participant.lastName,
      firstName: participant.firstName,
      email: participant.email,
      city: participant.city,
      professionalNumber: participant.professionalNumber,
      beneficiaryType: participant.beneficiaryType,
    })
  }

  const handleRemoveParticipant = (participantId: string) => {
    if (window.confirm(t('organizer:participants.removeConfirm'))) {
      removeParticipant(participantId)
    }
  }

  const handleAddWalkIn = (e: React.FormEvent) => {
    e.preventDefault()
    addWalkIn(walkInData, {
      onSuccess: () => {
        setWalkInData({
          lastName: '',
          firstName: '',
          email: '',
          city: '',
          professionalNumber: '',
          beneficiaryType: '',
        })
        setShowWalkInForm(false)
      },
    })
  }

  const participants: Participant[] = (
    (event.participants || []) as Array<
      string | { id: string; lastName: string; firstName: string }
    >
  )
    .map((p) => {
      if (typeof p === 'object') return p as Participant
      return { id: p } as Participant
    })
    .filter((p: Participant) => p.lastName)

  const isLocked = event.status === 'finalized'

  // Derive current theme label
  let currentThemeLabel = t('organizer:eventDetail.defaultTheme')
  let currentThemeColor = '#00d9ff'
  if (event.theme?.themeId && BUILT_IN_THEMES[event.theme.themeId]) {
    currentThemeLabel = BUILT_IN_THEMES[event.theme.themeId].name
    currentThemeColor = BUILT_IN_THEMES[event.theme.themeId].vars['--accent']
  } else if (event.theme?.customAccent) {
    currentThemeLabel = `${t('organizer:eventDetail.customTheme')}: ${event.theme.customAccent}`
    currentThemeColor = event.theme.customAccent
  }
  if (event.theme?.mode === 'light') {
    currentThemeLabel += ` (${t('organizer:theme.light')})`
  }

  // Status error
  let statusErrorMessage = ''
  if (isUpdateError && updateError && !statusErrorDismissed) {
    try {
      const errorData = JSON.parse(updateError.message)
      if (errorData.errors && errorData.errors[0]?.message) {
        statusErrorMessage = errorData.errors[0].message
      } else {
        statusErrorMessage = updateError.message
      }
    } catch {
      if (
        updateError.message.includes('Failed to fetch') ||
        updateError.message.includes('network')
      ) {
        statusErrorMessage = t('common:errors.connectionError')
      } else {
        statusErrorMessage = updateError.message
      }
    }
  }

  const ctx = statusContext[event.status as EventStatus]

  // QR count for display
  const dayCount = attendanceData?.attendanceDays.length || event.selectedDates?.length || 0
  const qrCount = qrMode === 'event' ? 1 : qrMode === 'day' ? dayCount : globalMetrics.totalSessions

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-0.5 text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('organizer:eventDetail.backToDashboard')}
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
            <Badge
              className="text-[10px]"
              style={{
                backgroundColor: statusContext[event.status as EventStatus].bgClass.includes('gray')
                  ? '#f3f4f6'
                  : statusContext[event.status as EventStatus].bgClass.includes('blue')
                    ? '#dbeafe'
                    : statusContext[event.status as EventStatus].bgClass.includes('amber')
                      ? '#fef3c7'
                      : '#dcfce7',
                color: statusContext[event.status as EventStatus].textClass.includes('gray')
                  ? '#6b7280'
                  : statusContext[event.status as EventStatus].textClass.includes('blue')
                    ? '#2563eb'
                    : statusContext[event.status as EventStatus].textClass.includes('amber')
                      ? '#d97706'
                      : '#16a34a',
              }}
            >
              {t(`common:status.${event.status}`)}
            </Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-[10px]"
            onClick={handleDownload}
            disabled={downloadMutation.isPending}
          >
            {downloadMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            {t('organizer:eventDetail.downloadXlsx')}
          </Button>
        </div>

        {/* Metadata line */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
          {event.selectedDates && event.selectedDates.length > 0 && (
            <>
              <span>
                {event.selectedDates
                  .map((d: { id: string; date: string }) =>
                    format(new Date(d.date), 'd MMM yyyy', { locale }),
                  )
                  .join(', ')}
              </span>
              <span>·</span>
            </>
          )}
          <span>{event.location}</span>
          <span>·</span>
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {t(`organizer:expenseTypes.${event.expenseType}`, event.expenseType)}
          </Badge>
          <span>·</span>
          <span>{event.organizerName}</span>
          {!editingCnov && event.cnovDeclarationNumber && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                {t('organizer:eventDetail.cnov')} {event.cnovDeclarationNumber}
                {!isLocked && (
                  <button
                    onClick={() => setEditingCnov(true)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </button>
                )}
              </span>
            </>
          )}
          {!editingCnov && !event.cnovDeclarationNumber && !isLocked && (
            <>
              <span>·</span>
              <button
                onClick={() => setEditingCnov(true)}
                className="text-blue-600 underline hover:text-blue-800"
              >
                {t('organizer:eventDetail.addCnov')}
              </button>
            </>
          )}
        </div>

        {/* CNOV inline edit */}
        {editingCnov && (
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={cnovValue}
              onChange={(e) => setCnovValue(e.target.value)}
              placeholder={t('organizer:eventForm.cnovPlaceholder')}
              className="h-8 w-64 text-xs"
            />
            <Button size="sm" className="h-7 text-[10px]" onClick={handleSaveCnov}>
              {t('organizer:eventDetail.saveCnov')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px]"
              onClick={handleCancelCnov}
            >
              {t('organizer:eventDetail.cancelCnov')}
            </Button>
          </div>
        )}
      </div>

      {/* Status banner */}
      <div
        className={`flex items-center justify-between ${ctx.bgClass} border ${ctx.borderClass} rounded-lg px-4 py-2.5`}
      >
        <p className={`text-xs ${ctx.textClass}`}>
          {t(
            `organizer:eventDetail.status${(event.status as string).charAt(0).toUpperCase() + (event.status as string).slice(1)}`,
          )}
        </p>
        <StatusActionButton
          status={event.status as EventStatus}
          onAction={handleStatusChange}
          isPending={isUpdating}
        />
      </div>

      {/* Status error */}
      {statusErrorMessage && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
          <p className="flex-1 text-xs text-red-800">{statusErrorMessage}</p>
          <button
            onClick={() => setStatusErrorDismissed(true)}
            className="text-sm text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {downloadMutation.isError && (
        <p className="text-xs text-red-600">{t('organizer:eventDetail.downloadError')}</p>
      )}

      {/* Global progress card */}
      {event.status !== 'draft' && attendanceData && (
        <Card className="border border-gray-200 bg-white">
          <CardContent className="px-5 py-4">
            {/* Dual metrics row */}
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-xs text-gray-700">
                    <span className="font-semibold">{globalMetrics.uniqueSigners}</span>/
                    {participants.length} {t('organizer:eventDetail.participantsSigned')}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-3.5" />
                <div className="flex items-center gap-1.5">
                  <Pen className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-xs text-gray-700">
                    <span className="font-semibold">{globalMetrics.totalSigned}</span>/
                    {globalMetrics.totalSlots} {t('organizer:eventDetail.signaturesCollected')}
                  </span>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={`px-2 py-0.5 text-[10px] font-semibold ${
                  globalMetrics.globalPct === 100
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                {globalMetrics.globalPct}%
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${globalMetrics.globalPct}%`,
                  background: globalMetrics.globalPct === 100 ? '#22c55e' : '#3b82f6',
                }}
              />
            </div>

            {/* Context line */}
            <p className="mt-2 text-[10px] text-gray-400">
              {dayCount} {t('common:plurals.days', { count: dayCount })} ·{' '}
              {globalMetrics.totalSessions} {t('organizer:eventDetail.sessions')} · {qrCount} QR
              codes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="attendance">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-0 rounded-xl border border-gray-200 bg-white p-0">
          <TabsTrigger
            value="attendance"
            className="flex items-center justify-center gap-2 rounded-none rounded-l-xl border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-500 transition-colors data-[state=active]:border-b-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
          >
            <ClipboardList className="h-4 w-4" />
            {t('organizer:eventDetail.tabAttendance')}
          </TabsTrigger>
          <TabsTrigger
            value="participants"
            className="flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-500 transition-colors data-[state=active]:border-b-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
          >
            <Users className="h-4 w-4" />
            {t('organizer:eventDetail.tabParticipants')} ({participants.length})
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex items-center justify-center gap-2 rounded-none rounded-r-xl border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-500 transition-colors data-[state=active]:border-b-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
          >
            <Settings className="h-4 w-4" />
            {t('organizer:eventDetail.tabSettings')}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Attendance & QR */}
        <TabsContent value="attendance">
          {event.status === 'draft' ? (
            <div className="py-8 text-center text-neutral-500">
              {t('organizer:attendance.openEventPrompt')}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Live indicator + Download all QR + Regenerate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-medium text-emerald-600">
                    {t('organizer:eventDetail.liveUpdates')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(event.status === 'open' || event.status === 'reopened') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-[10px]"
                      onClick={handleRegenerateToken}
                      disabled={regenerateTokenMutation.isPending}
                    >
                      {regenerateTokenMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      {t('organizer:eventDetail.regenerateLink')}
                    </Button>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]">
                        <QrCode className="h-3 w-3" />
                        {t('organizer:eventDetail.downloadAllQr')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                          <span>{t('organizer:qrCodes.title')}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-[10px] print:hidden"
                            onClick={() => window.print()}
                          >
                            <Printer className="h-3 w-3" />
                            {t('organizer:qrCodes.print')}
                          </Button>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 py-2">
                        {attendanceData?.attendanceDays.map((day) => (
                          <div key={day.id}>
                            <h3 className="mb-3 text-sm font-semibold text-gray-800 capitalize">
                              {format(new Date(day.date), 'EEEE d MMMM yyyy', { locale })}
                            </h3>
                            {event.qrGranularity === 'session' ? (
                              <div className="grid grid-cols-2 gap-4">
                                {day.sessions.map((session) => (
                                  <div
                                    key={session.id}
                                    className="flex flex-col items-center gap-2 rounded-lg border p-3"
                                  >
                                    <QRCodeSVG
                                      value={`${window.location.origin}/sign/${event.signingToken}?day=${day.id}&session=${session.id}`}
                                      size={160}
                                      level="H"
                                    />
                                    <p className="text-center text-xs font-medium text-gray-700">
                                      {session.name}
                                    </p>
                                    <code className="text-center text-[9px] break-all text-gray-400">
                                      /sign/{event.signingToken}?day={day.id}&session={session.id}
                                    </code>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
                                <QRCodeSVG
                                  value={`${window.location.origin}/sign/${event.signingToken}?day=${day.id}`}
                                  size={200}
                                  level="H"
                                />
                                <code className="text-center text-[9px] break-all text-gray-400">
                                  /sign/{event.signingToken}?day={day.id}
                                </code>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <AttendanceDashboard
                eventId={event.id}
                participants={participants}
                qrGranularity={event.qrGranularity}
                signingToken={event.signingToken}
              />
            </div>
          )}
        </TabsContent>

        {/* Tab: Participants */}
        <TabsContent value="participants">
          <div className="space-y-4">
            {/* Add participants section */}
            <Card className="gap-0 overflow-hidden border border-gray-200 bg-white p-0">
              <CardHeader className="border-b border-gray-200 bg-gray-100 px-5 pt-4 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <Search className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-gray-900">
                      {t('organizer:participants.searchSimv')}
                    </CardTitle>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {t('organizer:participants.searchSimvPlaceholder')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pt-4 pb-4">
                <ParticipantSearch onSelect={handleAddFromSimv} disabled={isLocked} />
              </CardContent>
              {!isLocked && (
                <>
                  <Separator />
                  <div className="px-5 py-3">
                    <button
                      onClick={() => setShowWalkInForm(!showWalkInForm)}
                      className="flex w-full items-center gap-2 text-xs font-medium text-blue-600 transition-colors hover:text-blue-800"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {t('organizer:participants.addWithoutRegistration')}
                    </button>

                    {showWalkInForm && (
                      <form
                        onSubmit={handleAddWalkIn}
                        className="mt-4 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">
                              {t('common:form.labels.lastName')} *
                            </Label>
                            <Input
                              id="lastName"
                              value={walkInData.lastName}
                              onChange={(e) =>
                                setWalkInData({ ...walkInData, lastName: e.target.value })
                              }
                              required
                              className="mt-1 h-9 text-xs"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="firstName"
                              className="text-xs font-medium text-gray-700"
                            >
                              {t('common:form.labels.firstName')} *
                            </Label>
                            <Input
                              id="firstName"
                              value={walkInData.firstName}
                              onChange={(e) =>
                                setWalkInData({ ...walkInData, firstName: e.target.value })
                              }
                              required
                              className="mt-1 h-9 text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                              {t('common:form.labels.email')} *
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={walkInData.email}
                              onChange={(e) =>
                                setWalkInData({ ...walkInData, email: e.target.value })
                              }
                              required
                              className="mt-1 h-9 text-xs"
                            />
                          </div>
                          <div>
                            <Label htmlFor="city" className="text-xs font-medium text-gray-700">
                              {t('common:form.labels.city')} *
                            </Label>
                            <Input
                              id="city"
                              value={walkInData.city}
                              onChange={(e) =>
                                setWalkInData({ ...walkInData, city: e.target.value })
                              }
                              required
                              className="mt-1 h-9 text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <Label
                              htmlFor="professionalNumber"
                              className="text-xs font-medium text-gray-700"
                            >
                              {t('organizer:walkIn.professionalNumber')}
                            </Label>
                            <Input
                              id="professionalNumber"
                              value={walkInData.professionalNumber}
                              onChange={(e) =>
                                setWalkInData({ ...walkInData, professionalNumber: e.target.value })
                              }
                              className="mt-1 h-9 text-xs"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="beneficiaryType"
                              className="text-xs font-medium text-gray-700"
                            >
                              {t('organizer:walkIn.beneficiaryType')} *
                            </Label>
                            <Select
                              value={walkInData.beneficiaryType}
                              onValueChange={(value) =>
                                setWalkInData({ ...walkInData, beneficiaryType: value })
                              }
                              required
                            >
                              <SelectTrigger id="beneficiaryType" className="mt-1 h-9 text-xs">
                                <SelectValue placeholder={t('organizer:walkIn.selectType')} />
                              </SelectTrigger>
                              <SelectContent>
                                {BENEFICIARY_TYPE_KEYS.map((key) => (
                                  <SelectItem key={key} value={key} className="text-xs">
                                    {t(`common:beneficiaryTypes.${key}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button
                            type="submit"
                            size="sm"
                            className="h-8 bg-blue-600 px-4 text-xs hover:bg-blue-700"
                          >
                            {t('common:actions.add')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setShowWalkInForm(false)}
                          >
                            {t('common:actions.cancel')}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </>
              )}
            </Card>

            {/* Participants table */}
            <Card className="gap-0 overflow-hidden border border-gray-200 bg-white p-0">
              <CardHeader className="border-b border-gray-200 bg-gray-100 px-5 pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                      <Users className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-gray-900">
                        {t('organizer:participants.title')}
                      </CardTitle>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {participants.length > 0
                          ? `${participants.length} ${t('organizer:eventDetail.tabParticipants').toLowerCase()}`
                          : t('organizer:participants.noParticipants')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <ParticipantTable
                  data={participants}
                  onRemove={handleRemoveParticipant}
                  isLoading={isLocked}
                  attendanceData={attendanceData}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Settings */}
        <TabsContent value="settings">
          <div className="space-y-4">
            {/* Theme card */}
            <Card className="gap-0 overflow-hidden border border-gray-200 bg-white p-0">
              <CardHeader className="border-b border-gray-200 bg-gray-100 px-5 pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                      <Palette className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-gray-900">
                        {t('organizer:eventDetail.themeTitle')}
                      </CardTitle>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {t('organizer:eventCreate.themeDesc')}
                      </p>
                    </div>
                  </div>
                  {!isLocked && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-[10px]"
                      onClick={() => setEditingTheme(!editingTheme)}
                    >
                      <Pencil className="h-3 w-3" />
                      {editingTheme
                        ? t('organizer:eventDetail.cancelTheme')
                        : t('organizer:eventDetail.editTheme')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-5 pt-4 pb-5">
                {!editingTheme ? (
                  <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <div
                      className="h-6 w-10 rounded-md border border-white/20 shadow-sm"
                      style={{ background: currentThemeColor }}
                    />
                    <span className="text-xs font-medium text-gray-700">{currentThemeLabel}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ThemeSelector value={themeValue} onChange={setThemeValue} />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 bg-blue-600 px-4 text-xs hover:bg-blue-700"
                        onClick={handleSaveTheme}
                      >
                        {t('organizer:eventDetail.saveTheme')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setEditingTheme(false)}
                      >
                        {t('organizer:eventDetail.cancelTheme')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Granularity card */}
            <Card className="gap-0 overflow-hidden border border-gray-200 bg-white p-0">
              <CardHeader className="border-b border-gray-200 bg-gray-100 px-5 pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50">
                      <QrCode className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-gray-900">
                        {t('organizer:eventDetail.qrGranularityTitle')}
                      </CardTitle>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {t('organizer:eventCreate.qrGranularityDesc')}
                      </p>
                    </div>
                  </div>
                  {!isLocked && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-[10px]"
                      onClick={() => setEditingQr(!editingQr)}
                    >
                      <Pencil className="h-3 w-3" />
                      {editingQr
                        ? t('organizer:eventDetail.cancelTheme')
                        : t('organizer:eventDetail.editTheme')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-5 pt-4 pb-5">
                {!editingQr ? (
                  <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className="border-0 bg-cyan-50 px-2 py-0.5 text-[10px] text-cyan-700"
                    >
                      {qrCount} QR
                    </Badge>
                    <span className="text-xs font-medium text-gray-700">
                      {qrMode === 'event'
                        ? t('organizer:eventCreate.qrEventDesc')
                        : qrMode === 'day'
                          ? t('organizer:eventCreate.qrDayDesc')
                          : t('organizer:eventCreate.qrSessionDesc')}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2.5">
                      {(['event', 'day', 'session'] as const).map((opt) => {
                        const isSelected = qrMode === opt
                        const count =
                          opt === 'event'
                            ? 1
                            : opt === 'day'
                              ? dayCount
                              : globalMetrics.totalSessions
                        return (
                          <button
                            key={opt}
                            type="button"
                            className={`rounded-xl border-2 p-3.5 text-left transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50/50'
                                : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                            onClick={() => setQrMode(opt)}
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span
                                className={`text-xs font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}
                              >
                                {t(
                                  `organizer:eventCreate.qr${opt.charAt(0).toUpperCase() + opt.slice(1)}`,
                                )}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`px-1.5 py-0 text-[9px] ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                              >
                                {count}
                              </Badge>
                            </div>
                            <p
                              className={`text-[10px] leading-snug ${isSelected ? 'text-blue-600/70' : 'text-gray-400'}`}
                            >
                              {t(
                                `organizer:eventCreate.qr${opt.charAt(0).toUpperCase() + opt.slice(1)}Desc`,
                              )}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 bg-blue-600 px-4 text-xs hover:bg-blue-700"
                        onClick={handleSaveQrGranularity}
                      >
                        {t('organizer:eventDetail.saveTheme')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setEditingQr(false)}
                      >
                        {t('organizer:eventDetail.cancelTheme')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export card */}
            <Card className="gap-0 overflow-hidden border border-gray-200 bg-white p-0">
              <CardHeader className="border-b border-gray-200 bg-gray-100 px-5 pt-4 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-gray-900">Export</CardTitle>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {t('organizer:eventDetail.xlsxDesc')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pt-4 pb-5">
                <Button
                  size="sm"
                  className="h-9 gap-2 bg-emerald-600 px-4 text-xs hover:bg-emerald-700"
                  onClick={handleDownload}
                  disabled={downloadMutation.isPending}
                >
                  {downloadMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {t('organizer:eventDetail.downloadXlsx')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
