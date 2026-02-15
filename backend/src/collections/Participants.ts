import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { sanitizeParticipantInput } from '@/lib/security/sanitize'
import { verifyTurnstileToken } from '@/lib/security/captcha'
import { checkRateLimit } from '@/lib/security/rateLimit'

/**
 * Server-side CAPTCHA verification for participant creation.
 * Skips verification for authenticated users (organizers/admins via dashboard).
 * For public requests: verifies X-Captcha-Token header when present, and enforces
 * CAPTCHA requirement when rate limiting indicates the device should be challenged.
 */
const verifyCaptchaOnCreate: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create') return data

  // Authenticated users (organizers/admins) bypass CAPTCHA
  if (req.user) return data

  const captchaToken = req.headers.get('x-captcha-token')

  // If a CAPTCHA token is provided, it MUST be valid
  if (captchaToken) {
    const isValid = await verifyTurnstileToken(captchaToken)
    if (!isValid) {
      throw new Error('Verification CAPTCHA echouee. Veuillez reessayer.')
    }
    return data
  }

  // No CAPTCHA token — check if this device should have been challenged
  const fingerprint = req.headers.get('x-device-fingerprint')
  if (fingerprint) {
    const rateResult = checkRateLimit(fingerprint)
    if (!rateResult.allowed) {
      throw new Error('Trop de soumissions. Veuillez reessayer plus tard.')
    }
    if (rateResult.shouldChallenge) {
      throw new Error('Verification CAPTCHA requise. Veuillez completer le CAPTCHA.')
    }
  }

  return data
}

export const Participants: CollectionConfig = {
  slug: 'participants',
  admin: {
    useAsTitle: 'lastName',
    defaultColumns: ['lastName', 'firstName', 'email', 'beneficiaryType'],
  },
  access: {
    create: () => true, // Public form creates participants
    read: () => true, // Public: needed for duplicate checking
    update: ({ req: { user } }) => !!user, // Only authenticated users
    delete: ({ req: { user } }) => !!user, // Only authenticated users
  },
  hooks: {
    beforeChange: [verifyCaptchaOnCreate, sanitizeParticipantInput],
  },
  fields: [
    {
      name: 'lastName',
      type: 'text',
      required: true,
      label: 'Nom',
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
      label: 'Prenom',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      // NOT unique - same person can attend multiple events
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      label: 'Ville',
    },
    {
      name: 'professionalNumber',
      type: 'text',
      label: "Numero d'inscription professionnelle",
      admin: {
        description: 'Si applicable (veterinaires, pharmaciens)',
      },
    },
    {
      name: 'beneficiaryType',
      type: 'select',
      required: true,
      label: 'Type de beneficiaire',
      options: [
        { label: 'ASV', value: 'asv' },
        { label: 'Autre', value: 'autre' },
        { label: 'Eleveur', value: 'eleveur' },
        { label: 'Etudiant', value: 'etudiant' },
        { label: 'Pharmacien', value: 'pharmacien' },
        { label: 'Technicien', value: 'technicien' },
        { label: 'Veterinaire', value: 'veterinaire' },
      ],
    },
    {
      name: 'beneficiaryTypeOther',
      type: 'text',
      label: 'Preciser le type',
      admin: {
        condition: (data) => data?.beneficiaryType === 'autre',
        description: 'Requis lorsque "Autre" est selectionne',
      },
    },
  ],
}
