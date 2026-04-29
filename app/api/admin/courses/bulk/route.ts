import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { AccessTier, ContentStatus } from '@/lib/generated/prisma'

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { ids, action, accessTier } = body as {
      ids?: string[]
      action?: string
      accessTier?: AccessTier
    }

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'No course IDs provided' }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'archive':
        updateData = { status: 'ARCHIVED' as ContentStatus }
        break
      case 'publish':
        updateData = { status: 'PUBLISHED' as ContentStatus, publishedAt: new Date() }
        break
      case 'draft':
        updateData = { status: 'DRAFT' as ContentStatus }
        break
      case 'changeTier':
        if (!accessTier) {
          return NextResponse.json({ error: 'Access tier is required for tier change' }, { status: 400 })
        }
        updateData = { accessTier }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const result = await prisma.course.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    })

    return NextResponse.json({ updated: result.count })
  } catch (error) {
    console.error('Failed to bulk update courses:', error)
    return NextResponse.json({ error: 'Failed to bulk update courses' }, { status: 500 })
  }
}
