import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
    const { name, slug, groupId } = body as {
      name?: string
      slug?: string
      groupId?: string
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!slug || slug.trim().length === 0) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const data: { name: string; slug: string; groupId?: string } = {
      name: name.trim(),
      slug: slug.trim(),
    }

    if (groupId) {
      const group = await prisma.subjectGroup.findUnique({ where: { id: groupId } })
      if (!group) {
        return NextResponse.json({ error: 'Subject group not found' }, { status: 400 })
      }
      data.groupId = groupId
    }

    const subject = await prisma.subject.update({
      where: { id: params.id },
      data,
      include: { group: true },
    })

    return NextResponse.json(subject)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'A subject with this name or slug already exists' },
        { status: 409 }
      )
    }
    console.error('Failed to update subject:', error)
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
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

    const [courseCount, templateCount, videoCount, learningPathCount] =
      await Promise.all([
        prisma.courseSubject.count({ where: { subjectId: params.id } }),
        prisma.templateSubject.count({ where: { subjectId: params.id } }),
        prisma.videoSubject.count({ where: { subjectId: params.id } }),
        prisma.learningPathSubject.count({ where: { subjectId: params.id } }),
      ])

    const usageCount = courseCount + templateCount + videoCount + learningPathCount

    if (usageCount > 0 && !confirm) {
      return NextResponse.json({ usageCount, requiresConfirmation: true })
    }

    await prisma.subject.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete subject:', error)
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
  }
}
