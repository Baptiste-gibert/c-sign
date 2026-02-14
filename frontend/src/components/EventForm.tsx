import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
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

const EXPENSE_TYPE_KEYS = [
  'hospitality_snack',
  'hospitality_catering',
  'hospitality_accommodation',
  'event_registration',
  'meeting_organization',
  'transport',
] as const

export function EventForm({ onSubmit, isSubmitting = false }: EventFormProps) {
  const { t } = useTranslation('organizer')
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
          <Label htmlFor="title">{t('eventForm.title')}</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder={t('eventForm.titlePlaceholder')}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">{t('eventForm.location')}</Label>
          <Input
            id="location"
            {...register('location')}
            placeholder={t('eventForm.locationPlaceholder')}
          />
          {errors.location && (
            <p className="text-sm text-red-500">{errors.location.message}</p>
          )}
        </div>

        {/* Organizer Name */}
        <div className="space-y-2">
          <Label htmlFor="organizerName">{t('eventForm.organizerName')}</Label>
          <Input
            id="organizerName"
            {...register('organizerName')}
            placeholder={t('eventForm.organizerNamePlaceholder')}
          />
          {errors.organizerName && (
            <p className="text-sm text-red-500">{errors.organizerName.message}</p>
          )}
        </div>

        {/* Organizer Email */}
        <div className="space-y-2">
          <Label htmlFor="organizerEmail">{t('eventForm.organizerEmail')}</Label>
          <Input
            id="organizerEmail"
            type="email"
            {...register('organizerEmail')}
            placeholder={t('eventForm.organizerEmailPlaceholder')}
          />
          {errors.organizerEmail && (
            <p className="text-sm text-red-500">{errors.organizerEmail.message}</p>
          )}
        </div>

        {/* Expense Type */}
        <div className="space-y-2">
          <Label htmlFor="expenseType">{t('eventForm.expenseType')}</Label>
          <Controller
            name="expenseType"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('eventForm.expenseTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPE_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`expenseTypes.${key}`)}
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
          <Label>{t('eventForm.eventDates')}</Label>
          <DateSelector />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? t('eventForm.submitting') : t('eventForm.submit')}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
