import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'participants',
      where: {
        or: [
          { lastName: { contains: q } },
          { firstName: { contains: q } },
          { professionalNumber: { contains: q } },
        ],
      },
      limit: 20,
      sort: 'lastName',
    })

    const results = result.docs.map((doc) => ({
      id: String(doc.id),
      lastName: doc.lastName,
      firstName: doc.firstName,
      email: doc.email,
      city: doc.city,
      professionalNumber: doc.professionalNumber || '',
      beneficiaryType: doc.beneficiaryType,
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('SIMV search error:', error)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
