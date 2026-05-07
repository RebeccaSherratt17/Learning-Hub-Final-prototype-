import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createRevision } from '@/lib/revisions'
import type { ContentStatus } from '@/lib/generated/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        personas: { include: { persona: true } },
        regions: { include: { region: true } },
        subjects: { include: { subject: true } },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Failed to fetch course:', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
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
      scormCourseId,
      thumbnailUrl,
      thumbnailAlt,
      ogImageUrl,
      accessTier,
      author,
      publishedAt,
      scheduledPublishAt,
      estimatedDuration,
      status,
      restricted,
      restrictedNote,
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
      scormCourseId?: string
      thumbnailUrl?: string
      thumbnailAlt?: string
      ogImageUrl?: string
      accessTier?: string
      author?: string
      publishedAt?: string
      scheduledPublishAt?: string
      estimatedDuration?: string
      status?: string
      restricted?: boolean
      restrictedNote?: string
      seoTitle?: string
      seoDescription?: string
      sku?: string
      credlyBadgeId?: string
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
    if (!slug || slug.trim().length === 0) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const { relatedItems } = body as { relatedItems?: { type: string; id: string }[] }

    const course = await prisma.$transaction(async (tx) => {
      // Snapshot current state for revision history
      const currentState = await tx.course.findUnique({ where: { id: params.id } })
      if (currentState) {
        await createRevision({
          contentType: 'COURSE',
          contentId: params.id,
          data: currentState as unknown as Record<string, unknown>,
          changedBy: session.user?.email || null,
        }, tx)
      }

      const updated = await tx.course.update({
        where: { id: params.id },
        data: {
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim(),
          scormCourseId: scormCourseId?.trim() || null,
          thumbnailUrl: thumbnailUrl || null,
          thumbnailAlt: thumbnailAlt || null,
          ogImageUrl: ogImageUrl || null,
          accessTier: (accessTier as 'FREE' | 'GATED' | 'PREMIUM') || 'FREE',
          author: author?.trim() || null,
          publishedAt: publishedAt ? new Date(publishedAt) : null,
          scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : null,
          estimatedDuration: estimatedDuration?.trim() || null,
          status: (status as ContentStatus) || 'DRAFT',
          restricted: restricted ?? false,
          restrictedNote: restrictedNote?.trim() || null,
          seoTitle: seoTitle?.trim() || null,
          seoDescription: seoDescription?.trim() || null,
          sku: sku?.trim() || null,
          credlyBadgeId: credlyBadgeId?.trim() || null,
        },
      })

      // Re-sync taxonomy join tables
      await Promise.all([
        tx.coursePersona.deleteMany({ where: { courseId: params.id } }),
        tx.courseRegion.deleteMany({ where: { courseId: params.id } }),
        tx.courseSubject.deleteMany({ where: { courseId: params.id } }),
      ])

      if (personaIds?.length) {
        await tx.coursePersona.createMany({
          data: personaIds.map((personaId) => ({
            courseId: updated.id,
            personaId,
          })),
        })
      }

      if (regionIds?.length) {
        await tx.courseRegion.createMany({
          data: regionIds.map((regionId) => ({
            courseId: updated.id,
            regionId,
          })),
        })
      }

      if (subjectIds?.length) {
        await tx.courseSubject.createMany({
          data: subjectIds.map((subjectId) => ({
            courseId: updated.id,
            subjectId,
          })),
        })
      }

      // Re-sync related items
      await tx.relatedItem.deleteMany({
        where: { sourceType: 'COURSE', sourceId: params.id },
      })

      if (relatedItems?.length) {
        await tx.relatedItem.createMany({
          data: relatedItems.slice(0, 3).map((item) => ({
            sourceType: 'COURSE' as const,
            sourceId: updated.id,
            targetType: item.type as 'COURSE' | 'TEMPLATE' | 'VIDEO' | 'LEARNING_PATH',
            targetId: item.id,
          })),
        })
      }

      return tx.course.findUnique({
        where: { id: updated.id },
        include: {
          personas: { include: { persona: true } },
          regions: { include: { region: true } },
          subjects: { include: { subject: true } },
        },
      })
    })

    return NextResponse.json(course)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'A course with this slug already exists' },
        { status: 409 }
      )
    }
    console.error('Failed to update course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
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

    const learningPathItems = await prisma.learningPathItem.findMany({
      where: { contentType: 'COURSE', contentId: params.id },
      include: { learningPath: { select: { id: true, title: true } } },
    })

    if (learningPathItems.length > 0 && !confirm) {
      const affectedPaths = learningPathItems.map((item) => ({
        id: item.learningPath.id,
        title: item.learningPath.title,
      }))
      return NextResponse.json({
        requiresConfirmation: true,
        affectedLearningPaths: affectedPaths,
        message: `This course is referenced by ${affectedPaths.length} learning path(s).`,
      }, { status: 409 })
    }

    await prisma.course.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete course:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}
