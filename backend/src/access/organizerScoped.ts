import type { Access } from 'payload'

export const organizerScoped: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') return true
  if (user) return { createdBy: { equals: user.id } }
  return false
}
