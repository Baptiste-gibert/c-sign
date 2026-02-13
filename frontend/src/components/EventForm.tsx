import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventSchema, type EventFormData } from '@/lib/schemas'
import { useAuth } from '@/hooks/use-auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateSelector } from '@/components/DateSelector'

interface EventFormProps {
  onSubmit: (data: EventFormData) => void
  isSubmitting?: boolean
}

const EXPENSE_TYPES = [
  { value: 'hospitality_snack', label: 'Hospitalite - Collation' },
  { value: 'hospitality_catering', label: 'Hospitalite - Restauration' },
  { value: 'hospitality_accommodation', label: 'Hospitalite - Hebergement' },
  { value: 'event_registration', label: "Frais d'inscription evenement" },
  { value: 'meeting_organization', label: 'Frais de reunion/organisation' },
  { value: 'transport', label: 'Frais de transport' },
] as const

export function EventForm({ onSubmit, isSubmitting = false }: EventFormProps) {
  const { user } = useAuth()

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      location: '',
      organizerName: user ? `${user.firstName} ${user.lastName}` : '',
      organizerEmail: user?.email || '',
      expenseType: undefined,
      selectedDates: [],
    },
  })

  const { handleSubmit, register, control, formState: { errors } } = form

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Titre de l'evenement</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Reunion veterinaire..."
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Lieu</Label>
          <Input
            id="location"
            {...register('location')}
            placeholder="Paris, France"
          />
          {errors.location && (
            <p className="text-sm text-red-500">{errors.location.message}</p>
          )}
        </div>

        {/* Organizer Name */}
        <div className="space-y-2">
          <Label htmlFor="organizerName">Nom de l'organisateur</Label>
          <Input
            id="organizerName"
            {...register('organizerName')}
            placeholder="Jean Dupont"
          />
          {errors.organizerName && (
            <p className="text-sm text-red-500">{errors.organizerName.message}</p>
          )}
        </div>

        {/* Organizer Email */}
        <div className="space-y-2">
          <Label htmlFor="organizerEmail">Email de l'organisateur</Label>
          <Input
            id="organizerEmail"
            type="email"
            {...register('organizerEmail')}
            placeholder="jean.dupont@example.com"
          />
          {errors.organizerEmail && (
            <p className="text-sm text-red-500">{errors.organizerEmail.message}</p>
          )}
        </div>

        {/* Expense Type */}
        <div className="space-y-2">
          <Label htmlFor="expenseType">Type de depense</Label>
          <Controller
            name="expenseType"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selectionnez un type de depense" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.expenseType && (
            <p className="text-sm text-red-500">{errors.expenseType.message}</p>
          )}
        </div>

        {/* Date Selector */}
        <div className="space-y-2">
          <Label>Dates de l'evenement</Label>
          <DateSelector />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creation en cours...' : "Creer l'evenement"}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
