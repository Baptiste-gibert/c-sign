import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCreateEvent } from '@/hooks/use-events'
import { EventForm } from '@/components/EventForm'
import { ChevronLeft } from 'lucide-react'
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
    <div className="max-w-[640px] mx-auto space-y-4 py-6">
      {/* Header */}
      <div className="space-y-1">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('eventDetail.backToDashboard')}
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t('eventCreate.pageTitle')}</h1>
        <p className="text-xs text-gray-400">{t('eventCreate.pageSubtitle')}</p>
      </div>

      {/* Error Message */}
      {createEvent.isError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">
            {t('eventCreate.createError')}
          </p>
          {createEvent.error && (
            <p className="text-sm text-red-600 mt-1">
              {createEvent.error.message}
            </p>
          )}
        </div>
      )}

      {/* Event Form */}
      <EventForm
        onSubmit={handleSubmit}
        isSubmitting={createEvent.isPending}
      />
    </div>
  )
}
