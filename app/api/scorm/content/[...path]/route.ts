import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * SCORM content proxy — serves course files from Vercel Blob with correct
 * headers so they render in an iframe instead of triggering a download.
 *
 * Path format: /api/scorm/content/{courseId}/{...filePath}
 * Maps to Blob: {blobBaseUrl}/courses/{courseId}/{...filePath}
 */

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.xsd': 'application/xml',
  '.dtd': 'application/xml-dtd',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.swf': 'application/x-shockwave-flash',
}

function getMimeType(filePath: string): string {
  const ext = filePath.match(/\.[^.]+$/)?.[0]?.toLowerCase() || ''
  return MIME_TYPES[ext] || 'application/octet-stream'
}

// Cache the Blob store base URL to avoid a DB lookup on every asset request.
// Derived once from the first course that has a launchFile.
let cachedBlobBaseUrl: string | null = null

async function getBlobBaseUrl(): Promise<string | null> {
  if (cachedBlobBaseUrl) return cachedBlobBaseUrl

  const course = await prisma.course.findFirst({
    where: { launchFile: { not: null } },
    select: { launchFile: true },
  })

  if (!course?.launchFile) return null

  const match = course.launchFile.match(/^(https:\/\/[^/]+)/)
  if (!match) return null

  cachedBlobBaseUrl = match[1]
  return cachedBlobBaseUrl
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path
  if (!segments || segments.length < 2) {
    return new NextResponse('Not found', { status: 404 })
  }

  const blobBase = await getBlobBaseUrl()
  if (!blobBase) {
    return new NextResponse('No SCORM content configured', { status: 404 })
  }

  // Reconstruct the Blob URL: {blobBase}/courses/{courseId}/{rest...}
  const filePath = segments.join('/')
  const blobUrl = `${blobBase}/courses/${filePath}`

  try {
    const response = await fetch(blobUrl)
    if (!response.ok) {
      return new NextResponse(null, { status: response.status })
    }

    const body = await response.arrayBuffer()
    const contentType = getMimeType(filePath)

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600, immutable',
      },
    })
  } catch {
    return new NextResponse('Failed to fetch content', { status: 502 })
  }
}
