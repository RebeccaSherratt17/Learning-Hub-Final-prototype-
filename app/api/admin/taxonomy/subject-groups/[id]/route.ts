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
    const { name, slug } = body as { name?: string; slug?: string }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!slug || slug.trim().length === 0) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const group = await prisma.subjectGroup.update({
      where: { id: params.id },
      data: { name: name.trim(), slug: slug.trim() },
      include: { subjects: { orderBy: { name: 'asc' } } },
    })

    return NextResponse.json(group)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'A subject group with this name or slug already exists' },
        { status: 409 }
      )
    }
    console.error('Failed to update subject group:', error)
    return NextResponse.json({ error: 'Failed to update subject group' }, { status: 500 })
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

    const subjectCount = await prisma.subject.count({
      where: { groupId: params.id },
    })

    if (subjectCount > 0 && !confirm) {
      return NextResponse.json({ subjectCount, requiresConfirmation: true })
    }

    await prisma.subjectGroup.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete subject group:', error)
    return NextResponse.json({ error: 'Failed to delete subject group' }, { status: 500 })
  }
}
