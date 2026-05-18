import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

const PREVIEW_TOKEN_TTL_MINUTES = 30

/** Content type → public route prefix */
const routePrefix: Record<string, string> = {
  COURSE: '/courses',
  TEMPLATE: '/templates',
  VIDEO: '/videos',
  LEARNING_PATH: '/learning-paths',
}

/**
 * POST /api/admin/preview
 * Generates a short-lived preview token for any content type.
 * Body: { contentType: string, contentId: string }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { contentType: string; contentId: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { contentType, contentId } = body

  if (!contentType || !contentId) {
    return NextResponse.json({ error: 'contentType and contentId are required' }, { status: 400 })
  }

  if (!routePrefix[contentType]) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  // Look up the slug for the content item
  const slug = await getContentSlug(contentType, contentId)
  if (!slug) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  try {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + PREVIEW_TOKEN_TTL_MINUTES * 60 * 1000)

    await prisma.previewToken.create({
      data: {
        token,
        contentType: contentType as any,
        contentId,
        expiresAt,
      },
    })

    const previewUrl = `${routePrefix[contentType]}/${slug}?preview=${token}`

    return NextResponse.json({ token, url: previewUrl, expiresAt: expiresAt.toISOString() })
  } catch (error) {
    console.error('Failed to generate preview token:', error)
    return NextResponse.json({ error: 'Failed to generate preview token' }, { status: 500 })
  }
}

async function getContentSlug(contentType: string, contentId: string): Promise<string | null> {
  switch (contentType) {
    case 'COURSE': {
      const c = await prisma.course.findUnique({ where: { id: contentId }, select: { slug: true } })
      return c?.slug ?? null
    }
    case 'TEMPLATE': {
      const t = await prisma.template.findUnique({ where: { id: contentId }, select: { slug: true } })
      return t?.slug ?? null
    }
    case 'VIDEO': {
      const v = await prisma.video.findUnique({ where: { id: contentId }, select: { slug: true } })
      return v?.slug ?? null
    }
    case 'LEARNING_PATH': {
      const lp = await prisma.learningPath.findUnique({ where: { id: contentId }, select: { slug: true } })
      return lp?.slug ?? null
    }
    default:
      return null
  }
}
