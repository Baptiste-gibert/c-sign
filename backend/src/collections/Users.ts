import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'
import { isAdminOrSelf } from '../access/isAdminOrSelf'
import { validatePassword } from '../lib/security/validators'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 86400, // 24 hours in seconds
    maxLoginAttempts: 5,
    lockTime: 365 * 24 * 60 * 60 * 1000, // ~1 year in ms = effectively indefinite (admin-only unlock)
    cookies: {
      secure: process.env.NODE_ENV === 'production', // HTTPS-only in prod, allow HTTP in dev
      sameSite: 'Strict',
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'role']
  },
  hooks: {
    beforeChange: [validatePassword],
  },
  access: {
    create: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
    admin: ({ req: { user } }) => {
      return user?.role === 'admin'
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
