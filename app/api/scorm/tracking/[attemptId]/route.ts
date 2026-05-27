import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLaunchToken } from '@/lib/scorm/token'
import { issueCredlyBadge } from '@/lib/credly'

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

    // Normalise CMI data — scorm-again's renderCMIToJSONObject() returns
    // a nested object: { cmi: { core: { lesson_status: "completed", ... } } }
    // not flat dot-notation keys.
    const cmiData = cmi?.cmi ?? cmi // handle both { cmi: { ... } } and flat

    // SCORM 1.2: cmi.core.lesson_status / cmi.core.score.raw / cmi.core.session_time
    const lessonStatus = cmiData?.core?.lesson_status ?? null
    // SCORM 2004: cmi.completion_status / cmi.success_status / cmi.score.raw / cmi.session_time
    const completionStatus = cmiData?.completion_status ?? null
    const successStatus = cmiData?.success_status ?? null

    const scoreRaw =
      cmiData?.core?.score?.raw ??
      cmiData?.score?.raw ??
      null

    const sessionTime =
      cmiData?.core?.session_time ??
      cmiData?.session_time ??
      null

    // Map SCORM status to AttemptStatus enum
    let status = attempt.status

    if (lessonStatus) {
      // SCORM 1.2
      const normalized = lessonStatus.toLowerCase()
      if (normalized === 'completed' || normalized === 'passed') {
        status = 'COMPLETED'
      } else if (normalized === 'failed') {
        status = 'FAILED'
      }
    } else if (completionStatus || successStatus) {
      // SCORM 2004
      const comp = completionStatus?.toLowerCase()
      const succ = successStatus?.toLowerCase()
      if (succ === 'failed') {
        status = 'FAILED'
      } else if (comp === 'completed' && succ === 'passed') {
        status = 'PASSED'
      } else if (comp === 'completed') {
        status = 'COMPLETED'
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

    // Issue Credly badge if course just completed and has a badge configured
    const wasAlreadyComplete =
      attempt.status === 'COMPLETED' || attempt.status === 'PASSED'

    if (isComplete && !wasAlreadyComplete) {
      const course = await prisma.course.findUnique({
        where: { id: attempt.courseId },
        select: { credlyBadgeId: true, title: true },
      })

      if (course?.credlyBadgeId) {
        issueCredlyBadge({
          learnerEmail: attempt.learnerEmail,
          learnerFirstName: attempt.learnerFirstName,
          learnerLastName: attempt.learnerLastName ?? undefined,
          badgeTemplateId: course.credlyBadgeId,
          courseId: attempt.courseId,
        }).catch((err) => {
          console.error(
            `[Credly] Failed to issue badge for ${attempt.learnerEmail} on course "${course.title}":`,
            err,
          )
        })
      }
    }

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
