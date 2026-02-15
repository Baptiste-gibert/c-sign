import type { CollectionConfig } from 'payload'
import type { CollectionBeforeChangeHook } from 'payload'
import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'

/**
 * Upload security hook for Media collection.
 * Validates file type by magic bytes, enforces size limit, and re-encodes through Sharp.
 * Defense against polyglot file attacks and malformed images.
 */
const validateAndSanitizeUpload: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  // Only run on create (file upload), not on alt text updates
  if (operation !== 'create' || !req.file) {
    return data
  }

  const file = req.file
  const buffer = file.data as Buffer

  // Magic byte validation - verify actual file type regardless of MIME claim
  const fileType = await fileTypeFromBuffer(buffer)
  if (!fileType || (fileType.mime !== 'image/png' && fileType.mime !== 'image/jpeg')) {
    throw new Error('Type de fichier non autorise. Seuls PNG et JPEG sont acceptes.')
  }

  // Size validation - enforce 2MB limit
  const MAX_SIZE = 2 * 1024 * 1024 // 2MB
  if (buffer.length > MAX_SIZE) {
    throw new Error('La taille du fichier ne doit pas depasser 2 Mo')
  }

  try {
    // Re-encode through Sharp to strip metadata and destroy polyglot payloads
    // Convert to PNG for consistent security processing
    const reEncoded = await sharp(buffer)
      .png({ compressionLevel: 9 })
      .toBuffer()

    // Replace original file data with sanitized version
    req.file.data = reEncoded
  } catch (error) {
    throw new Error('Fichier image invalide ou corrompu')
  }

  return data
}

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    mimeTypes: ['image/png', 'image/jpeg'], // Removed webp per security requirements
    imageSizes: [
      {
        name: 'thumbnail',
        width: 200,
        height: 100,
        fit: 'contain'
      }
    ]
  },
  access: {
    create: () => true, // Public: signature images uploaded by anonymous users
    read: () => true, // Public: images may need to be served
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin'
  },
  hooks: {
    beforeChange: [validateAndSanitizeUpload],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texte alternatif'
    }
  ]
}
