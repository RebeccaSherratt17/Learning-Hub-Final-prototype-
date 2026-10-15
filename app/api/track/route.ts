import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/db'
import type { ContentType } from '@/lib/generated/prisma'
import { ANALYTICS_EVENTS, recordEvent } from '@/lib/analytics/events'
import { getClientIp, isBot, visitorHash } from '@/lib/analytics/visitor'

// Public detail-page prefixes → content type
const CONTENT_ROUTES: Record<string, ContentType> = {
  courses: 'COURSE',
  templates: 'TEMPLATE',
  videos: 'VIDEO',
  'learning-paths': 'LEARNING_PATH',
}

// Paths that are never counted as public page views
const EXCLUDED_PREFIXES = ['/admin', '/api', '/play']

async function findContentIdBySlug(type: ContentType, slug: string): Promise<string | null> {
  const where = { slug }
  const select = { id: true }
  switch (type) {
    case 'COURSE':
      return (await prisma.course.findUnique({ where, select }))?.id ?? null
    case 'TEMPLATE':
      return (await prisma.template.findUnique({ where, select }))?.id ?? null
    case 'VIDEO':
      return (await prisma.video.findUnique({ where, select }))?.id ?? null
    case 'LEARNING_PATH':
      return (await prisma.learningPath.findUnique({ where, select }))?.id ?? null
  }
}

/**
 * POST /api/track — records anonymous page views and template downloads.
 * Always responds 204 so tracking failures are invisible to visitors.
 */
export async function POST(request: NextRequest) {
  const noContent = new NextResponse(null, { status: 204 })

  const userAgent = request.headers.get('user-agent')
  if (isBot(userAgent)) return noContent

  // Don't count admins browsing the site
  const adminToken = await getToken({ req: request }).catch(() => null)
  if (adminToken) return noContent

  let body: { event?: unknown; path?: unknown; contentId?: unknown }
  try {
    body = JSON.parse(await request.text())
  } catch {
    return noContent
  }

  const hash = visitorHash(getClientIp(request.headers), userAgent!)

  if (body.event === 'page_view' && typeof body.path === 'string') {
    const path = body.path.split('?')[0].split('#')[0]
    if (!path.startsWith('/') || path.length > 500) return noContent
    if (EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return noContent

    // Resolve content detail pages (/courses/[slug] etc.) to their item
    const [, section, slug, ...rest] = path.split('/')
    const contentType = CONTENT_ROUTES[section]
    let contentId: string | null = null
    if (contentType && slug && rest.length === 0) {
      contentId = await findContentIdBySlug(contentType, decodeURIComponent(slug))
    }

    await recordEvent({
      eventType: ANALYTICS_EVENTS.PAGE_VIEW,
      contentType: contentId ? contentType : null,
      contentId,
      metadata: { visitorHash: hash, path },
    })
    return noContent
  }

  if (body.event === 'template_download' && typeof body.contentId === 'string') {
    const template = await prisma.template.findUnique({
      where: { id: body.contentId },
      select: { id: true },
    })
    if (!template) return noContent

    await recordEvent({
      eventType: ANALYTICS_EVENTS.TEMPLATE_DOWNLOAD,
      contentType: 'TEMPLATE',
      contentId: template.id,
      metadata: { visitorHash: hash },
    })
  }

  return noContent
}
