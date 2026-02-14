import { useTranslation } from 'react-i18next'
import { useAttendanceDashboard } from '@/hooks/use-attendance'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { CheckCircle, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AttendanceDashboardProps {
  eventId: string
}

export function AttendanceDashboard({ eventId }: AttendanceDashboardProps) {
  const { t, i18n } = useTranslation(['organizer', 'common'])
  const { data, isLoading, isError, error } = useAttendanceDashboard(eventId)
  const locale = i18n.language === 'en' ? enUS : fr

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
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        {t('organizer:attendance.autoUpdate')}
      </div>

      {data.attendanceDays.map((day) => (
        <div key={day.id} className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-900">
            {format(new Date(day.date), 'EEEE d MMMM yyyy', { locale })}
          </h3>

          {day.sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{session.name}</span>
                  <span className="text-sm font-normal text-neutral-600">
                    {session.signedCount} / {session.totalExpected} {t('organizer:attendance.present')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${
                          session.totalExpected > 0
                            ? (session.signedCount / session.totalExpected) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Participants list */}
                <div className="space-y-2">
                  {session.signatures.length > 0 ? (
                    session.signatures.map((signature) => (
                      <div
                        key={signature.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="font-medium">
                          {signature.participant.lastName}{' '}
                          {signature.participant.firstName}
                        </span>
                        <span className="text-neutral-500">• {t('organizer:attendance.signed')}</span>
                        <span className="text-neutral-400 ml-auto">
                          {format(
                            new Date(signature.createdAt),
                            'HH:mm',
                            { locale }
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{t('organizer:attendance.noSignatures')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}
