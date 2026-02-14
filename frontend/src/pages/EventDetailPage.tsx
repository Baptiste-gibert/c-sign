import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { QRCodeSVG } from 'qrcode.react'
import { useEvent, useUpdateEvent, type PayloadEvent } from '@/hooks/use-events'
import { useDownloadExport } from '@/hooks/use-export'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Loader2, AlertCircle, ChevronLeft, QrCode, UserPlus, Download } from 'lucide-react'

const statusColors: Record<string, string> = {
  draft: 'bg-neutral-200 text-neutral-800',
  open: 'bg-green-100 text-green-800',
  finalized: 'bg-blue-100 text-blue-800',
  reopened: 'bg-amber-100 text-amber-800',
}

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
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('organizer:eventDetail.backToDashboard')}
        </Button>
        <div className="text-red-600">
          {t('common:errors.error')}: {error instanceof Error ? error.message : t('organizer:eventDetail.eventNotFound')}
        </div>
      </div>
    )
  }

  const handleStatusChange = (newStatus: 'open' | 'finalized' | 'reopened') => {
    if (newStatus === 'finalized') {
      if (!window.confirm(t('organizer:eventDetail.finalizeConfirm'))) {
        return
      }
    }
    setStatusErrorDismissed(false)
    updateEvent({ status: newStatus })
  }

  const handleReopen = () => {
    if (!window.confirm(t('organizer:eventDetail.reopenConfirm'))) {
      return
    }
    setStatusErrorDismissed(false)
    updateEvent({ status: 'reopened' })
  }

  const handleDownload = () => {
    downloadMutation.mutate(id!)
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

  const isFinalized = event.status === 'finalized'
  const isLocked = event.status === 'finalized' // Only truly locked when finalized, not when reopened

  // Parse status update error
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('organizer:eventDetail.backToDashboard')}
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-neutral-600">
              <span>{event.location}</span>
              <span>•</span>
              <span>{t('organizer:eventDetail.organizer')} {event.organizerName}</span>
              <span>•</span>
              <Badge variant="outline">{t(`organizer:expenseTypes.${event.expenseType}`, event.expenseType)}</Badge>
              {event.cnovDeclarationNumber && (
                <>
                  <span>•</span>
                  <span>{t('organizer:eventDetail.cnov')} {event.cnovDeclarationNumber}</span>
                </>
              )}
            </div>
            <div className="text-sm text-neutral-600">
              {event.selectedDates && event.selectedDates.length > 0 && (
                <span>
                  {t('organizer:eventDetail.dates')} {event.selectedDates.map((d: any) =>
                    format(new Date(d.date), 'd MMM yyyy', { locale })
                  ).join(', ')}
                </span>
              )}
            </div>
          </div>

          <Badge className={statusColors[event.status]}>
            {t(`common:status.${event.status}`)}
          </Badge>
        </div>
      </div>

      {/* Status controls */}
      <Card>
        <CardHeader>
          <CardTitle>{t('organizer:eventDetail.statusTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {statusErrorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{statusErrorMessage}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusErrorDismissed(true)}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {event.status === 'draft' && (
              <Button
                onClick={() => handleStatusChange('open')}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t('organizer:eventDetail.openEvent')}
              </Button>
            )}

            {event.status === 'open' && (
              <Button
                onClick={() => handleStatusChange('finalized')}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t('organizer:eventDetail.finalizeEvent')}
              </Button>
            )}

            {event.status === 'finalized' && (
              <>
                <p className="text-neutral-500">{t('organizer:eventDetail.eventFinalized')}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={handleReopen}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t('organizer:eventDetail.reopenEvent')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    disabled={downloadMutation.isPending}
                  >
                    {downloadMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('organizer:eventDetail.generating')}
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        {t('organizer:eventDetail.downloadXlsx')}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {event.status === 'reopened' && (
              <>
                <p className="text-neutral-500">{t('organizer:eventDetail.eventReopened')}</p>
                <Button
                  onClick={() => handleStatusChange('finalized')}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t('organizer:eventDetail.refinalizeEvent')}
                </Button>
              </>
            )}
          </div>

          {downloadMutation.isError && (
            <p className="text-sm text-red-600">
              {t('organizer:eventDetail.downloadError')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* QR Codes */}
      {event.attendanceDays && event.attendanceDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('organizer:qrCodes.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {event.attendanceDays.map((day: any) => (
                <Dialog key={day.id}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                      <QrCode className="h-6 w-6" />
                      <span className="text-sm">
                        {format(new Date(day.date), 'd MMM yyyy', { locale })}
                      </span>
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participants section */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('organizer:participants.title')} ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SIMV Search */}
          <div>
            <Label className="mb-2 block">{t('organizer:participants.searchSimv')}</Label>
            <ParticipantSearch
              onSelect={handleAddFromSimv}
              disabled={isLocked}
            />
          </div>

          {/* Walk-in form */}
          <div>
            <Button
              variant="outline"
              onClick={() => setShowWalkInForm(!showWalkInForm)}
              disabled={isLocked}
              className="w-full"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {t('organizer:participants.addWithoutRegistration')}
            </Button>

            {showWalkInForm && (
              <form onSubmit={handleAddWalkIn} className="mt-4 space-y-3 p-4 border rounded-md bg-neutral-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="lastName">{t('common:form.labels.lastName')} *</Label>
                    <Input
                      id="lastName"
                      value={walkInData.lastName}
                      onChange={(e) =>
                        setWalkInData({ ...walkInData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">{t('common:form.labels.firstName')} *</Label>
                    <Input
                      id="firstName"
                      value={walkInData.firstName}
                      onChange={(e) =>
                        setWalkInData({ ...walkInData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">{t('common:form.labels.email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={walkInData.email}
                    onChange={(e) =>
                      setWalkInData({ ...walkInData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="city">{t('common:form.labels.city')} *</Label>
                  <Input
                    id="city"
                    value={walkInData.city}
                    onChange={(e) =>
                      setWalkInData({ ...walkInData, city: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="professionalNumber">{t('organizer:walkIn.professionalNumber')}</Label>
                  <Input
                    id="professionalNumber"
                    value={walkInData.professionalNumber}
                    onChange={(e) =>
                      setWalkInData({ ...walkInData, professionalNumber: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="beneficiaryType">{t('organizer:walkIn.beneficiaryType')} *</Label>
                  <Select
                    value={walkInData.beneficiaryType}
                    onValueChange={(value) =>
                      setWalkInData({ ...walkInData, beneficiaryType: value })
                    }
                    required
                  >
                    <SelectTrigger id="beneficiaryType">
                      <SelectValue placeholder={t('organizer:walkIn.selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {BENEFICIARY_TYPE_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`common:beneficiaryTypes.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">{t('common:actions.add')}</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowWalkInForm(false)}
                  >
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
          />
        </CardContent>
      </Card>

      {/* Attendance section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('organizer:attendance.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {event.status === 'draft' ? (
            <p className="text-neutral-500 py-4">
              {t('organizer:attendance.openEventPrompt')}
            </p>
          ) : (
            <AttendanceDashboard eventId={event.id} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
