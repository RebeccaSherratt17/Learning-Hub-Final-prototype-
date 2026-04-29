import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.trim()

    const redirects = await prisma.redirect.findMany({
      where: search
        ? {
            OR: [
              { sourcePath: { contains: search, mode: 'insensitive' } },
              { destinationPath: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(redirects)
  } catch (error) {
    console.error('Failed to fetch redirects:', error)
    return NextResponse.json({ error: 'Failed to fetch redirects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { sourcePath, destinationPath } = body as {
      sourcePath?: string
      destinationPath?: string
    }

    if (!sourcePath || !sourcePath.trim()) {
      return NextResponse.json({ error: 'Source path is required' }, { status: 400 })
    }

    if (!destinationPath || !destinationPath.trim()) {
      return NextResponse.json({ error: 'Destination path is required' }, { status: 400 })
    }

    const trimmedSource = sourcePath.trim()
    const trimmedDest = destinationPath.trim()

    if (!trimmedSource.startsWith('/')) {
      return NextResponse.json(
        { error: 'Source path must start with /' },
        { status: 400 }
      )
    }

    if (!trimmedDest.startsWith('/') && !trimmedDest.startsWith('http')) {
      return NextResponse.json(
        { error: 'Destination path must start with / or http' },
        { status: 400 }
      )
    }

    const redirect = await prisma.redirect.create({
      data: {
        sourcePath: trimmedSource,
        destinationPath: trimmedDest,
      },
    })

    return NextResponse.json(redirect, { status: 201 })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'A redirect with this source path already exists' },
        { status: 409 }
      )
    }
    console.error('Failed to create redirect:', error)
    return NextResponse.json({ error: 'Failed to create redirect' }, { status: 500 })
  }
}
