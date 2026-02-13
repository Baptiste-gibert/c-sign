// Bypass Payload's loadEnv issue with tsx by importing config directly
import { getPayload } from 'payload'
import { seed } from './index'

const run = async () => {
  console.log('🚀 Starting seed runner...')

  // Dynamically import config to avoid Payload's loadEnv running at module level
  const configModule = await import('../payload.config.js')
  const config = configModule.default

  console.log('Initializing Payload...')
  const payload = await getPayload({ config })

  console.log('Running seed function...')
  await seed(payload)

  console.log('✅ Seed complete!')
  process.exit(0)
}

run().catch((err) => {
  console.error('❌ Seed failed:', err)
  console.error('Stack:', err.stack)
  process.exit(1)
})
