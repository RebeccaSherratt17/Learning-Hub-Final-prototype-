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
    const { sourcePath, destinationPath } = body as {
      sourcePath?: string
      destinationPath?: string
    }

    const data: Record<string, string> = {}

    if (sourcePath !== undefined) {
      const trimmed = sourcePath.trim()
      if (!trimmed) {
        return NextResponse.json({ error: 'Source path is required' }, { status: 400 })
      }
      if (!trimmed.startsWith('/')) {
        return NextResponse.json(
          { error: 'Source path must start with /' },
          { status: 400 }
        )
      }
      data.sourcePath = trimmed
    }

    if (destinationPath !== undefined) {
      const trimmed = destinationPath.trim()
      if (!trimmed) {
        return NextResponse.json({ error: 'Destination path is required' }, { status: 400 })
      }
      if (!trimmed.startsWith('/') && !trimmed.startsWith('http')) {
        return NextResponse.json(
          { error: 'Destination path must start with / or http' },
          { status: 400 }
        )
      }
      data.destinationPath = trimmed
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const redirect = await prisma.redirect.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(redirect)
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
    console.error('Failed to update redirect:', error)
    return NextResponse.json({ error: 'Failed to update redirect' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.redirect.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete redirect:', error)
    return NextResponse.json({ error: 'Failed to delete redirect' }, { status: 500 })
  }
}
