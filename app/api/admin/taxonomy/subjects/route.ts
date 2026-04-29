import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const subjects = await prisma.subject.findMany({
      include: { group: true },
      orderBy: [{ group: { name: 'asc' } }, { name: 'asc' }],
    })
    return NextResponse.json(subjects)
  } catch (error) {
    console.error('Failed to fetch subjects:', error)
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    if (!groupId) {
      return NextResponse.json({ error: 'Group is required' }, { status: 400 })
    }

    const group = await prisma.subjectGroup.findUnique({ where: { id: groupId } })
    if (!group) {
      return NextResponse.json({ error: 'Subject group not found' }, { status: 400 })
    }

    const finalSlug = slug?.trim() || generateSlug(name)

    const subject = await prisma.subject.create({
      data: { name: name.trim(), slug: finalSlug, groupId },
      include: { group: true },
    })

    return NextResponse.json(subject, { status: 201 })
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
    console.error('Failed to create subject:', error)
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 })
  }
}
