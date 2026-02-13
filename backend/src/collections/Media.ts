import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
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
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texte alternatif'
    }
  ]
}
