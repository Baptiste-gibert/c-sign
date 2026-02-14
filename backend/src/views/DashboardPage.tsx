import { useState } from 'react'
import Link from 'next/link'
import { useNavigate } from '@/lib/navigation'
import { useTranslation } from 'react-i18next'
import { useEvents } from '@/hooks/use-events'
import { statusConfig, type EventStatus } from '@/config/status'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Loader2, Search } from 'lucide-react'
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

export function DashboardPage() {
  const { t, i18n } = useTranslation('organizer')
  const { t: tCommon } = useTranslation('common')
  const navigate = useNavigate()
  const { data: events, isLoading } = useEvents()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | EventStatus>('all')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  // Compute counts for header subtitle
  const total = events?.length ?? 0
  const active = events?.filter((e) => e.status === 'open' || e.status === 'reopened').length ?? 0

  // Combined search + status filtering
  const filtered = (events ?? []).filter((e) => {
    if (filter !== 'all' && e.status !== filter) return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Filter pill definitions
  const filters: Array<{ key: 'all' | EventStatus; label: string }> = [
    { key: 'all', label: t('dashboard.filter.all') },
    { key: 'draft', label: t('dashboard.filter.draft') },
    { key: 'open', label: t('dashboard.filter.open') },
    { key: 'finalized', label: t('dashboard.filter.finalized') },
    { key: 'reopened', label: t('dashboard.filter.reopened') },
  ]

  return (
    <div className="space-y-4">
      {/* Header: title + counter + button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t('dashboard.title')}</h1>
          {total > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {t('dashboard.subtitle', { total, active })}
            </p>
          )}
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs bg-gray-900 text-white hover:bg-gray-800"
          onClick={() => navigate('/events/new')}
        >
          <Plus className="w-3.5 h-3.5" />
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

      {/* Toolbar: search + filter pills */}
      {events && events.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder={t('dashboard.search')}
                className="h-8 text-xs pl-8 bg-white border-gray-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Status filter pills */}
            <div className="flex gap-1">
              {filters.map((f) => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-7 text-[10px] px-2.5 ${
                    filter === f.key ? 'bg-gray-900 text-white hover:bg-gray-800' : 'text-gray-500'
                  }`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Card-wrapped table */}
          <Card className="border border-gray-200 bg-white overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 bg-gray-50/60 hover:bg-gray-50/60">
                    <TableHead className="text-xs font-medium text-gray-500">{t('table.headers.title')}</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500 hidden md:table-cell">{t('table.headers.location')}</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">{t('table.headers.dates')}</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500 hidden md:table-cell">{t('table.headers.expenseType')}</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">{t('table.headers.signatures')}</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">{t('table.headers.status')}</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500 text-right">{t('table.headers.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((event) => {
                    const st = statusConfig[event.status] ?? statusConfig.draft
                    const participantTotal = event.participantCount ?? 0
                    const signatureDone = event.signatureCount ?? 0
                    const pct = participantTotal > 0 ? Math.round((signatureDone / participantTotal) * 100) : 0

                    return (
                      <TableRow
                        key={event.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <TableCell className="px-4 py-3">
                          <span className="font-medium text-gray-900">{event.title}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3 hidden md:table-cell">{event.location}</TableCell>
                        <TableCell className="px-4 py-3">
                          <FormatEventDates dates={event.selectedDates} language={i18n.language} />
                        </TableCell>
                        <TableCell className="px-4 py-3 hidden md:table-cell">
                          {t(`expenseTypes.${event.expenseType}`, event.expenseType)}
                        </TableCell>
                        {/* Signatures column with progress bar */}
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${pct}%`,
                                  background: pct === 100 ? '#22c55e' : '#3b82f6',
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 tabular-nums">
                              {signatureDone}/{participantTotal}
                            </span>
                          </div>
                        </TableCell>
                        {/* Status badge */}
                        <TableCell className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-medium gap-1.5 px-2 py-0.5"
                            style={{ background: st.bg, color: st.text }}
                          >
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full"
                              style={{ background: st.dot }}
                            />
                            {tCommon(`status.${event.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link href={`/events/${event.id}`}>{t('dashboard.viewEvent')} &rarr;</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
