import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'
import { organizerScoped } from '@/access/organizerScoped'
import { afterEventChange } from '@/hooks/events/afterChange'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'location', 'expenseType', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: () => true, // Public: signing page needs event title/date context
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
                { label: 'Frais d\'inscription evenement', value: 'event_registration' },
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
      ({ data, req, operation }) => {
        if (operation === 'create' && !data.createdBy && req.user) {
          data.createdBy = req.user.id
        }
        return data
      },
    ],
    afterChange: [afterEventChange],
  },
}
