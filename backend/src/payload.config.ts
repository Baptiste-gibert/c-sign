import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Events } from './collections/Events'
import { AttendanceDays } from './collections/AttendanceDays'
import { Sessions } from './collections/Sessions'
import { Participants } from './collections/Participants'
import { Signatures } from './collections/Signatures'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname)
    }
  },
  collections: [Users, Events, AttendanceDays, Sessions, Participants, Signatures, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts')
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || ''
    }
  }),
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_EMAIL || 'noreply@ceva.com',
    defaultFromName: 'c-sign - Ceva Sante Animale',
    transportOptions: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    },
  })
})
