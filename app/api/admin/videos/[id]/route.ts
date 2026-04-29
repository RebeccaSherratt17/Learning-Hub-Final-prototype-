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
    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        personas: { include: { persona: true } },
        regions: { include: { region: true } },
        subjects: { include: { subject: true } },
      },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json(video)
  } catch (error) {
    console.error('Failed to fetch video:', error)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
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
    if (!slug || slug.trim().length === 0) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const video = await prisma.$transaction(async (tx) => {
      // Snapshot current state for revision history
      const currentState = await tx.video.findUnique({ where: { id: params.id } })
      if (currentState) {
        await createRevision({
          contentType: 'VIDEO',
          contentId: params.id,
          data: currentState as unknown as Record<string, unknown>,
          changedBy: session.user?.email || null,
        }, tx)
      }

      const updated = await tx.video.update({
        where: { id: params.id },
        data: {
          title: title.trim(),
          slug: slug.trim(),
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
        },
      })

      // Re-sync taxonomy join tables
      await Promise.all([
        tx.videoPersona.deleteMany({ where: { videoId: params.id } }),
        tx.videoRegion.deleteMany({ where: { videoId: params.id } }),
        tx.videoSubject.deleteMany({ where: { videoId: params.id } }),
      ])

      if (personaIds?.length) {
        await tx.videoPersona.createMany({
          data: personaIds.map((personaId) => ({
            videoId: updated.id,
            personaId,
          })),
        })
      }

      if (regionIds?.length) {
        await tx.videoRegion.createMany({
          data: regionIds.map((regionId) => ({
            videoId: updated.id,
            regionId,
          })),
        })
      }

      if (subjectIds?.length) {
        await tx.videoSubject.createMany({
          data: subjectIds.map((subjectId) => ({
            videoId: updated.id,
            subjectId,
          })),
        })
      }

      return tx.video.findUnique({
        where: { id: updated.id },
        include: {
          personas: { include: { persona: true } },
          regions: { include: { region: true } },
          subjects: { include: { subject: true } },
        },
      })
    })

    return NextResponse.json(video)
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
    console.error('Failed to update video:', error)
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
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
      where: { contentType: 'VIDEO', contentId: params.id },
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
        message: `This video is referenced by ${affectedPaths.length} learning path(s).`,
      }, { status: 409 })
    }

    await prisma.video.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}
