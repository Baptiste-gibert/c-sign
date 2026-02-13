import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'
import { isAdminOrSelf } from '../access/isAdminOrSelf'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'role']
  },
  access: {
    create: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
    admin: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'organizer'
    }
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'organizer',
      options: [
        {
          label: 'Admin',
          value: 'admin'
        },
        {
          label: 'Organisateur',
          value: 'organizer'
        }
      ]
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
      label: 'Prenom'
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      label: 'Nom'
    }
  ]
}
