import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ContentStatus } from '@/lib/generated/prisma'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') as ContentStatus | null
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '20', 10)))

    const where: Record<string, unknown> = {}
    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }
    if (status) {
      where.status = status
    }

    const [learningPaths, total] = await Promise.all([
      prisma.learningPath.findMany({
        where,
        include: {
          personas: { include: { persona: true } },
          regions: { include: { region: true } },
          subjects: { include: { subject: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.learningPath.count({ where }),
    ])

    return NextResponse.json({
      learningPaths,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Failed to fetch learning paths:', error)
    return NextResponse.json({ error: 'Failed to fetch learning paths' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      title,
      slug,
      description,
      estimatedCompletionTime,
      credlyBadgeId,
      thumbnailUrl,
      thumbnailAlt,
      ogImageUrl,
      accessTier,
      publishedAt,
      scheduledPublishAt,
      status,
      seoTitle,
      seoDescription,
      sku,
      personaIds,
      regionIds,
      subjectIds,
      items,
    } = body as {
      title?: string
      slug?: string
      description?: string
      estimatedCompletionTime?: string
      credlyBadgeId?: string
      thumbnailUrl?: string
      thumbnailAlt?: string
      ogImageUrl?: string
      accessTier?: string
      publishedAt?: string
      scheduledPublishAt?: string
      status?: string
      seoTitle?: string
      seoDescription?: string
      sku?: string
      personaIds?: string[]
      regionIds?: string[]
      subjectIds?: string[]
      items?: { contentType?: string; contentId?: string; milestoneTitle?: string; isElective?: boolean }[]
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    const finalSlug = slug?.trim() || generateSlug(title)

    const learningPath = await prisma.$transaction(async (tx) => {
      const created = await tx.learningPath.create({
        data: {
          title: title.trim(),
          slug: finalSlug,
          description: description.trim(),
          estimatedCompletionTime: estimatedCompletionTime?.trim() || null,
          credlyBadgeId: credlyBadgeId?.trim() || null,
          thumbnailUrl: thumbnailUrl || null,
          thumbnailAlt: thumbnailAlt || null,
          ogImageUrl: ogImageUrl || null,
          accessTier: (accessTier as 'FREE' | 'GATED' | 'PREMIUM') || 'FREE',
          publishedAt: publishedAt ? new Date(publishedAt) : null,
          scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : null,
          status: (status as ContentStatus) || 'DRAFT',
          seoTitle: seoTitle?.trim() || null,
          seoDescription: seoDescription?.trim() || null,
          sku: sku?.trim() || null,
        },
      })

      if (personaIds?.length) {
        await tx.learningPathPersona.createMany({
          data: personaIds.map((personaId) => ({
            learningPathId: created.id,
            personaId,
          })),
        })
      }

      if (regionIds?.length) {
        await tx.learningPathRegion.createMany({
          data: regionIds.map((regionId) => ({
            learningPathId: created.id,
            regionId,
          })),
        })
      }

      if (subjectIds?.length) {
        await tx.learningPathSubject.createMany({
          data: subjectIds.map((subjectId) => ({
            learningPathId: created.id,
            subjectId,
          })),
        })
      }

      if (items?.length) {
        await tx.learningPathItem.createMany({
          data: items.map((item, index) => ({
            learningPathId: created.id,
            contentType: item.milestoneTitle
              ? null
              : (item.contentType as 'COURSE' | 'TEMPLATE' | 'VIDEO' | 'LEARNING_PATH'),
            contentId: item.milestoneTitle ? null : (item.contentId ?? null),
            milestoneTitle: item.milestoneTitle ?? null,
            isElective: item.isElective ?? false,
            order: index,
          })),
        })
      }

      return tx.learningPath.findUnique({
        where: { id: created.id },
        include: {
          personas: { include: { persona: true } },
          regions: { include: { region: true } },
          subjects: { include: { subject: true } },
          items: { orderBy: { order: 'asc' } },
        },
      })
    })

    return NextResponse.json(learningPath, { status: 201 })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'A learning path with this slug already exists' },
        { status: 409 }
      )
    }
    console.error('Failed to create learning path:', error)
    return NextResponse.json({ error: 'Failed to create learning path' }, { status: 500 })
  }
}
