import { Link, useNavigate } from 'react-router-dom'
import { useEvents } from '@/hooks/use-events'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const EXPENSE_TYPE_LABELS: Record<string, string> = {
  hospitality_snack: 'Hospitalite - Collation',
  hospitality_catering: 'Hospitalite - Restauration',
  hospitality_accommodation: 'Hospitalite - Hebergement',
  event_registration: "Frais d'inscription evenement",
  meeting_organization: 'Frais de reunion/organisation',
  transport: 'Frais de transport',
}

function formatEventDates(dates: Array<{ id: string; date: string }>): string {
  if (dates.length === 0) return '-'
  if (dates.length === 1) {
    return format(new Date(dates[0].date), 'PPP', { locale: fr })
  }
  return `${dates.length} jours`
}

function StatusBadge({ status }: { status: 'draft' | 'open' | 'finalized' }) {
  const variants = {
    draft: { variant: 'secondary' as const, label: 'Brouillon' },
    open: { variant: 'default' as const, label: 'Ouvert' },
    finalized: { variant: 'outline' as const, label: 'Finalise' },
  }

  const config = variants[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: events, isLoading } = useEvents()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Mes evenements</h1>
        <Button onClick={() => navigate('/events/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel evenement
        </Button>
      </div>

      {/* Empty State */}
      {events && events.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-neutral-600 text-lg">Aucun evenement</p>
          <Button onClick={() => navigate('/events/new')}>
            Creez votre premier evenement
          </Button>
        </div>
      )}

      {/* Event List Table */}
      {events && events.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Type de depense</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Link
                      to={`/events/${event.id}`}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {event.title}
                    </Link>
                  </TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{formatEventDates(event.selectedDates)}</TableCell>
                  <TableCell>
                    {EXPENSE_TYPE_LABELS[event.expenseType] || event.expenseType}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={event.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <Link to={`/events/${event.id}`}>Voir</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
