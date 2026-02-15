import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const Sessions: CollectionConfig = {
  slug: 'sessions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'attendanceDay'],
  },
  access: {
    create: ({ req: { user } }) => !!user, // Keep: only organizers create sessions
    read: () => true, // Public: signing page lists sessions
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
      name: 'startTime',
      type: 'text',
      label: 'Heure de debut',
    },
    {
      name: 'endTime',
      type: 'text',
      label: 'Heure de fin',
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
