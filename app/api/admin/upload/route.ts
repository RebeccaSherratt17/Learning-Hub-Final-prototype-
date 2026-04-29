import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadToBlob, deleteFromBlob } from '@/lib/blob'

const ALLOWED_FOLDERS = [
  'thumbnails',
  'templates',
  'partners',
  'badges',
  'og-images',
] as const

type AllowedFolder = (typeof ALLOWED_FOLDERS)[number]

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
])

const DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const IMAGE_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const DOCUMENT_MAX_SIZE = 50 * 1024 * 1024 // 50MB

function isAllowedFolder(folder: string): folder is AllowedFolder {
  return ALLOWED_FOLDERS.includes(folder as AllowedFolder)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Invalid form data' },
      { status: 400 }
    )
  }

  const file = formData.get('file')
  const folder = formData.get('folder')
  const altText = formData.get('altText')

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: 'No file provided or file is empty' },
      { status: 400 }
    )
  }

  if (typeof folder !== 'string' || !isAllowedFolder(folder)) {
    return NextResponse.json(
      { error: `Invalid folder. Must be one of: ${ALLOWED_FOLDERS.join(', ')}` },
      { status: 400 }
    )
  }

  const isImage = IMAGE_TYPES.has(file.type)
  const isDocument = DOCUMENT_TYPES.has(file.type)

  if (!isImage && !isDocument) {
    return NextResponse.json(
      { error: 'Unsupported file type' },
      { status: 400 }
    )
  }

  const maxSize = isImage ? IMAGE_MAX_SIZE : DOCUMENT_MAX_SIZE
  if (file.size > maxSize) {
    const limitMB = maxSize / (1024 * 1024)
    return NextResponse.json(
      { error: `File too large. Maximum size is ${limitMB}MB` },
      { status: 400 }
    )
  }

  try {
    const { url, size } = await uploadToBlob(file, folder)

    const asset = await prisma.mediaAsset.create({
      data: {
        url,
        fileName: file.name,
        mimeType: file.type,
        size,
        altText: typeof altText === 'string' ? altText : null,
      },
    })

    return NextResponse.json({
      url: asset.url,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      size: asset.size,
      assetId: asset.id,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Upload failed'
    console.error('Upload failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const { url } = body
  if (!url || typeof url !== 'string') {
    return NextResponse.json(
      { error: 'URL is required' },
      { status: 400 }
    )
  }

  try {
    await deleteFromBlob(url)
    await prisma.mediaAsset.deleteMany({ where: { url } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete failed:', error)
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    )
  }
}
