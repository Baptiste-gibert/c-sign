import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const Sessions: CollectionConfig = {
  slug: 'sessions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'attendanceDay'],
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nom de la session',
    },
    {
      name: 'attendanceDay',
      type: 'relationship',
      relationTo: 'attendance-days',
      required: true,
    },
    {
      name: 'signatures',
      type: 'relationship',
      relationTo: 'signatures',
      hasMany: true,
      admin: {
        readOnly: true,
        description: 'Signatures pour cette session',
      },
    },
  ],
}
