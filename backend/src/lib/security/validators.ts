import { z } from 'zod'
import type { CollectionBeforeChangeHook } from 'payload'
import type { User } from '../../payload-types'

/**
 * Password security requirements:
 * - Minimum 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 */
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/(?=.*[a-z])/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/(?=.*[A-Z])/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/(?=.*\d)/, 'Le mot de passe doit contenir au moins un chiffre')

/**
 * Payload beforeChange hook that validates password strength
 * on user creation and password updates.
 */
export const validatePassword: CollectionBeforeChangeHook<User> = async ({ data, operation }) => {
  // Cast to access password field (not exposed in generated types but exists at runtime)
  const userData = data as typeof data & { password?: string }

  // Only validate password when it's being set (create) or changed (update)
  if (operation === 'create' || (operation === 'update' && userData.password)) {
    if (!userData.password) {
      // Password is required on create
      if (operation === 'create') {
        throw new Error('Le mot de passe est requis')
      }
      return data
    }

    const result = passwordSchema.safeParse(userData.password)

    if (!result.success) {
      const errors = result.error.errors.map((err) => err.message).join(', ')
      throw new Error(errors)
    }
  }

  return data
}
