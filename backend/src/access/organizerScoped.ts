import type { Access } from 'payload'

export const organizerScoped: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') return true
  if (user) return { createdBy: { equals: user.id } }
  return false
}

/**
 * Read access for events:
 * - Public (no user): allow all (signing page needs event data)
 * - Admin: allow all
 * - Organizer: only their own events
 */
export const organizerScopedRead: Access = ({ req: { user } }) => {
  if (!user) return true
  if (user.role === 'admin') return true
  return { createdBy: { equals: user.id } }
}
