import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const AttendanceDays: CollectionConfig = {
  slug: 'attendance-days',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['event', 'date'],
  },
  access: {
    create: () => false, // Only system hooks can create
    read: () => true, // Public: signing page loads day info
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
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
    {
      name: 'sessions',
      type: 'relationship',
      relationTo: 'sessions',
      hasMany: true,
      admin: {
        description: 'Sessions pour cette journee',
      },
    },
  ],
}
