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
    const template = await prisma.template.findUnique({
      where: { id: params.id },
      include: {
        personas: { include: { persona: true } },
        regions: { include: { region: true } },
        subjects: { include: { subject: true } },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Failed to fetch template:', error)
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
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
      fileUrl,
      fileName,
      fileType,
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
      fileUrl?: string
      fileName?: string
      fileType?: string
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

    const template = await prisma.$transaction(async (tx) => {
      // Snapshot current state for revision history
      const currentState = await tx.template.findUnique({ where: { id: params.id } })
      if (currentState) {
        await createRevision({
          contentType: 'TEMPLATE',
          contentId: params.id,
          data: currentState as unknown as Record<string, unknown>,
          changedBy: session.user?.email || null,
        }, tx)
      }

      const updated = await tx.template.update({
        where: { id: params.id },
        data: {
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim(),
          fileUrl: fileUrl || null,
          fileName: fileName?.trim() || null,
          fileType: fileType?.trim() || null,
          thumbnailUrl: thumbnailUrl || null,
          thumbnailAlt: thumbnailAlt || null,
          ogImageUrl: ogImageUrl || null,
          accessTier: (accessTier as 'FREE' | 'GATED' | 'PREMIUM') || 'GATED',
          publishedAt: publishedAt ? new Date(publishedAt) : null,
          scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : null,
          status: (status as ContentStatus) || 'DRAFT',
          seoTitle: seoTitle?.trim() || null,
          seoDescription: seoDescription?.trim() || null,
        },
      })

      // Re-sync taxonomy join tables
      await Promise.all([
        tx.templatePersona.deleteMany({ where: { templateId: params.id } }),
        tx.templateRegion.deleteMany({ where: { templateId: params.id } }),
        tx.templateSubject.deleteMany({ where: { templateId: params.id } }),
      ])

      if (personaIds?.length) {
        await tx.templatePersona.createMany({
          data: personaIds.map((personaId) => ({
            templateId: updated.id,
            personaId,
          })),
        })
      }

      if (regionIds?.length) {
        await tx.templateRegion.createMany({
          data: regionIds.map((regionId) => ({
            templateId: updated.id,
            regionId,
          })),
        })
      }

      if (subjectIds?.length) {
        await tx.templateSubject.createMany({
          data: subjectIds.map((subjectId) => ({
            templateId: updated.id,
            subjectId,
          })),
        })
      }

      return tx.template.findUnique({
        where: { id: updated.id },
        include: {
          personas: { include: { persona: true } },
          regions: { include: { region: true } },
          subjects: { include: { subject: true } },
        },
      })
    })

    return NextResponse.json(template)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'A template with this slug already exists' },
        { status: 409 }
      )
    }
    console.error('Failed to update template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
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
      where: { contentType: 'TEMPLATE', contentId: params.id },
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
        message: `This template is referenced by ${affectedPaths.length} learning path(s).`,
      }, { status: 409 })
    }

    await prisma.template.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
