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
    const badges = await prisma.certificationBadge.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(badges)
  } catch (error) {
    console.error('Failed to fetch badges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
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
    const { name, imageUrl, imageAlt, linkUrl } = body as {
      name?: string
      imageUrl?: string
      imageAlt?: string
      linkUrl?: string
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!imageUrl || imageUrl.trim().length === 0) {
      return NextResponse.json(
        { error: 'Badge image is required' },
        { status: 400 }
      )
    }

    // Set order to max existing + 1
    const maxOrder = await prisma.certificationBadge.aggregate({
      _max: { order: true },
    })
    const nextOrder = (maxOrder._max.order ?? -1) + 1

    const badge = await prisma.certificationBadge.create({
      data: {
        name: name.trim(),
        imageUrl: imageUrl.trim(),
        imageAlt: imageAlt?.trim() || null,
        linkUrl: linkUrl?.trim() || null,
        order: nextOrder,
      },
    })

    return NextResponse.json(badge, { status: 201 })
  } catch (error) {
    console.error('Failed to create badge:', error)
    return NextResponse.json(
      { error: 'Failed to create badge' },
      { status: 500 }
    )
  }
}
