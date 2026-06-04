import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { validateVideoPublish } from '@/lib/admin/metadataHealth'
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

    const tier = url.searchParams.get('tier') || ''
    const restricted = url.searchParams.get('restricted') || ''
    const author = url.searchParams.get('author') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }
    if (status) {
      where.status = status
    }
    if (tier) {
      where.accessTier = tier
    }
    if (restricted === 'true') {
      where.restricted = true
    } else if (restricted === 'false') {
      where.restricted = false
    }
    if (author) {
      where.authorId = author
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: {
          author: true,
          personas: { include: { persona: true } },
          regions: { include: { region: true } },
          subjects: { include: { subject: { include: { group: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.video.count({ where }),
    ])

    const videoIds = videos.map((v) => v.id)
    const relatedCounts = videoIds.length > 0
      ? await prisma.relatedItem.groupBy({
          by: ['sourceId'],
          where: { sourceType: 'VIDEO', sourceId: { in: videoIds } },
          _count: { id: true },
        })
      : []
    const relatedMap = new Map(relatedCounts.map((r) => [r.sourceId, r._count.id]))
    const videosWithHealth = videos.map((v) => ({
      ...v,
      relatedItemCount: relatedMap.get(v.id) ?? 0,
    }))

    return NextResponse.json({
      videos: videosWithHealth,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Failed to fetch videos:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
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
      vidyardUrl,
      duration,
      thumbnailUrl,
      thumbnailAlt,
      ogImageUrl,
      ogImageAlt,
      accessTier,
      publishedAt,
      scheduledPublishAt,
      status,
      restricted,
      restrictedNote,
      seoTitle,
      seoDescription,
      sku,
      authorId,
      credlyBadgeId,
      level,
      personaIds,
      regionIds,
      subjectIds,
    } = body as {
      title?: string
      slug?: string
      description?: string
      vidyardUrl?: string
      duration?: string
      thumbnailUrl?: string
      thumbnailAlt?: string
      ogImageUrl?: string
      ogImageAlt?: string
      accessTier?: string
      publishedAt?: string
      scheduledPublishAt?: string
      status?: string
      restricted?: boolean
      restrictedNote?: string
      seoTitle?: string
      seoDescription?: string
      sku?: string
      authorId?: string
      credlyBadgeId?: string
      level?: string
      personaIds?: string[]
      regionIds?: string[]
      subjectIds?: string[]
      relatedItems?: { type: string; id: string }[]
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    if (status === 'PUBLISHED') {
      const orgTypeGroup = await prisma.subjectGroup.findUnique({ where: { slug: 'organization-type' } })
      const orgTypeIds = orgTypeGroup
        ? (await prisma.subject.findMany({ where: { groupId: orgTypeGroup.id }, select: { id: true } })).map((s) => s.id)
        : []
      const hasOrgType = (subjectIds as string[] | undefined)?.some((id: string) => orgTypeIds.includes(id)) ?? false

      const missing = validateVideoPublish({
        title: title.trim(),
        slug: slug?.trim() || generateSlug(title),
        description: description.trim(),
        vidyardUrl: vidyardUrl?.trim() || null,
        duration: duration?.trim() || null,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        ogImageUrl: ogImageUrl?.trim() || null,
        level: level || null,
        hasOrgType,
      })
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Required to publish: ${missing.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const finalSlug = slug?.trim() || generateSlug(title)

    const { relatedItems } = body as { relatedItems?: { type: string; id: string }[] }

    const video = await prisma.$transaction(async (tx) => {
      const created = await tx.video.create({
        data: {
          title: title.trim(),
          slug: finalSlug,
          description: description.trim(),
          vidyardUrl: vidyardUrl?.trim() || null,
          duration: duration?.trim() || null,
          thumbnailUrl: thumbnailUrl || null,
          thumbnailAlt: thumbnailAlt || null,
          ogImageUrl: ogImageUrl || null,
          ogImageAlt: ogImageAlt || null,
          accessTier: (accessTier as 'FREE' | 'GATED' | 'PREMIUM') || 'FREE',
          publishedAt: publishedAt ? new Date(publishedAt) : null,
          scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : null,
          status: (status as ContentStatus) || 'DRAFT',
          restricted: restricted ?? false,
          restrictedNote: restrictedNote?.trim() || null,
          seoTitle: seoTitle?.trim() || null,
          seoDescription: seoDescription?.trim() || null,
          sku: sku?.trim() || null,
          authorId: authorId?.trim() || null,
          credlyBadgeId: credlyBadgeId?.trim() || null,
          level: (level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') || null,
        },
      })

      if (personaIds?.length) {
        await tx.videoPersona.createMany({
          data: personaIds.map((personaId) => ({
            videoId: created.id,
            personaId,
          })),
        })
      }

      if (regionIds?.length) {
        await tx.videoRegion.createMany({
          data: regionIds.map((regionId) => ({
            videoId: created.id,
            regionId,
          })),
        })
      }

      if (subjectIds?.length) {
        await tx.videoSubject.createMany({
          data: subjectIds.map((subjectId) => ({
            videoId: created.id,
            subjectId,
          })),
        })
      }

      if (relatedItems?.length) {
        await tx.relatedItem.createMany({
          data: relatedItems.slice(0, 3).map((item) => ({
            sourceType: 'VIDEO' as const,
            sourceId: created.id,
            targetType: item.type as 'COURSE' | 'TEMPLATE' | 'VIDEO' | 'LEARNING_PATH',
            targetId: item.id,
          })),
        })
      }

      return tx.video.findUnique({
        where: { id: created.id },
        include: {
          personas: { include: { persona: true } },
          regions: { include: { region: true } },
          subjects: { include: { subject: true } },
        },
      })
    })

    revalidatePath('/')
    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'A video with this slug already exists' },
        { status: 409 }
      )
    }
    console.error('Failed to create video:', error)
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 })
  }
}
