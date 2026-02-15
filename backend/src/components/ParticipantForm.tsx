import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { SignatureCanvas, type SignatureCanvasHandle } from '@/components/SignatureCanvas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createParticipantSchema, type ParticipantFormData } from '@/lib/schemas'

interface ParticipantFormProps {
  onSubmit: (data: ParticipantFormData, signatureBlob: Blob) => void
  isPending: boolean
  error: Error | null
}

export function ParticipantForm({ onSubmit, isPending, error }: ParticipantFormProps) {
  const { t, i18n } = useTranslation(['public', 'common'])
  const signatureRef = useRef<SignatureCanvasHandle>(null)
  const [signatureError, setSignatureError] = useState<string | null>(null)
  const resolver = useMemo(() => zodResolver(createParticipantSchema()), [i18n.language])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ParticipantFormData>({
    resolver,
    defaultValues: {
      consentRightToImage: false,
    },
  })

  const beneficiaryType = watch('beneficiaryType')

  const handleFormSubmit = async (data: ParticipantFormData) => {
    // Check signature canvas is not empty
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setSignatureError(t('public:signatureRequired'))
      return
    }

    // Get signature blob
    const blob = await signatureRef.current.getBlob()
    if (!blob) {
      setSignatureError(t('public:signatureCaptureError'))
      return
    }

    setSignatureError(null)
    onSubmit(data, blob)
  }

  return (
    <Card style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-c)' }}>
      <CardHeader>
        <CardTitle
          className="text-[20px] font-bold tracking-[-0.25px]"
          style={{ color: 'var(--text)' }}
        >
          {t('public:attendanceSheet')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3.5">
          {/* Nom / Prénom - 2-col grid */}
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="lastName"
                className="text-[10px] font-medium tracking-[0.2px] uppercase"
                style={{ color: 'var(--text-sec)' }}
              >
                {t('common:form.labels.lastName')} *
              </Label>
              <Input
                id="lastName"
                {...register('lastName')}
                className="h-9 rounded-md text-xs focus:ring-1 focus:ring-[var(--accent)] focus:ring-offset-0"
                style={{
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--border-c)',
                }}
              />
              {errors.lastName && (
                <p className="text-sm" style={{ color: 'var(--error)' }}>
                  {errors.lastName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="firstName"
                className="text-[10px] font-medium tracking-[0.2px] uppercase"
                style={{ color: 'var(--text-sec)' }}
              >
                {t('common:form.labels.firstName')} *
              </Label>
              <Input
                id="firstName"
                {...register('firstName')}
                className="h-9 rounded-md text-xs focus:ring-1 focus:ring-[var(--accent)] focus:ring-offset-0"
                style={{
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--border-c)',
                }}
              />
              {errors.firstName && (
                <p className="text-sm" style={{ color: 'var(--error)' }}>
                  {errors.firstName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-[10px] font-medium tracking-[0.2px] uppercase"
              style={{ color: 'var(--text-sec)' }}
            >
              {t('common:form.labels.email')} *
            </Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              {...register('email')}
              className="h-9 rounded-md text-xs focus:ring-1 focus:ring-[var(--accent)] focus:ring-offset-0"
              style={{
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                borderColor: 'var(--border-c)',
              }}
            />
            {errors.email && (
              <p className="text-sm" style={{ color: 'var(--error)' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Ville / N° pro - 2-col grid */}
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="city"
                className="text-[10px] font-medium tracking-[0.2px] uppercase"
                style={{ color: 'var(--text-sec)' }}
              >
                {t('common:form.labels.city')} *
              </Label>
              <Input
                id="city"
                {...register('city')}
                className="h-9 rounded-md text-xs focus:ring-1 focus:ring-[var(--accent)] focus:ring-offset-0"
                style={{
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--border-c)',
                }}
              />
              {errors.city && (
                <p className="text-sm" style={{ color: 'var(--error)' }}>
                  {errors.city.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="professionalNumber"
                className="text-[10px] font-medium tracking-[0.2px] uppercase"
                style={{ color: 'var(--text-sec)' }}
              >
                {t('public:professionalNumber')}
              </Label>
              <Input
                id="professionalNumber"
                {...register('professionalNumber')}
                className="h-9 rounded-md text-xs focus:ring-1 focus:ring-[var(--accent)] focus:ring-offset-0"
                style={{
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--border-c)',
                }}
              />
              {errors.professionalNumber && (
                <p className="text-sm" style={{ color: 'var(--error)' }}>
                  {errors.professionalNumber.message}
                </p>
              )}
            </div>
          </div>
          <p className="-mt-2 text-sm" style={{ color: 'var(--text-sec)' }}>
            {t('public:professionalNumberHelp')}
          </p>

          {/* Type de bénéficiaire */}
          <div className="space-y-1.5">
            <Label
              htmlFor="beneficiaryType"
              className="text-[10px] font-medium tracking-[0.2px] uppercase"
              style={{ color: 'var(--text-sec)' }}
            >
              {t('public:beneficiaryType')} *
            </Label>
            <Select
              onValueChange={(value) =>
                setValue('beneficiaryType', value as ParticipantFormData['beneficiaryType'])
              }
            >
              <SelectTrigger
                className="h-9 rounded-md text-xs focus:ring-1 focus:ring-[var(--accent)] focus:ring-offset-0"
                style={{
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--border-c)',
                }}
              >
                <SelectValue placeholder={t('public:selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-c)' }}
              >
                <SelectItem value="asv" className="cursor-pointer text-xs">
                  {t('common:beneficiaryTypes.asv')}
                </SelectItem>
                <SelectItem value="autre" className="cursor-pointer text-xs">
                  {t('common:beneficiaryTypes.autre')}
                </SelectItem>
                <SelectItem value="eleveur" className="cursor-pointer text-xs">
                  {t('common:beneficiaryTypes.eleveur')}
                </SelectItem>
                <SelectItem value="etudiant" className="cursor-pointer text-xs">
                  {t('common:beneficiaryTypes.etudiant')}
                </SelectItem>
                <SelectItem value="pharmacien" className="cursor-pointer text-xs">
                  {t('common:beneficiaryTypes.pharmacien')}
                </SelectItem>
                <SelectItem value="technicien" className="cursor-pointer text-xs">
                  {t('common:beneficiaryTypes.technicien')}
                </SelectItem>
                <SelectItem value="veterinaire" className="cursor-pointer text-xs">
                  {t('common:beneficiaryTypes.veterinaire')}
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.beneficiaryType && (
              <p className="text-sm" style={{ color: 'var(--error)' }}>
                {errors.beneficiaryType.message}
              </p>
            )}
          </div>

          {/* Préciser le type (conditional) */}
          {beneficiaryType === 'autre' && (
            <div className="space-y-1.5">
              <Label
                htmlFor="beneficiaryTypeOther"
                className="text-[10px] font-medium tracking-[0.2px] uppercase"
                style={{ color: 'var(--text-sec)' }}
              >
                {t('public:specifyType')} *
              </Label>
              <Input
                id="beneficiaryTypeOther"
                {...register('beneficiaryTypeOther')}
                className="h-9 rounded-md text-xs focus:ring-1 focus:ring-[var(--accent)] focus:ring-offset-0"
                style={{
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--border-c)',
                }}
              />
              {errors.beneficiaryTypeOther && (
                <p className="text-sm" style={{ color: 'var(--error)' }}>
                  {errors.beneficiaryTypeOther.message}
                </p>
              )}
            </div>
          )}

          {/* Signature */}
          <div className="space-y-1.5">
            <Label
              className="text-[10px] font-medium tracking-[0.2px] uppercase"
              style={{ color: 'var(--text-sec)' }}
            >
              {t('public:signature')} *
            </Label>
            <SignatureCanvas ref={signatureRef} />
            {signatureError && (
              <p className="text-sm" style={{ color: 'var(--error)' }}>
                {signatureError}
              </p>
            )}
          </div>

          {/* Separator before consent */}
          <div style={{ borderColor: 'var(--border-c)' }} className="my-4 border-t" />

          {/* Droit à l'image */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="consentRightToImage"
              onCheckedChange={(checked) => setValue('consentRightToImage', checked === true)}
              className="data-[state=checked]:bg-[var(--accent)]"
            />
            <Label
              htmlFor="consentRightToImage"
              className="cursor-pointer text-[11px] leading-snug"
              style={{ color: 'var(--text-sec)' }}
            >
              {t('public:consentRightToImage')}
            </Label>
          </div>
          {errors.consentRightToImage && (
            <p className="text-sm" style={{ color: 'var(--error)' }}>
              {errors.consentRightToImage.message}
            </p>
          )}

          {/* Global error */}
          {error && (
            <div
              className="rounded-md border p-3"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--error) 30%, transparent)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--error)' }}>
                {error.message}
              </p>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className={`h-10 w-full rounded-lg text-[13px] font-semibold ${isPending ? 'cursor-wait opacity-70' : ''}`}
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
            disabled={isPending}
          >
            {isPending ? t('public:submitting') : t('public:sign')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
