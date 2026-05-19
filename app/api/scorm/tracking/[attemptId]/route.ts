import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLaunchToken } from '@/lib/scorm/token'

export async function POST(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { attemptId } = params
    const body = await request.json()
    const { launchToken, cmi } = body

    if (!launchToken || !cmi) {
      return NextResponse.json(
        { error: 'launchToken and cmi are required' },
        { status: 400 }
      )
    }

    // Fetch the attempt to verify
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Verify the launch token using timing-safe comparison
    const valid = verifyLaunchToken(launchToken, attempt.id, attempt.courseId)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid launch token' }, { status: 403 })
    }

    // Normalise CMI data — extract completion status and score
    // SCORM 1.2 uses cmi.core.lesson_status, SCORM 2004 uses cmi.completion_status
    const lessonStatus =
      cmi?.['cmi.core.lesson_status'] ??
      cmi?.['cmi.completion_status'] ??
      null

    const scoreRaw =
      cmi?.['cmi.core.score.raw'] ??
      cmi?.['cmi.score.raw'] ??
      null

    const sessionTime =
      cmi?.['cmi.core.session_time'] ??
      cmi?.['cmi.session_time'] ??
      null

    // Map SCORM status to AttemptStatus enum
    let status = attempt.status
    if (lessonStatus) {
      const normalized = lessonStatus.toLowerCase()
      if (normalized === 'completed' || normalized === 'complete') {
        status = 'COMPLETED'
      } else if (normalized === 'passed') {
        status = 'PASSED'
      } else if (normalized === 'failed') {
        status = 'FAILED'
      }
    }

    // Parse score
    const score = scoreRaw !== null ? parseFloat(scoreRaw) : attempt.score

    // Parse session time to seconds (ISO 8601 duration or HH:MM:SS)
    let timeSpentSeconds = attempt.timeSpentSeconds ?? 0
    if (sessionTime) {
      const parsed = parseSessionTime(sessionTime)
      if (parsed > 0) {
        timeSpentSeconds += parsed
      }
    }

    const isComplete = status === 'COMPLETED' || status === 'PASSED'

    // Update the attempt
    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status,
        score: score !== null && !isNaN(score) ? score : attempt.score,
        timeSpentSeconds,
        completedAt: isComplete && !attempt.completedAt ? new Date() : attempt.completedAt,
        rawCmi: cmi,
      },
    })

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('SCORM tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to update tracking data' },
      { status: 500 }
    )
  }
}

/**
 * Parse SCORM session time formats to seconds.
 * SCORM 1.2: "HH:MM:SS" or "HH:MM:SS.ss"
 * SCORM 2004: ISO 8601 "PT1H30M45S"
 */
function parseSessionTime(time: string): number {
  if (!time) return 0

  // HH:MM:SS format (SCORM 1.2)
  const hmsMatch = time.match(/^(\d+):(\d+):(\d+(?:\.\d+)?)$/)
  if (hmsMatch) {
    const hours = parseInt(hmsMatch[1], 10)
    const minutes = parseInt(hmsMatch[2], 10)
    const seconds = parseFloat(hmsMatch[3])
    return Math.round(hours * 3600 + minutes * 60 + seconds)
  }

  // ISO 8601 duration (SCORM 2004): PT1H30M45S
  const isoMatch = time.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/)
  if (isoMatch) {
    const hours = parseInt(isoMatch[1] || '0', 10)
    const minutes = parseInt(isoMatch[2] || '0', 10)
    const seconds = parseFloat(isoMatch[3] || '0')
    return Math.round(hours * 3600 + minutes * 60 + seconds)
  }

  return 0
}
