import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const authors = await prisma.author.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(authors)
  } catch (error) {
    console.error('Failed to fetch authors:', error)
    return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name } = body as { name?: string }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const existing = await prisma.author.findUnique({ where: { name: name.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'An author with this name already exists' }, { status: 409 })
    }

    const author = await prisma.author.create({
      data: { name: name.trim() },
    })

    return NextResponse.json(author, { status: 201 })
  } catch (error) {
    console.error('Failed to create author:', error)
    return NextResponse.json({ error: 'Failed to create author' }, { status: 500 })
  }
}
