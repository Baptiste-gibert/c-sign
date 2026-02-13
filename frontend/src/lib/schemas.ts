import { z } from 'zod'

export const participantSchema = z.object({
  lastName: z.string().min(1, 'Le nom est requis'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide'),
  city: z.string().min(1, 'La ville est requise'),
  professionalNumber: z.string().optional(),
  beneficiaryType: z.enum(
    ['asv', 'autre', 'eleveur', 'etudiant', 'pharmacien', 'technicien', 'veterinaire'],
    { required_error: 'Le type de bénéficiaire est requis' }
  ),
  beneficiaryTypeOther: z.string().optional(),
  consentRightToImage: z.boolean().default(false),
}).refine(
  (data) => data.beneficiaryType !== 'autre' || (data.beneficiaryTypeOther && data.beneficiaryTypeOther.length > 0),
  { message: 'Veuillez préciser le type de bénéficiaire', path: ['beneficiaryTypeOther'] }
)

export type ParticipantFormData = z.infer<typeof participantSchema>

export const eventSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200, "Le titre est trop long"),
  location: z.string().min(1, "Le lieu est requis"),
  organizerName: z.string().min(1, "Le nom de l'organisateur est requis"),
  organizerEmail: z.string().email("Email invalide"),
  expenseType: z.enum([
    'hospitality_snack',
    'hospitality_catering',
    'hospitality_accommodation',
    'event_registration',
    'meeting_organization',
    'transport',
  ], { required_error: "Le type de depense est requis" }),
  selectedDates: z.array(
    z.object({ date: z.string() })
  ).min(1, "Au moins une date est requise"),
})

export type EventFormData = z.infer<typeof eventSchema>
