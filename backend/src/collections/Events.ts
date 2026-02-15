import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'
import { organizerScoped, organizerScopedRead } from '@/access/organizerScoped'
import { afterEventChange } from '@/hooks/events/afterChange'
import { afterFinalize } from '@/hooks/events/afterFinalize'
import { afterEventRead } from '@/hooks/events/afterRead'
import { generateSigningToken } from '@/lib/security/tokens'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'location', 'expenseType', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: organizerScopedRead, // Public: open, Admin: all, Organizer: own events only
    update: organizerScoped,
    delete: organizerScoped,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Informations generales',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'location',
              type: 'text',
              required: true,
              label: 'Lieu',
            },
            {
              name: 'organizerName',
              type: 'text',
              required: true,
              label: "Nom de l'organisateur",
            },
            {
              name: 'organizerEmail',
              type: 'email',
              required: true,
              label: "Email de l'organisateur",
            },
            {
              name: 'status',
              type: 'select',
              required: true,
              defaultValue: 'draft',
              label: 'Statut',
              options: [
                { label: 'Brouillon', value: 'draft' },
                { label: 'Ouvert', value: 'open' },
                { label: 'Finalise', value: 'finalized' },
                { label: 'Rouvert', value: 'reopened' },
              ],
            },
            {
              name: 'signingToken',
              type: 'text',
              unique: true,
              index: true,
              label: 'Jeton de signature',
              admin: {
                readOnly: true,
                description:
                  'Jeton de signature unique pour les URLs publiques (genere automatiquement)',
              },
            },
            {
              name: 'theme',
              type: 'json',
              label: 'Theme',
              admin: {
                description: 'Theme configuration for public signing page',
              },
            },
            {
              name: 'qrGranularity',
              type: 'select',
              label: 'Granularite QR',
              defaultValue: 'day',
              options: [
                { label: 'Par evenement', value: 'event' },
                { label: 'Par journee', value: 'day' },
                { label: 'Par session', value: 'session' },
              ],
            },
          ],
        },
        {
          label: 'Classification',
          fields: [
            {
              name: 'expenseType',
              type: 'select',
              required: true,
              label: 'Type de depense',
              options: [
                { label: 'Hospitalite - Collation', value: 'hospitality_snack' },
                { label: 'Hospitalite - Restauration', value: 'hospitality_catering' },
                { label: 'Hospitalite - Hebergement', value: 'hospitality_accommodation' },
                { label: "Frais d'inscription evenement", value: 'event_registration' },
                { label: 'Frais de reunion/organisation', value: 'meeting_organization' },
                { label: 'Frais de transport', value: 'transport' },
              ],
            },
            {
              name: 'cnovDeclarationNumber',
              type: 'text',
              label: 'Numero de declaration CNOV',
            },
          ],
        },
        {
          label: 'Dates',
          fields: [
            {
              name: 'daySessionConfig',
              type: 'json',
              label: 'Configuration des sessions par jour',
              admin: {
                description:
                  'Configuration detaillee des sessions pour chaque journee (genere par le formulaire)',
              },
            },
            {
              name: 'selectedDates',
              type: 'array',
              required: true,
              minRows: 1,
              label: "Dates de l'evenement",
              fields: [
                {
                  name: 'date',
                  type: 'date',
                  required: true,
                  admin: {
                    date: {
                      pickerAppearance: 'dayOnly',
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Relations',
          fields: [
            {
              name: 'attendanceDays',
              type: 'relationship',
              relationTo: 'attendance-days',
              hasMany: true,
              admin: {
                readOnly: true,
                description: 'Genere automatiquement a partir des dates selectionnees',
              },
            },
            {
              name: 'participants',
              type: 'relationship',
              relationTo: 'participants',
              hasMany: true,
              label: 'Participants attendus',
              admin: {
                description: 'Participants pre-inscrits pour cet evenement',
              },
            },
            {
              name: 'createdBy',
              type: 'relationship',
              relationTo: 'users',
              required: true,
              admin: {
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      // Generate signing token on creation
      ({ data, operation }) => {
        if (operation === 'create' && !data.signingToken) {
          data.signingToken = generateSigningToken()
        }
        return data
      },
      // Validate status transitions
      async ({ data, req, operation, originalDoc }) => {
        // Only validate transitions on update when status is changing
        if (
          operation === 'update' &&
          data.status &&
          originalDoc?.status &&
          data.status !== originalDoc.status
        ) {
          const oldStatus = originalDoc.status
          const newStatus = data.status

          // Block: open cannot go back to draft
          if (oldStatus === 'open' && newStatus === 'draft') {
            throw new Error('Un evenement ouvert ne peut pas revenir en brouillon')
          }

          // Allow: finalized -> reopened (controlled reopen)
          if (oldStatus === 'finalized' && newStatus === 'reopened') {
            return data
          }

          // Block: finalized cannot go to anything except reopened
          if (oldStatus === 'finalized') {
            throw new Error('Un evenement finalise ne peut etre que rouvert')
          }

          // Allow: reopened -> finalized (re-finalization)
          if (oldStatus === 'reopened' && newStatus === 'finalized') {
            return data
          }

          // Block: reopened cannot go to draft
          if (oldStatus === 'reopened' && newStatus === 'draft') {
            throw new Error('Un evenement rouvert ne peut pas revenir en brouillon')
          }

          // Block: reopened cannot go to open (treat reopened as equivalent to open)
          if (oldStatus === 'reopened' && newStatus === 'open') {
            throw new Error('Un evenement rouvert est deja ouvert aux signatures')
          }
        }
        return data
      },
      // Set createdBy on creation
      ({ data, req, operation }) => {
        if (operation === 'create' && !data.createdBy && req.user) {
          data.createdBy = req.user.id
        }
        return data
      },
    ],
    afterChange: [afterEventChange, afterFinalize],
    afterRead: [afterEventRead],
  },
}
