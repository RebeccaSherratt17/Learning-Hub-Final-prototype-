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
    const { name, logoUrl, logoAlt, linkUrl } = body as {
      name?: string
      logoUrl?: string
      logoAlt?: string | null
      linkUrl?: string | null
    }

    const data: Record<string, string | null> = {}
    if (name !== undefined) data.name = name.trim()
    if (logoUrl !== undefined) data.logoUrl = logoUrl.trim()
    if (logoAlt !== undefined) data.logoAlt = logoAlt?.trim() || null
    if (linkUrl !== undefined) data.linkUrl = linkUrl?.trim() || null

    const partner = await prisma.educationalPartner.update({
      where: { id },
      data,
    })

    return NextResponse.json(partner)
  } catch (error) {
    console.error('Failed to update partner:', error)
    return NextResponse.json(
      { error: 'Failed to update partner' },
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

    const partner = await prisma.educationalPartner.findUnique({
      where: { id },
    })

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Delete from database first
    await prisma.educationalPartner.delete({ where: { id } })

    // Clean up blob storage
    try {
      await deleteFromBlob(partner.logoUrl)
    } catch (blobError) {
      // Log but don't fail the request — the DB record is already deleted
      console.error('Failed to delete logo from blob storage:', blobError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete partner:', error)
    return NextResponse.json(
      { error: 'Failed to delete partner' },
      { status: 500 }
    )
  }
}
