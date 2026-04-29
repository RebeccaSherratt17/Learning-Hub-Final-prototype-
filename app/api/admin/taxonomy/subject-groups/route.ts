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
    const groups = await prisma.subjectGroup.findMany({
      include: { subjects: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(groups)
  } catch (error) {
    console.error('Failed to fetch subject groups:', error)
    return NextResponse.json({ error: 'Failed to fetch subject groups' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const finalSlug = slug?.trim() || generateSlug(name)

    const group = await prisma.subjectGroup.create({
      data: { name: name.trim(), slug: finalSlug },
      include: { subjects: true },
    })

    return NextResponse.json(group, { status: 201 })
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
    console.error('Failed to create subject group:', error)
    return NextResponse.json({ error: 'Failed to create subject group' }, { status: 500 })
  }
}
