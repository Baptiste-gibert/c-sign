import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from '@/lib/navigation'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useEvent, useUpdateEvent, type PayloadEvent } from '@/hooks/use-events'
import { useDownloadExport } from '@/hooks/use-export'
import { useAttendanceDashboard } from '@/hooks/use-attendance'
import {
  useAddParticipant,
  useRemoveParticipant,
  useAddWalkIn,
  type SimvParticipant,
  type Participant,
} from '@/hooks/use-participants'
import { ParticipantSearch } from '@/components/ParticipantSearch'
import { ParticipantTable } from '@/components/ParticipantTable'
import { AttendanceDashboard } from '@/components/AttendanceDashboard'
import { StatusActionButton } from '@/components/StatusActionButton'
import { ThemeSelector } from '@/components/ThemeSelector'
import { BUILT_IN_THEMES } from '@/config/themes'
import { statusContext, type EventStatus } from '@/config/status'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, AlertCircle, ChevronLeft, UserPlus, Download, Pencil, Users, Pen } from 'lucide-react'

const BENEFICIARY_TYPE_KEYS = ['asv', 'autre', 'eleveur', 'etudiant', 'pharmacien', 'technicien', 'veterinaire'] as const

export function EventDetailPage() {
  const { t, i18n } = useTranslation(['organizer', 'common'])
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const locale = i18n.language === 'en' ? enUS : fr

  const { data: event, isLoading, isError, error } = useEvent(id || '')
  const { mutate: updateEvent, isPending: isUpdating, isError: isUpdateError, error: updateError } = useUpdateEvent(id || '')
  const { mutate: addParticipant } = useAddParticipant(id || '')
  const { mutate: removeParticipant } = useRemoveParticipant(id || '')
  const { mutate: addWalkIn } = useAddWalkIn(id || '')
  const downloadMutation = useDownloadExport()
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
  const [themeValue, setThemeValue] = useState<{ themeId?: string; customAccent?: string; mode?: 'dark' | 'light' } | null>(null)
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
    if (!attendanceData) return { uniqueSigners: 0, totalSigned: 0, totalSlots: 0, totalSessions: 0, globalPct: 0 }

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

    return { uniqueSigners: uniqueSignerSet.size, totalSigned, totalSlots, totalSessions, globalPct }
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
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('organizer:eventDetail.backToDashboard')}
        </button>
        <div className="text-red-600">
          {t('common:errors.error')}: {error instanceof Error ? error.message : t('organizer:eventDetail.eventNotFound')}
        </div>
      </div>
    )
  }

  const handleStatusChange = (nextStatus: EventStatus) => {
    setStatusErrorDismissed(false)
    updateEvent({ status: nextStatus })
  }

  const handleDownload = () => {
    downloadMutation.mutate(id!)
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

  const participants: Participant[] = (event.participants || []).map((p: any) => {
    if (typeof p === 'object') return p
    return { id: p } as Participant
  }).filter((p: Participant) => p.lastName)

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
      if (updateError.message.includes('Failed to fetch') || updateError.message.includes('network')) {
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
  const qrLabel = t(`organizer:eventDetail.${qrMode === 'event' ? 'actionOpen' : qrMode === 'day' ? 'tabAttendance' : 'sessions'}`)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
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
                backgroundColor: statusContext[event.status as EventStatus].bgClass.includes('gray') ? '#f3f4f6' :
                  statusContext[event.status as EventStatus].bgClass.includes('blue') ? '#dbeafe' :
                  statusContext[event.status as EventStatus].bgClass.includes('amber') ? '#fef3c7' : '#dcfce7',
                color: statusContext[event.status as EventStatus].textClass.includes('gray') ? '#6b7280' :
                  statusContext[event.status as EventStatus].textClass.includes('blue') ? '#2563eb' :
                  statusContext[event.status as EventStatus].textClass.includes('amber') ? '#d97706' : '#16a34a',
              }}
            >
              {t(`common:status.${event.status}`)}
            </Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1"
            onClick={handleDownload}
            disabled={downloadMutation.isPending}
          >
            {downloadMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            {t('organizer:eventDetail.downloadXlsx')}
          </Button>
        </div>

        {/* Metadata line */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
          {event.selectedDates && event.selectedDates.length > 0 && (
            <>
              <span>
                {event.selectedDates.map((d: any) =>
                  format(new Date(d.date), 'd MMM yyyy', { locale })
                ).join(', ')}
              </span>
              <span>·</span>
            </>
          )}
          <span>{event.location}</span>
          <span>·</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
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
              <button onClick={() => setEditingCnov(true)} className="text-blue-600 hover:text-blue-800 underline">
                {t('organizer:eventDetail.addCnov')}
              </button>
            </>
          )}
        </div>

        {/* CNOV inline edit */}
        {editingCnov && (
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={cnovValue}
              onChange={(e) => setCnovValue(e.target.value)}
              placeholder={t('organizer:eventForm.cnovPlaceholder')}
              className="w-64 h-8 text-xs"
            />
            <Button size="sm" className="h-7 text-[10px]" onClick={handleSaveCnov}>
              {t('organizer:eventDetail.saveCnov')}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleCancelCnov}>
              {t('organizer:eventDetail.cancelCnov')}
            </Button>
          </div>
        )}
      </div>

      {/* Status banner */}
      <div className={`flex items-center justify-between ${ctx.bgClass} border ${ctx.borderClass} rounded-lg px-4 py-2.5`}>
        <p className={`text-xs ${ctx.textClass}`}>
          {t(`organizer:eventDetail.status${(event.status as string).charAt(0).toUpperCase() + (event.status as string).slice(1)}`)}
        </p>
        <StatusActionButton
          status={event.status as EventStatus}
          onAction={handleStatusChange}
          isPending={isUpdating}
        />
      </div>

      {/* Status error */}
      {statusErrorMessage && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 flex-1">{statusErrorMessage}</p>
          <button onClick={() => setStatusErrorDismissed(true)} className="text-red-600 hover:text-red-800 text-sm">×</button>
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
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-700">
                    <span className="font-semibold">{globalMetrics.uniqueSigners}</span>/{participants.length}{' '}
                    {t('organizer:eventDetail.participantsSigned')}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-3.5" />
                <div className="flex items-center gap-1.5">
                  <Pen className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-700">
                    <span className="font-semibold">{globalMetrics.totalSigned}</span>/{globalMetrics.totalSlots}{' '}
                    {t('organizer:eventDetail.signaturesCollected')}
                  </span>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={`text-[10px] font-semibold px-2 py-0.5 ${
                  globalMetrics.globalPct === 100
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                {globalMetrics.globalPct}%
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${globalMetrics.globalPct}%`,
                  background: globalMetrics.globalPct === 100 ? '#22c55e' : '#3b82f6',
                }}
              />
            </div>

            {/* Context line */}
            <p className="text-[10px] text-gray-400 mt-2">
              {dayCount} {t('common:plurals.days', { count: dayCount })} · {globalMetrics.totalSessions} {t('organizer:eventDetail.sessions')} · {qrCount} QR codes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance" className="text-xs">
            {t('organizer:eventDetail.tabAttendance')}
          </TabsTrigger>
          <TabsTrigger value="participants" className="text-xs">
            {t('organizer:eventDetail.tabParticipants')} ({participants.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">
            {t('organizer:eventDetail.tabSettings')}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Attendance & QR */}
        <TabsContent value="attendance">
          {event.status === 'draft' ? (
            <div className="text-center py-8 text-neutral-500">
              {t('organizer:attendance.openEventPrompt')}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Live indicator + Download all QR */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    {t('organizer:eventDetail.liveUpdates')}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] gap-1"
                  onClick={() => {
                    // Download all QR codes (same as single download for now)
                    handleDownload()
                  }}
                >
                  <Download className="w-3 h-3" />
                  {t('organizer:eventDetail.downloadAllQr')}
                </Button>
              </div>

              <AttendanceDashboard
                eventId={event.id}
                participants={participants}
                qrGranularity={event.qrGranularity}
              />
            </div>
          )}
        </TabsContent>

        {/* Tab: Participants */}
        <TabsContent value="participants">
          <div className="space-y-4">
            {/* SIMV Search */}
            <div>
              <Label className="mb-2 block text-xs">{t('organizer:participants.searchSimv')}</Label>
              <ParticipantSearch
                onSelect={handleAddFromSimv}
                disabled={isLocked}
              />
            </div>

            {/* Walk-in form */}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWalkInForm(!showWalkInForm)}
                disabled={isLocked}
                className="w-full h-8 text-xs"
              >
                <UserPlus className="mr-2 h-3.5 w-3.5" />
                {t('organizer:participants.addWithoutRegistration')}
              </Button>

              {showWalkInForm && (
                <form onSubmit={handleAddWalkIn} className="mt-4 space-y-3 p-4 border rounded-md bg-neutral-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="lastName" className="text-xs">{t('common:form.labels.lastName')} *</Label>
                      <Input
                        id="lastName"
                        value={walkInData.lastName}
                        onChange={(e) => setWalkInData({ ...walkInData, lastName: e.target.value })}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="firstName" className="text-xs">{t('common:form.labels.firstName')} *</Label>
                      <Input
                        id="firstName"
                        value={walkInData.firstName}
                        onChange={(e) => setWalkInData({ ...walkInData, firstName: e.target.value })}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs">{t('common:form.labels.email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={walkInData.email}
                      onChange={(e) => setWalkInData({ ...walkInData, email: e.target.value })}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-xs">{t('common:form.labels.city')} *</Label>
                    <Input
                      id="city"
                      value={walkInData.city}
                      onChange={(e) => setWalkInData({ ...walkInData, city: e.target.value })}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="professionalNumber" className="text-xs">{t('organizer:walkIn.professionalNumber')}</Label>
                    <Input
                      id="professionalNumber"
                      value={walkInData.professionalNumber}
                      onChange={(e) => setWalkInData({ ...walkInData, professionalNumber: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="beneficiaryType" className="text-xs">{t('organizer:walkIn.beneficiaryType')} *</Label>
                    <Select
                      value={walkInData.beneficiaryType}
                      onValueChange={(value) => setWalkInData({ ...walkInData, beneficiaryType: value })}
                      required
                    >
                      <SelectTrigger id="beneficiaryType" className="h-8 text-xs">
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
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="h-7 text-xs">{t('common:actions.add')}</Button>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowWalkInForm(false)}>
                      {t('common:actions.cancel')}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Participants table */}
            <ParticipantTable
              data={participants}
              onRemove={handleRemoveParticipant}
              isLoading={isLocked}
              attendanceData={attendanceData}
            />
          </div>
        </TabsContent>

        {/* Tab: Settings */}
        <TabsContent value="settings">
          <div className="space-y-4">
            {/* Theme card */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="px-5 pt-4 pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  {t('organizer:eventDetail.themeTitle')}
                </CardTitle>
                {!isLocked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] text-gray-500 gap-1"
                    onClick={() => setEditingTheme(!editingTheme)}
                  >
                    <Pencil className="w-3 h-3" />
                    {editingTheme ? t('organizer:eventDetail.cancelTheme') : t('organizer:eventDetail.editTheme')}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {!editingTheme ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-5 rounded" style={{ background: currentThemeColor }} />
                    <span className="text-xs text-gray-700 font-medium">{currentThemeLabel}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <ThemeSelector value={themeValue} onChange={setThemeValue} />
                    <Button
                      size="sm"
                      className="h-7 text-[10px] bg-gray-900 hover:bg-gray-800"
                      onClick={handleSaveTheme}
                    >
                      {t('organizer:eventDetail.saveTheme')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Granularity card */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="px-5 pt-4 pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  {t('organizer:eventDetail.qrGranularityTitle')}
                </CardTitle>
                {!isLocked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] text-gray-500 gap-1"
                    onClick={() => setEditingQr(!editingQr)}
                  >
                    <Pencil className="w-3 h-3" />
                    {editingQr ? t('organizer:eventDetail.cancelTheme') : t('organizer:eventDetail.editTheme')}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {!editingQr ? (
                  <p className="text-xs text-gray-700 font-medium">
                    {qrMode === 'event'
                      ? `${t('organizer:eventCreate.qrEvent')} — 1 QR`
                      : qrMode === 'day'
                        ? `${t('organizer:eventCreate.qrDay')} — ${dayCount} QR codes`
                        : `${t('organizer:eventCreate.qrSession')} — ${globalMetrics.totalSessions} QR codes`}
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {(['event', 'day', 'session'] as const).map((opt) => {
                        const isSelected = qrMode === opt
                        const count = opt === 'event' ? 1 : opt === 'day' ? dayCount : globalMetrics.totalSessions
                        return (
                          <button
                            key={opt}
                            type="button"
                            className={`text-left rounded-lg border-2 p-3 transition-all ${
                              isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                            }`}
                            onClick={() => setQrMode(opt)}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[11px] font-semibold text-gray-800">
                                {t(`organizer:eventCreate.qr${opt.charAt(0).toUpperCase() + opt.slice(1)}`)}
                              </span>
                              <Badge
                                variant={isSelected ? 'default' : 'secondary'}
                                className={`text-[8px] px-1.5 ${isSelected ? 'bg-gray-900' : ''}`}
                              >
                                {count}
                              </Badge>
                            </div>
                            <p className="text-[9px] text-gray-400">
                              {t(`organizer:eventCreate.qr${opt.charAt(0).toUpperCase() + opt.slice(1)}Desc`)}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                    <Button
                      size="sm"
                      className="h-7 text-[10px] bg-gray-900 hover:bg-gray-800"
                      onClick={handleSaveQrGranularity}
                    >
                      {t('organizer:eventDetail.saveTheme')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export card */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="px-5 pt-4 pb-2">
                <CardTitle className="text-sm font-semibold">Export</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleDownload}
                  disabled={downloadMutation.isPending}
                >
                  {downloadMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {t('organizer:eventDetail.downloadXlsx')}
                </Button>
                <p className="text-[10px] text-gray-400 mt-2">
                  {t('organizer:eventDetail.xlsxDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
