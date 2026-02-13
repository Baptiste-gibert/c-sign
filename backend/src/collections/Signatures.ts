import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

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
              id: typeof session.attendanceDay === 'object' ? session.attendanceDay.id : session.attendanceDay,
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
                throw new Error('Cet evenement n\'est pas encore ouvert aux signatures')
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
