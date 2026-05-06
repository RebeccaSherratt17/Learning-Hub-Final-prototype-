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

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: {
          personas: { include: { persona: true } },
          regions: { include: { region: true } },
          subjects: { include: { subject: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.video.count({ where }),
    ])

    return NextResponse.json({
      videos,
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
      accessTier,
      publishedAt,
      scheduledPublishAt,
      status,
      seoTitle,
      seoDescription,
      sku,
      credlyBadgeId,
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
      accessTier?: string
      publishedAt?: string
      scheduledPublishAt?: string
      status?: string
      seoTitle?: string
      seoDescription?: string
      sku?: string
      credlyBadgeId?: string
      personaIds?: string[]
      regionIds?: string[]
      subjectIds?: string[]
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    const finalSlug = slug?.trim() || generateSlug(title)

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
          accessTier: (accessTier as 'FREE' | 'GATED' | 'PREMIUM') || 'FREE',
          publishedAt: publishedAt ? new Date(publishedAt) : null,
          scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : null,
          status: (status as ContentStatus) || 'DRAFT',
          seoTitle: seoTitle?.trim() || null,
          seoDescription: seoDescription?.trim() || null,
          sku: sku?.trim() || null,
          credlyBadgeId: credlyBadgeId?.trim() || null,
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

      return tx.video.findUnique({
        where: { id: created.id },
        include: {
          personas: { include: { persona: true } },
          regions: { include: { region: true } },
          subjects: { include: { subject: true } },
        },
      })
    })

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
