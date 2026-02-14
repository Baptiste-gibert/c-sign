import { useState, useMemo } from 'react'
import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { createEventSchema, type EventFormData } from '@/lib/schemas'
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
import { SectionStep } from '@/components/ui/section-step'
import { DaySessionEditor, type AttendanceDay } from '@/components/DaySessionEditor'
import { ThemeSelector } from '@/components/ThemeSelector'

interface EventFormProps {
  onSubmit: (data: any) => void
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
  const { t, i18n } = useTranslation('organizer')
  const { t: tc } = useTranslation('common')
  const { user } = useAuth()
  const resolver = useMemo(() => zodResolver(createEventSchema()), [i18n.language])

  const [days, setDays] = useState<AttendanceDay[]>([])
  const [qrGranularity, setQrGranularity] = useState<'event' | 'day' | 'session'>('day')

  const form = useForm<EventFormData>({
    resolver,
    defaultValues: {
      title: '',
      location: '',
      organizerName: user ? `${user.firstName} ${user.lastName}` : '',
      organizerEmail: user?.email || '',
      expenseType: undefined,
      cnovDeclarationNumber: '',
      theme: null,
      days: [],
      qrGranularity: 'day',
    },
  })

  const { handleSubmit, register, control, setValue, formState: { errors } } = form

  // Sync local days state with form
  const handleDaysChange = (newDays: AttendanceDay[]) => {
    setDays(newDays)
    setValue('days', newDays, { shouldValidate: true })
  }

  const handleQrChange = (g: 'event' | 'day' | 'session') => {
    setQrGranularity(g)
    setValue('qrGranularity', g)
  }

  const handleFormSubmit = (formData: EventFormData) => {
    const selectedDates = formData.days.map((d) => ({
      date: new Date(d.date + 'T12:00:00').toISOString(),
    }))
    onSubmit({
      title: formData.title,
      location: formData.location,
      organizerName: formData.organizerName,
      organizerEmail: formData.organizerEmail,
      expenseType: formData.expenseType,
      cnovDeclarationNumber: formData.cnovDeclarationNumber,
      theme: formData.theme,
      selectedDates,
      daySessionConfig: formData.days,
      qrGranularity: formData.qrGranularity,
    })
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Section 1: Informations */}
        <SectionStep step={1} title={t('eventCreate.informations')}>
          <div className="grid grid-cols-2 gap-3">
            {/* Title */}
            <div className="space-y-1">
              <Label htmlFor="title" className="text-[10px] text-gray-500 font-medium">
                {t('eventForm.title')} *
              </Label>
              <Input
                id="title"
                {...register('title')}
                placeholder={t('eventForm.titlePlaceholder')}
                className="h-8 text-xs"
              />
              {errors.title && (
                <p className="text-[10px] text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-1">
              <Label htmlFor="location" className="text-[10px] text-gray-500 font-medium">
                {t('eventForm.location')} *
              </Label>
              <Input
                id="location"
                {...register('location')}
                placeholder={t('eventForm.locationPlaceholder')}
                className="h-8 text-xs"
              />
              {errors.location && (
                <p className="text-[10px] text-red-500">{errors.location.message}</p>
              )}
            </div>

            {/* Expense Type */}
            <div className="space-y-1">
              <Label htmlFor="expenseType" className="text-[10px] text-gray-500 font-medium">
                {t('eventForm.expenseType')} *
              </Label>
              <Controller
                name="expenseType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder={t('eventForm.expenseTypePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_TYPE_KEYS.map((key) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {t(`expenseTypes.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.expenseType && (
                <p className="text-[10px] text-red-500">{errors.expenseType.message}</p>
              )}
            </div>

            {/* CNOV Declaration Number */}
            <div className="space-y-1">
              <Label htmlFor="cnovDeclarationNumber" className="text-[10px] text-gray-500 font-medium">
                {t('eventForm.cnovDeclarationNumber')}
              </Label>
              <Input
                id="cnovDeclarationNumber"
                {...register('cnovDeclarationNumber')}
                placeholder={t('eventForm.cnovPlaceholder')}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </SectionStep>

        {/* Section 2: Organizer (muted, pre-filled) */}
        <SectionStep
          step={2}
          title={t('eventCreate.organizer')}
          badge={t('eventCreate.prefilled')}
          muted
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="organizerName" className="text-[10px] text-gray-500 font-medium">
                {t('eventForm.organizerName')}
              </Label>
              <Input
                id="organizerName"
                {...register('organizerName')}
                readOnly
                className="h-8 text-xs bg-white text-gray-500"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="organizerEmail" className="text-[10px] text-gray-500 font-medium">
                {t('eventForm.organizerEmail')}
              </Label>
              <Input
                id="organizerEmail"
                type="email"
                {...register('organizerEmail')}
                readOnly
                className="h-8 text-xs bg-white text-gray-500"
              />
            </div>
          </div>
        </SectionStep>

        {/* Section 3: Days & Sessions */}
        <SectionStep
          step={3}
          title={t('eventCreate.daysSessions')}
          description={t('eventCreate.daysSessionsDesc')}
        >
          <DaySessionEditor
            days={days}
            onDaysChange={handleDaysChange}
            qrGranularity={qrGranularity}
            onQrGranularityChange={handleQrChange}
          />
          {errors.days && (
            <p className="text-[10px] text-red-500 mt-1">
              {typeof errors.days.message === 'string'
                ? errors.days.message
                : t('validation.atLeastOneDateRequired')}
            </p>
          )}
        </SectionStep>

        {/* Section 4: Theme (optional) */}
        <SectionStep
          step={4}
          title={t('eventForm.theme')}
          badge={tc('optional')}
          description={t('eventCreate.themeDesc')}
        >
          <Controller
            name="theme"
            control={control}
            render={({ field }) => (
              <ThemeSelector
                value={field.value ?? null}
                onChange={field.onChange}
              />
            )}
          />
        </SectionStep>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-9 text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800"
        >
          {isSubmitting ? t('eventForm.submitting') : t('eventForm.submit')}
        </Button>
      </form>
    </FormProvider>
  )
}
