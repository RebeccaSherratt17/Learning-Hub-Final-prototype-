import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { deleteFromBlob } from '@/lib/blob'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params
    const body = await request.json()
    const { name, imageUrl, imageAlt, linkUrl } = body as {
      name?: string
      imageUrl?: string
      imageAlt?: string | null
      linkUrl?: string | null
    }

    const data: Record<string, string | null> = {}
    if (name !== undefined) data.name = name.trim()
    if (imageUrl !== undefined) data.imageUrl = imageUrl.trim()
    if (imageAlt !== undefined) data.imageAlt = imageAlt?.trim() || null
    if (linkUrl !== undefined) data.linkUrl = linkUrl?.trim() || null

    const badge = await prisma.certificationBadge.update({
      where: { id },
      data,
    })

    return NextResponse.json(badge)
  } catch (error) {
    console.error('Failed to update badge:', error)
    return NextResponse.json(
      { error: 'Failed to update badge' },
      { status: 500 }
    )
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
    const { id } = params

    const badge = await prisma.certificationBadge.findUnique({
      where: { id },
    })

    if (!badge) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
      )
    }

    // Delete from database first
    await prisma.certificationBadge.delete({ where: { id } })

    // Clean up blob storage
    try {
      await deleteFromBlob(badge.imageUrl)
    } catch (blobError) {
      // Log but don't fail the request — the DB record is already deleted
      console.error('Failed to delete image from blob storage:', blobError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete badge:', error)
    return NextResponse.json(
      { error: 'Failed to delete badge' },
      { status: 500 }
    )
  }
}
