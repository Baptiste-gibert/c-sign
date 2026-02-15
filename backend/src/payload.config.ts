import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { AttendanceDays } from './collections/AttendanceDays'
import { Events } from './collections/Events'
import { Media } from './collections/Media'
import { Participants } from './collections/Participants'
import { Sessions } from './collections/Sessions'
import { Signatures } from './collections/Signatures'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Events, AttendanceDays, Sessions, Participants, Signatures, Media],
  editor: lexicalEditor(),
  graphQL: {
    disable: process.env.NODE_ENV === 'production',
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  plugins: [
    ...(process.env.BLOB_READ_WRITE_TOKEN
      ? [
          vercelBlobStorage({
            collections: { media: true },
            token: process.env.BLOB_READ_WRITE_TOKEN,
          }),
        ]
      : []),
  ],
  sharp,
  db: postgresAdapter({
    push: true,
    pool: {
      connectionString:
        process.env.DATABASE_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL || '',
    },
  }),
  ...(process.env.SMTP_HOST
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: process.env.SMTP_FROM_EMAIL || 'noreply@ceva.com',
          defaultFromName: 'c-sign - Ceva Sante Animale',
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: process.env.SMTP_USER
              ? {
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASS,
                }
              : undefined,
          },
        }),
      }
    : {}),
})
// test comment
