import { useNavigate } from 'react-router-dom'
import { useCreateEvent } from '@/hooks/use-events'
import { EventForm } from '@/components/EventForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { EventFormData } from '@/lib/schemas'

export function EventCreatePage() {
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
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-neutral-900">Nouvel evenement</h1>
      </div>

      {/* Error Message */}
      {createEvent.isError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">
            Erreur lors de la creation de l'evenement. Veuillez reessayer.
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
