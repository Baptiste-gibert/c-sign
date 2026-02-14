import { z } from 'zod'
import i18n from '@/i18n'

export function createParticipantSchema() {
  return z.object({
    lastName: z.string().min(1, i18n.t('common:validation.lastNameRequired')),
    firstName: z.string().min(1, i18n.t('common:validation.firstNameRequired')),
    email: z.string().email(i18n.t('common:validation.emailInvalid')),
    city: z.string().min(1, i18n.t('common:validation.cityRequired')),
    professionalNumber: z.string().optional(),
    beneficiaryType: z.enum(
      ['asv', 'autre', 'eleveur', 'etudiant', 'pharmacien', 'technicien', 'veterinaire'],
      { required_error: i18n.t('common:validation.beneficiaryTypeRequired') }
    ),
    beneficiaryTypeOther: z.string().optional(),
    consentRightToImage: z.boolean().default(false),
  }).refine(
    (data) => data.beneficiaryType !== 'autre' || (data.beneficiaryTypeOther && data.beneficiaryTypeOther.length > 0),
    { message: i18n.t('common:validation.beneficiaryTypeOtherRequired'), path: ['beneficiaryTypeOther'] }
  )
}

export type ParticipantFormData = z.infer<ReturnType<typeof createParticipantSchema>>

export function createEventSchema() {
  return z.object({
    title: z.string().min(1, i18n.t('organizer:validation.titleRequired')).max(200, i18n.t('organizer:validation.titleTooLong')),
    location: z.string().min(1, i18n.t('organizer:validation.locationRequired')),
    organizerName: z.string().min(1, i18n.t('organizer:validation.organizerNameRequired')),
    organizerEmail: z.string().email(i18n.t('common:validation.emailInvalid')),
    expenseType: z.enum([
      'hospitality_snack',
      'hospitality_catering',
      'hospitality_accommodation',
      'event_registration',
      'meeting_organization',
      'transport',
    ], { required_error: i18n.t('organizer:validation.expenseTypeRequired') }),
    cnovDeclarationNumber: z.string().optional(),
    theme: z.object({
      themeId: z.string().optional(),
      customAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    }).nullable().optional(),
    selectedDates: z.array(
      z.object({ date: z.string() })
    ).min(1, i18n.t('organizer:validation.atLeastOneDateRequired')),
  })
}

export type EventFormData = z.infer<ReturnType<typeof createEventSchema>>
