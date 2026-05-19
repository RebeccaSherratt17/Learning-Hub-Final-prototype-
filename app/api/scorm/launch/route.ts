import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateLaunchToken } from '@/lib/scorm/token'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, firstName, email, lastName } = body

    if (!courseId || !firstName || !email) {
      return NextResponse.json(
        { error: 'courseId, firstName and email are required' },
        { status: 400 }
      )
    }

    // Fetch the course to get the launch file URL
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, launchFile: true, scormVersion: true, status: true },
    })

    if (!course || !course.launchFile) {
      return NextResponse.json(
        { error: 'Course not found or no SCORM package uploaded' },
        { status: 404 }
      )
    }

    // Create an Attempt record with a temporary unique placeholder token
    // (launchToken has a unique constraint, so we cannot use an empty string)
    const tempToken = `temp_${randomUUID()}`
    const attempt = await prisma.attempt.create({
      data: {
        courseId: course.id,
        learnerEmail: email,
        learnerFirstName: firstName,
        learnerLastName: lastName || null,
        launchToken: tempToken,
        status: 'IN_PROGRESS',
      },
    })

    // Generate the real HMAC-SHA256 launch token from attempt + course IDs
    const launchToken = generateLaunchToken(attempt.id, course.id)

    // Update the attempt with the real token
    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { launchToken },
    })

    // Convert the Blob URL to a proxy URL so the iframe loads through
    // /api/scorm/content/ with correct headers (inline disposition, no restrictive CSP).
    // Blob URL: https://{store}.public.blob.vercel-storage.com/courses/{courseId}/{path}
    // Proxy URL: /api/scorm/content/{courseId}/{path}
    const launchUrl = blobUrlToProxyUrl(course.launchFile)

    return NextResponse.json({
      attemptId: attempt.id,
      launchToken,
      launchUrl,
      scormVersion: course.scormVersion,
    })
  } catch (error) {
    console.error('SCORM launch error:', error)
    return NextResponse.json(
      { error: 'Failed to create SCORM launch session' },
      { status: 500 }
    )
  }
}

/**
 * Convert a Vercel Blob URL to a proxy URL that serves through /api/scorm/content/.
 * Input:  https://{store}.public.blob.vercel-storage.com/courses/{courseId}/{path}
 * Output: /api/scorm/content/{courseId}/{path}
 */
function blobUrlToProxyUrl(blobUrl: string): string {
  const match = blobUrl.match(/\/courses\/(.+)$/)
  if (!match) return blobUrl
  return `/api/scorm/content/${match[1]}`
}
