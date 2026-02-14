import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { fr, enUS } from 'date-fns/locale'

function FormatEventDates({ dates, language }: { dates: Array<{ id: string; date: string }>; language: string }) {
  const { t } = useTranslation('common')
  if (dates.length === 0) return <>-</>
  if (dates.length === 1) {
    return <>{format(new Date(dates[0].date), 'PPP', { locale: language === 'en' ? enUS : fr })}</>
  }
  return <>{t('plurals.days', { count: dates.length })}</>
}

function StatusBadge({ status }: { status: 'draft' | 'open' | 'finalized' | 'reopened' }) {
  const { t } = useTranslation('common')
  const variants = {
    draft: { variant: 'secondary' as const, label: t('status.draft') },
    open: { variant: 'default' as const, label: t('status.open') },
    finalized: { variant: 'outline' as const, label: t('status.finalized') },
    reopened: { variant: 'default' as const, label: t('status.reopened') },
  }

  const config = variants[status] || variants.draft
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function DashboardPage() {
  const { t, i18n } = useTranslation('organizer')
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
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t('dashboard.title')}</h1>
        <Button onClick={() => navigate('/events/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('dashboard.newEvent')}
        </Button>
      </div>

      {/* Empty State */}
      {events && events.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-neutral-600 text-lg">{t('dashboard.noEvents')}</p>
          <Button onClick={() => navigate('/events/new')}>
            {t('dashboard.createFirst')}
          </Button>
        </div>
      )}

      {/* Event List Table */}
      {events && events.length > 0 && (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.headers.title')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('table.headers.location')}</TableHead>
                <TableHead>{t('table.headers.dates')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('table.headers.expenseType')}</TableHead>
                <TableHead>{t('table.headers.status')}</TableHead>
                <TableHead className="text-right">{t('table.headers.actions')}</TableHead>
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
                  <TableCell className="hidden md:table-cell">{event.location}</TableCell>
                  <TableCell><FormatEventDates dates={event.selectedDates} language={i18n.language} /></TableCell>
                  <TableCell className="hidden md:table-cell">
                    {t(`expenseTypes.${event.expenseType}`, event.expenseType)}
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
                      <Link to={`/events/${event.id}`}>{t('common:actions.view')}</Link>
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
