import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const Signatures: CollectionConfig = {
  slug: 'signatures',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['participant', 'session', 'createdAt'],
  },
  access: {
    // Phase 2 public signing flow will create these
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => !!user,
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
      async ({ data, req, operation }) => {
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
            throw new Error(
              'Un participant ne peut signer qu\'une seule fois par session'
            )
          }
        }

        return data
      },
    ],
  },
}
