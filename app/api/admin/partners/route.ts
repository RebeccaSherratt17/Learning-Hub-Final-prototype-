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
    const partners = await prisma.educationalPartner.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(partners)
  } catch (error) {
    console.error('Failed to fetch partners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, logoUrl, logoAlt, linkUrl } = body as {
      name?: string
      logoUrl?: string
      logoAlt?: string
      linkUrl?: string
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!logoUrl || logoUrl.trim().length === 0) {
      return NextResponse.json(
        { error: 'Logo image is required' },
        { status: 400 }
      )
    }

    // Set order to max existing + 1
    const maxOrder = await prisma.educationalPartner.aggregate({
      _max: { order: true },
    })
    const nextOrder = (maxOrder._max.order ?? -1) + 1

    const partner = await prisma.educationalPartner.create({
      data: {
        name: name.trim(),
        logoUrl: logoUrl.trim(),
        logoAlt: logoAlt?.trim() || null,
        linkUrl: linkUrl?.trim() || null,
        order: nextOrder,
      },
    })

    return NextResponse.json(partner, { status: 201 })
  } catch (error) {
    console.error('Failed to create partner:', error)
    return NextResponse.json(
      { error: 'Failed to create partner' },
      { status: 500 }
    )
  }
}
