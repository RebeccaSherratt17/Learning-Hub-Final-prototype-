import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createRevision } from '@/lib/revisions'
import type { ContentStatus, ContentType } from '@/lib/generated/prisma'

async function resolveItemTitles(
  items: { id: string; contentType: ContentType | null; contentId: string | null; order: number; milestoneTitle: string | null }[]
) {
  // Separate content items from milestones
  const contentItems = items.filter((item) => item.milestoneTitle === null && item.contentType !== null)

  const grouped: Record<string, string[]> = {
    COURSE: [],
    TEMPLATE: [],
    VIDEO: [],
    LEARNING_PATH: [],
  }

  for (const item of contentItems) {
    if (item.contentType && item.contentId) {
      grouped[item.contentType].push(item.contentId)
    }
  }

  const [courses, templates, videos, learningPaths] = await Promise.all([
    grouped.COURSE.length
      ? prisma.course.findMany({
          where: { id: { in: grouped.COURSE } },
          select: { id: true, title: true },
        })
      : [],
    grouped.TEMPLATE.length
      ? prisma.template.findMany({
          where: { id: { in: grouped.TEMPLATE } },
          select: { id: true, title: true },
        })
      : [],
    grouped.VIDEO.length
      ? prisma.video.findMany({
          where: { id: { in: grouped.VIDEO } },
          select: { id: true, title: true },
        })
      : [],
    grouped.LEARNING_PATH.length
      ? prisma.learningPath.findMany({
          where: { id: { in: grouped.LEARNING_PATH } },
          select: { id: true, title: true },
        })
      : [],
  ])

  const titleMap = new Map<string, string>()
  for (const item of [...courses, ...templates, ...videos, ...learningPaths]) {
    titleMap.set(item.id, item.title)
  }

  return items.map((item) => ({
    id: item.id,
    contentType: item.contentType,
    contentId: item.contentId,
    order: item.order,
    milestoneTitle: item.milestoneTitle,
    title: item.milestoneTitle ?? (item.contentId ? titleMap.get(item.contentId) ?? '(Deleted content)' : '(Unknown)'),
  }))
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const learningPath = await prisma.learningPath.findUnique({
      where: { id: params.id },
      include: {
        personas: { include: { persona: true } },
        regions: { include: { region: true } },
        subjects: { include: { subject: true } },
        items: { orderBy: { order: 'asc' } },
      },
    })

    if (!learningPath) {
      return NextResponse.json({ error: 'Learning path not found' }, { status: 404 })
    }

    const itemsWithTitles = await resolveItemTitles(learningPath.items)

    return NextResponse.json({
      ...learningPath,
      items: itemsWithTitles,
    })
  } catch (error) {
    console.error('Failed to fetch learning path:', error)
    return NextResponse.json({ error: 'Failed to fetch learning path' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      personaIds?: string[]
      regionIds?: string[]
      subjectIds?: string[]
      items?: { contentType?: string; contentId?: string; milestoneTitle?: string }[]
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }
    if (!slug || slug.trim().length === 0) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const learningPath = await prisma.$transaction(async (tx) => {
      // Snapshot current state for revision history
      const currentState = await tx.learningPath.findUnique({
        where: { id: params.id },
        include: { items: { orderBy: { order: 'asc' } } },
      })
      if (currentState) {
        await createRevision({
          contentType: 'LEARNING_PATH',
          contentId: params.id,
          data: currentState as unknown as Record<string, unknown>,
          changedBy: session.user?.email || null,
        }, tx)
      }

      const updated = await tx.learningPath.update({
        where: { id: params.id },
        data: {
          title: title.trim(),
          slug: slug.trim(),
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
        },
      })

      // Re-sync taxonomy join tables
      await Promise.all([
        tx.learningPathPersona.deleteMany({ where: { learningPathId: params.id } }),
        tx.learningPathRegion.deleteMany({ where: { learningPathId: params.id } }),
        tx.learningPathSubject.deleteMany({ where: { learningPathId: params.id } }),
      ])

      if (personaIds?.length) {
        await tx.learningPathPersona.createMany({
          data: personaIds.map((personaId) => ({
            learningPathId: updated.id,
            personaId,
          })),
        })
      }

      if (regionIds?.length) {
        await tx.learningPathRegion.createMany({
          data: regionIds.map((regionId) => ({
            learningPathId: updated.id,
            regionId,
          })),
        })
      }

      if (subjectIds?.length) {
        await tx.learningPathSubject.createMany({
          data: subjectIds.map((subjectId) => ({
            learningPathId: updated.id,
            subjectId,
          })),
        })
      }

      // Re-sync items: delete all then recreate
      await tx.learningPathItem.deleteMany({ where: { learningPathId: params.id } })

      if (items?.length) {
        await tx.learningPathItem.createMany({
          data: items.map((item, index) => ({
            learningPathId: updated.id,
            contentType: item.milestoneTitle
              ? null
              : (item.contentType as 'COURSE' | 'TEMPLATE' | 'VIDEO' | 'LEARNING_PATH'),
            contentId: item.milestoneTitle ? null : (item.contentId ?? null),
            milestoneTitle: item.milestoneTitle ?? null,
            order: index,
          })),
        })
      }

      return tx.learningPath.findUnique({
        where: { id: updated.id },
        include: {
          personas: { include: { persona: true } },
          regions: { include: { region: true } },
          subjects: { include: { subject: true } },
          items: { orderBy: { order: 'asc' } },
        },
      })
    })

    return NextResponse.json(learningPath)
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
    console.error('Failed to update learning path:', error)
    return NextResponse.json({ error: 'Failed to update learning path' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const confirm = url.searchParams.get('confirm') === 'true'

    const progressCount = await prisma.learnerProgress.count({
      where: { learningPathId: params.id },
    })

    if (progressCount > 0 && !confirm) {
      return NextResponse.json({
        requiresConfirmation: true,
        progressCount,
        message: `This learning path has ${progressCount} learner progress record(s). Deleting it will remove all learner progress data.`,
      }, { status: 409 })
    }

    await prisma.learningPath.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete learning path:', error)
    return NextResponse.json({ error: 'Failed to delete learning path' }, { status: 500 })
  }
}
