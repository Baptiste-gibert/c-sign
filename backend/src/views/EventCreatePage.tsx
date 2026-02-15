import { ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EventForm } from '@/components/EventForm'
import { useCreateEvent } from '@/hooks/use-events'
import { useNavigate } from '@/lib/navigation'
import type { EventFormData } from '@/lib/schemas'

export function EventCreatePage() {
  const { t } = useTranslation('organizer')
  const navigate = useNavigate()
  const createEvent = useCreateEvent({
    onSuccess: (event) => {
      navigate(`/events/${event.id}`)
    },
  })

  const handleSubmit = (data: EventFormData) => {
    createEvent.mutate(data)
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-4 py-6">
      {/* Header */}
      <div className="space-y-1">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-0.5 text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('eventDetail.backToDashboard')}
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t('eventCreate.pageTitle')}</h1>
        <p className="text-xs text-gray-400">{t('eventCreate.pageSubtitle')}</p>
      </div>

      {/* Error Message */}
      {createEvent.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{t('eventCreate.createError')}</p>
          {createEvent.error && (
            <p className="mt-1 text-sm text-red-600">{createEvent.error.message}</p>
          )}
        </div>
      )}

      {/* Event Form */}
      <EventForm onSubmit={handleSubmit} isSubmitting={createEvent.isPending} />
    </div>
  )
}
