import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { participantSchema, type ParticipantFormData } from '@/lib/schemas'
import { SignatureCanvas, type SignatureCanvasHandle } from '@/components/SignatureCanvas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ParticipantFormProps {
  onSubmit: (data: ParticipantFormData, signatureBlob: Blob) => void
  isPending: boolean
  error: Error | null
}

export function ParticipantForm({ onSubmit, isPending, error }: ParticipantFormProps) {
  const { t } = useTranslation(['public', 'common'])
  const signatureRef = useRef<SignatureCanvasHandle>(null)
  const [signatureError, setSignatureError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema),
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
    <Card>
      <CardHeader>
        <CardTitle>{t('public:attendanceSheet')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Nom */}
          <div className="space-y-1">
            <Label htmlFor="lastName">{t('common:form.labels.lastName')} *</Label>
            <Input
              id="lastName"
              {...register('lastName')}
              className="min-h-[44px]"
            />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>

          {/* Prénom */}
          <div className="space-y-1">
            <Label htmlFor="firstName">{t('common:form.labels.firstName')} *</Label>
            <Input
              id="firstName"
              {...register('firstName')}
              className="min-h-[44px]"
            />
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">{t('common:form.labels.email')} *</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              {...register('email')}
              className="min-h-[44px]"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Ville */}
          <div className="space-y-1">
            <Label htmlFor="city">{t('common:form.labels.city')} *</Label>
            <Input
              id="city"
              {...register('city')}
              className="min-h-[44px]"
            />
            {errors.city && (
              <p className="text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          {/* Numéro d'inscription professionnelle */}
          <div className="space-y-1">
            <Label htmlFor="professionalNumber">{t('public:professionalNumber')}</Label>
            <Input
              id="professionalNumber"
              {...register('professionalNumber')}
              className="min-h-[44px]"
            />
            <p className="text-sm text-muted-foreground">
              {t('public:professionalNumberHelp')}
            </p>
            {errors.professionalNumber && (
              <p className="text-sm text-red-600">{errors.professionalNumber.message}</p>
            )}
          </div>

          {/* Type de bénéficiaire */}
          <div className="space-y-1">
            <Label htmlFor="beneficiaryType">{t('public:beneficiaryType')} *</Label>
            <Select
              onValueChange={(value) => setValue('beneficiaryType', value as ParticipantFormData['beneficiaryType'])}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder={t('public:selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asv">{t('common:beneficiaryTypes.asv')}</SelectItem>
                <SelectItem value="autre">{t('common:beneficiaryTypes.autre')}</SelectItem>
                <SelectItem value="eleveur">{t('common:beneficiaryTypes.eleveur')}</SelectItem>
                <SelectItem value="etudiant">{t('common:beneficiaryTypes.etudiant')}</SelectItem>
                <SelectItem value="pharmacien">{t('common:beneficiaryTypes.pharmacien')}</SelectItem>
                <SelectItem value="technicien">{t('common:beneficiaryTypes.technicien')}</SelectItem>
                <SelectItem value="veterinaire">{t('common:beneficiaryTypes.veterinaire')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.beneficiaryType && (
              <p className="text-sm text-red-600">{errors.beneficiaryType.message}</p>
            )}
          </div>

          {/* Préciser le type (conditional) */}
          {beneficiaryType === 'autre' && (
            <div className="space-y-1">
              <Label htmlFor="beneficiaryTypeOther">{t('public:specifyType')} *</Label>
              <Input
                id="beneficiaryTypeOther"
                {...register('beneficiaryTypeOther')}
                className="min-h-[44px]"
              />
              {errors.beneficiaryTypeOther && (
                <p className="text-sm text-red-600">{errors.beneficiaryTypeOther.message}</p>
              )}
            </div>
          )}

          {/* Signature */}
          <div className="space-y-1">
            <Label>{t('public:signature')} *</Label>
            <SignatureCanvas ref={signatureRef} />
            {signatureError && (
              <p className="text-sm text-red-600">{signatureError}</p>
            )}
          </div>

          {/* Droit à l'image */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="consentRightToImage"
              onCheckedChange={(checked) => setValue('consentRightToImage', checked === true)}
            />
            <Label htmlFor="consentRightToImage" className="leading-tight cursor-pointer">
              {t('public:consentRightToImage')}
            </Label>
          </div>
          {errors.consentRightToImage && (
            <p className="text-sm text-red-600">{errors.consentRightToImage.message}</p>
          )}

          {/* Global error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error.message}</p>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full min-h-[44px]"
            disabled={isPending}
          >
            {isPending ? t('public:submitting') : t('public:sign')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
