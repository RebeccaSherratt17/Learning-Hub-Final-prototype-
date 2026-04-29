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
    const personas = await prisma.persona.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(personas)
  } catch (error) {
    console.error('Failed to fetch personas:', error)
    return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 })
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

    const persona = await prisma.persona.create({
      data: { name: name.trim(), slug: finalSlug },
    })

    return NextResponse.json(persona, { status: 201 })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'A persona with this name or slug already exists' },
        { status: 409 }
      )
    }
    console.error('Failed to create persona:', error)
    return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 })
  }
}
