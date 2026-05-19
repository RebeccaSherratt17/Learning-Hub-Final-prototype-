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
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
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

    // HTML, JS, CSS and other assets that render in the iframe need inline
    // disposition. Downloadable files (PDF, DOCX, XLSX, etc.) need attachment
    // so the browser triggers a download when a learner clicks a link.
    const inlineTypes = new Set([
      'text/html', 'application/javascript', 'text/css', 'application/json',
      'application/xml', 'application/xml-dtd', 'image/png', 'image/jpeg',
      'image/gif', 'image/svg+xml', 'image/x-icon', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'video/mp4', 'video/webm',
      'font/woff', 'font/woff2', 'font/ttf', 'application/vnd.ms-fontobject',
      'application/x-shockwave-flash',
    ])
    const disposition = inlineTypes.has(contentType)
      ? 'inline'
      : `attachment; filename="${segments[segments.length - 1]}"`

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': 'public, max-age=3600, immutable',
      },
    })
  } catch {
    return new NextResponse('Failed to fetch content', { status: 502 })
  }
}
