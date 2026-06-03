import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { put, del } from '@vercel/blob'
import { extractScormPackage } from '@/lib/scorm/extract'
import { parseManifest } from '@/lib/scorm/manifest'

// Allow up to 60s for large SCORM extraction
export const maxDuration = 60

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth check
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  // Verify course exists
  const course = await prisma.course.findUnique({ where: { id } })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const body = await request.json()
  const { blobUrl } = body as { blobUrl?: string }

  if (!blobUrl || typeof blobUrl !== 'string') {
    return NextResponse.json({ error: 'blobUrl is required' }, { status: 400 })
  }

  try {
    // Download the zip from Vercel Blob
    const zipResponse = await fetch(blobUrl)
    if (!zipResponse.ok) {
      return NextResponse.json({ error: 'Failed to download SCORM package from storage' }, { status: 400 })
    }

    const arrayBuffer = await zipResponse.arrayBuffer()
    const zipBuffer = Buffer.from(arrayBuffer)

    // Extract with security protections
    const extractedFiles = await extractScormPackage(zipBuffer)

    // Find and parse the manifest
    const manifestFile = extractedFiles.find(
      (f) => f.path.toLowerCase() === 'imsmanifest.xml'
    )
    if (!manifestFile) {
      return NextResponse.json(
        { error: 'No imsmanifest.xml found in package' },
        { status: 400 }
      )
    }

    const manifestXml = manifestFile.content.toString('utf-8')
    const { version, launchFile } = parseManifest(manifestXml)

    // Upload all extracted files to Vercel Blob under courses/{courseId}/
    const blobFolder = `courses/${id}`
    let launchFileUrl = ''

    for (const extracted of extractedFiles) {
      const blobPath = `${blobFolder}/${extracted.path}`
      const blob = await put(blobPath, extracted.content, { access: 'public' })

      // Capture the launch file's Blob URL
      if (extracted.path === launchFile) {
        launchFileUrl = blob.url
      }
    }

    if (!launchFileUrl) {
      return NextResponse.json(
        { error: `Launch file "${launchFile}" not found in extracted package` },
        { status: 400 }
      )
    }

    // Clean up the temporary zip blob
    try {
      await del(blobUrl)
    } catch {
      // Non-critical — the temp blob will be cleaned up eventually
    }

    // Update the course record
    await prisma.course.update({
      where: { id },
      data: {
        launchFile: launchFileUrl,
        scormVersion: version,
      },
    })

    return NextResponse.json({
      success: true,
      launchFile: launchFileUrl,
      scormVersion: version,
      fileCount: extractedFiles.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process SCORM package'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
