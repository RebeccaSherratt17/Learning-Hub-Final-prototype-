import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const settings = await prisma.hubSettings.findUnique({
      where: { id: 'hub_settings_singleton' },
    })
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as Record<string, unknown>

    // Only allow known HubSettings fields
    const allowedFields = [
      'heroHeading',
      'heroSubheading',
      'heroOverview',
      'popularSectionHeading',
      'partnersSectionHeading',
      'librarySectionHeading',
      'questionsSectionHeading',
      'questionsSectionBody',
      'certificationsSectionHeading',
      'certificationsSectionBody',
      'footerHeading',
      'footerBody',
      'footerCTAText',
      'demoCTAUrl',
    ] as const

    const data: Record<string, string | null> = {}
    for (const field of allowedFields) {
      if (field in body) {
        const value = body[field]
        data[field] = typeof value === 'string' && value.trim() !== '' ? value.trim() : null
      }
    }

    const updated = await prisma.hubSettings.update({
      where: { id: 'hub_settings_singleton' },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
