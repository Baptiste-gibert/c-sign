import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { isAdmin } from '@/access/isAdmin'
import { verifyTurnstileToken } from '@/lib/security/captcha'
import { checkRateLimit } from '@/lib/security/rateLimit'

/**
 * Server-side CAPTCHA verification for signature creation.
 * Verifies X-Captcha-Token header when present, and enforces CAPTCHA
 * requirement when rate limiting indicates the device should be challenged.
 */
const verifyCaptchaOnCreate: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create') return data

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

export const Signatures: CollectionConfig = {
  slug: 'signatures',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['participant', 'session', 'createdAt'],
  },
  access: {
    create: () => true, // Public signing flow uploads signatures
    read: ({ req: { user } }) => !!user, // Only authenticated users can view
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'participant',
      type: 'relationship',
      relationTo: 'participants',
      required: true,
    },
    {
      name: 'session',
      type: 'relationship',
      relationTo: 'sessions',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'rightToImage',
      type: 'checkbox',
      defaultValue: false,
      label: "Droit a l'image",
      admin: {
        description: "Autorise l'utilisation de photos prises lors de l'evenement",
      },
    },
  ],
  hooks: {
    beforeChange: [
      verifyCaptchaOnCreate,
      async ({ data, req, operation }) => {
        // Block signatures on finalized events
        if (operation === 'create' && data.session) {
          const session = await req.payload.findByID({
            collection: 'sessions',
            id: data.session,
            depth: 0,
            req,
          })
          if (session?.attendanceDay) {
            const day = await req.payload.findByID({
              collection: 'attendance-days',
              id:
                typeof session.attendanceDay === 'object'
                  ? session.attendanceDay.id
                  : session.attendanceDay,
              depth: 0,
              req,
            })
            if (day?.event) {
              const event = await req.payload.findByID({
                collection: 'events',
                id: typeof day.event === 'object' ? day.event.id : day.event,
                depth: 0,
                req,
              })
              if (event?.status === 'finalized') {
                throw new Error('Cet evenement est finalise, les signatures ne sont plus acceptees')
              }
              if (event?.status === 'draft') {
                throw new Error("Cet evenement n'est pas encore ouvert aux signatures")
              }
            }
          }
        }

        // Enforce uniqueness: one signature per participant per session
        if (operation === 'create' && data.participant && data.session) {
          const existing = await req.payload.find({
            collection: 'signatures',
            where: {
              and: [
                { participant: { equals: data.participant } },
                { session: { equals: data.session } },
              ],
            },
            limit: 1,
            req,
          })

          if (existing.docs.length > 0) {
            throw new Error("Un participant ne peut signer qu'une seule fois par session")
          }
        }

        return data
      },
    ],
  },
}
