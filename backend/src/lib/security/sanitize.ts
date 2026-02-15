import DOMPurify from 'isomorphic-dompurify'
import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Strips ALL HTML tags from input string while preserving text content.
 * Defense against stored XSS via participant text inputs.
 *
 * @param input - String that may contain HTML tags
 * @returns Sanitized string with HTML tags removed
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Payload beforeChange hook that sanitizes all participant text fields.
 * Applied to Participants collection to prevent stored XSS attacks.
 *
 * Sanitizes: firstName, lastName, city, professionalNumber, beneficiaryTypeOther
 */
export const sanitizeParticipantInput: CollectionBeforeChangeHook = ({ data }) => {
  const fieldsToSanitize = [
    'firstName',
    'lastName',
    'city',
    'professionalNumber',
    'beneficiaryTypeOther',
  ] as const

  fieldsToSanitize.forEach((field) => {
    if (typeof data[field] === 'string') {
      data[field] = sanitizeText(data[field])
    }
  })

  return data
}
