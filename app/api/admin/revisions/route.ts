import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ContentType } from '@/lib/generated/prisma'

const VALID_CONTENT_TYPES: ContentType[] = ['COURSE', 'TEMPLATE', 'VIDEO', 'LEARNING_PATH']

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const contentType = url.searchParams.get('contentType') as ContentType | null
  const contentId = url.searchParams.get('contentId')

  if (!contentType || !VALID_CONTENT_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: 'Valid contentType is required (COURSE, TEMPLATE, VIDEO, LEARNING_PATH)' },
      { status: 400 }
    )
  }

  if (!contentId) {
    return NextResponse.json(
      { error: 'contentId is required' },
      { status: 400 }
    )
  }

  try {
    const revisions = await prisma.contentRevision.findMany({
      where: { contentType, contentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        changedBy: true,
        createdAt: true,
        data: true,
      },
    })

    return NextResponse.json({ revisions })
  } catch (error) {
    console.error('Failed to fetch revisions:', error)
    return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 })
  }
}
