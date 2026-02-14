import { useFormContext, useFieldArray } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import type { EventFormData } from '@/lib/schemas'

export function DateSelector() {
  const { t, i18n } = useTranslation('organizer')
  const { control, formState: { errors } } = useFormContext<EventFormData>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'selectedDates',
  })

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    // Check if date already selected
    const dateString = date.toDateString()
    const alreadySelected = fields.some((field) => {
      const fieldDate = new Date(field.date)
      return fieldDate.toDateString() === dateString
    })

    if (!alreadySelected) {
      append({ date: date.toISOString() })
    }
  }

  // Convert selected dates for highlighting in calendar
  const selectedDates = fields.map((field) => new Date(field.date))

  const locale = i18n.language === 'en' ? enUS : fr

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={undefined}
          onSelect={handleDateSelect}
          locale={locale}
          modifiers={{
            selected: selectedDates,
          }}
          modifiersClassNames={{
            selected: 'bg-primary text-primary-foreground',
          }}
        />
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center">
          {t('dateSelector.clickPrompt')}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('dateSelector.selectedDates')}</p>
          <div className="flex flex-wrap gap-2">
            {fields.map((field, index) => (
              <Badge
                key={field.id}
                variant="secondary"
                className="gap-1 pl-3 pr-1"
              >
                {format(new Date(field.date), 'PPP', { locale })}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="ml-1 rounded-full p-0.5 hover:bg-neutral-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {errors.selectedDates && (
        <p className="text-sm text-red-500">
          {errors.selectedDates.message}
        </p>
      )}
    </div>
  )
}
