import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { QRCodeSVG } from 'qrcode.react'
import { useEvent, useUpdateEvent, type PayloadEvent } from '@/hooks/use-events'
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
import { Loader2, AlertCircle, ChevronLeft, QrCode, UserPlus } from 'lucide-react'

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  open: 'Ouvert',
  finalized: 'Finalisé',
}

const statusColors: Record<string, string> = {
  draft: 'bg-neutral-200 text-neutral-800',
  open: 'bg-green-100 text-green-800',
  finalized: 'bg-blue-100 text-blue-800',
}

const expenseTypeLabels: Record<string, string> = {
  internal: 'Interne',
  external: 'Externe',
}

const beneficiaryTypeOptions = [
  { label: 'ASV', value: 'asv' },
  { label: 'Autre', value: 'autre' },
  { label: 'Éleveur', value: 'eleveur' },
  { label: 'Étudiant', value: 'etudiant' },
  { label: 'Pharmacien', value: 'pharmacien' },
  { label: 'Technicien', value: 'technicien' },
  { label: 'Vétérinaire', value: 'veterinaire' },
]

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: event, isLoading, isError, error } = useEvent(id || '')
  const { mutate: updateEvent, isPending: isUpdating, isError: isUpdateError, error: updateError } = useUpdateEvent(id || '')
  const { mutate: addParticipant } = useAddParticipant(id || '')
  const { mutate: removeParticipant } = useRemoveParticipant(id || '')
  const { mutate: addWalkIn } = useAddWalkIn(id || '')

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
          Retour au tableau de bord
        </Button>
        <div className="text-red-600">
          Erreur: {error instanceof Error ? error.message : 'Événement introuvable'}
        </div>
      </div>
    )
  }

  const handleStatusChange = (newStatus: 'open' | 'finalized') => {
    if (newStatus === 'finalized') {
      if (!window.confirm('Finaliser cet événement ? Cette action est définitive.')) {
        return
      }
    }
    setStatusErrorDismissed(false)
    updateEvent({ status: newStatus })
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
    if (window.confirm('Retirer ce participant de la liste ?')) {
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
        statusErrorMessage = 'Erreur de connexion, veuillez réessayer'
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
          Retour au tableau de bord
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-neutral-900">{event.title}</h1>
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <span>{event.location}</span>
              <span>•</span>
              <span>Organisateur: {event.organizerName}</span>
              <span>•</span>
              <Badge variant="outline">{expenseTypeLabels[event.expenseType] || event.expenseType}</Badge>
            </div>
            <div className="text-sm text-neutral-600">
              {event.selectedDates && event.selectedDates.length > 0 && (
                <span>
                  Dates: {event.selectedDates.map((d: any) =>
                    format(new Date(d.date), 'd MMM yyyy', { locale: fr })
                  ).join(', ')}
                </span>
              )}
            </div>
          </div>

          <Badge className={statusColors[event.status]}>
            {statusLabels[event.status]}
          </Badge>
        </div>
      </div>

      {/* Status controls */}
      <Card>
        <CardHeader>
          <CardTitle>Statut de l'événement</CardTitle>
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

          <div className="flex items-center gap-3">
            {event.status === 'draft' && (
              <Button
                onClick={() => handleStatusChange('open')}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Ouvrir l'événement
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
                Finaliser l'événement
              </Button>
            )}

            {event.status === 'finalized' && (
              <p className="text-neutral-500">Événement finalisé</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Codes */}
      {event.attendanceDays && event.attendanceDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>QR Codes pour signature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {event.attendanceDays.map((day: any) => (
                <Dialog key={day.id}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                      <QrCode className="h-6 w-6" />
                      <span className="text-sm">
                        {format(new Date(day.date), 'd MMM yyyy', { locale: fr })}
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        QR Code - {format(new Date(day.date), 'd MMMM yyyy', { locale: fr })}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                      <QRCodeSVG
                        value={`${window.location.origin}/sign/${day.id}`}
                        size={256}
                        level="H"
                      />
                      <p className="text-sm text-neutral-600 text-center">
                        Scannez ce code pour accéder à la page de signature
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
            Participants ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SIMV Search */}
          <div>
            <Label className="mb-2 block">Rechercher dans le registre SIMV</Label>
            <ParticipantSearch
              onSelect={handleAddFromSimv}
              disabled={isFinalized}
            />
          </div>

          {/* Walk-in form */}
          <div>
            <Button
              variant="outline"
              onClick={() => setShowWalkInForm(!showWalkInForm)}
              disabled={isFinalized}
              className="w-full"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Ajouter un participant sans inscription
            </Button>

            {showWalkInForm && (
              <form onSubmit={handleAddWalkIn} className="mt-4 space-y-3 p-4 border rounded-md bg-neutral-50">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="lastName">Nom *</Label>
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
                    <Label htmlFor="firstName">Prénom *</Label>
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
                  <Label htmlFor="email">Email *</Label>
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
                  <Label htmlFor="city">Ville *</Label>
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
                  <Label htmlFor="professionalNumber">Numéro d'inscription</Label>
                  <Input
                    id="professionalNumber"
                    value={walkInData.professionalNumber}
                    onChange={(e) =>
                      setWalkInData({ ...walkInData, professionalNumber: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="beneficiaryType">Type de bénéficiaire *</Label>
                  <Select
                    value={walkInData.beneficiaryType}
                    onValueChange={(value) =>
                      setWalkInData({ ...walkInData, beneficiaryType: value })
                    }
                    required
                  >
                    <SelectTrigger id="beneficiaryType">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {beneficiaryTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Ajouter</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowWalkInForm(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Participants table */}
          <ParticipantTable
            data={participants}
            onRemove={handleRemoveParticipant}
            isLoading={isFinalized}
          />
        </CardContent>
      </Card>

      {/* Attendance section */}
      <Card>
        <CardHeader>
          <CardTitle>Présence en direct</CardTitle>
        </CardHeader>
        <CardContent>
          {event.status === 'draft' ? (
            <p className="text-neutral-500 py-4">
              Ouvrez l'événement pour voir la présence en direct
            </p>
          ) : (
            <AttendanceDashboard eventId={event.id} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
