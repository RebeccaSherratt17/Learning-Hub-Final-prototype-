import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getLearnerIdFromCookie } from '@/lib/learner-session'
import { issueCredlyBadge } from '@/lib/credly'

interface ProgressBody {
  learningPathItemId: string
  learningPathId: string
}

export async function POST(request: Request) {
  // Identify learner from cookie
  const learnerId = await getLearnerIdFromCookie()
  if (!learnerId) {
    return NextResponse.json(
      { error: 'Learner not identified. Please provide your details first.' },
      { status: 401 },
    )
  }

  // Verify the learner exists
  const learner = await prisma.learner.findUnique({
    where: { id: learnerId },
    select: { id: true, email: true, firstName: true, lastName: true },
  })

  if (!learner) {
    return NextResponse.json(
      { error: 'Learner not found. Please provide your details again.' },
      { status: 401 },
    )
  }

  let body: ProgressBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate required fields
  if (!body.learningPathItemId || typeof body.learningPathItemId !== 'string') {
    return NextResponse.json({ error: 'learningPathItemId is required' }, { status: 400 })
  }
  if (!body.learningPathId || typeof body.learningPathId !== 'string') {
    return NextResponse.json({ error: 'learningPathId is required' }, { status: 400 })
  }

  // Validate the item exists and belongs to the specified learning path
  const item = await prisma.learningPathItem.findUnique({
    where: { id: body.learningPathItemId },
    select: { id: true, learningPathId: true, milestoneTitle: true },
  })

  if (!item) {
    return NextResponse.json({ error: 'Learning path item not found' }, { status: 404 })
  }

  if (item.learningPathId !== body.learningPathId) {
    return NextResponse.json(
      { error: 'Item does not belong to the specified learning path' },
      { status: 400 },
    )
  }

  // Milestones cannot be completed — they are organisational labels
  if (item.milestoneTitle) {
    return NextResponse.json(
      { error: 'Milestones cannot be marked as complete' },
      { status: 400 },
    )
  }

  try {
    // Upsert progress — avoids duplicates via the unique constraint
    await prisma.learnerProgress.upsert({
      where: {
        learnerId_learningPathItemId: {
          learnerId: learner.id,
          learningPathItemId: body.learningPathItemId,
        },
      },
      update: {}, // Already completed — no change
      create: {
        learnerId: learner.id,
        learningPathId: body.learningPathId,
        learningPathItemId: body.learningPathItemId,
      },
    })

    // Check if all mandatory items in this learning path are now complete
    const allMandatoryItems = await prisma.learningPathItem.findMany({
      where: {
        learningPathId: body.learningPathId,
        isElective: false,
        milestoneTitle: null, // Exclude milestones
      },
      select: { id: true },
    })

    const completedItems = await prisma.learnerProgress.findMany({
      where: {
        learnerId: learner.id,
        learningPathId: body.learningPathId,
        learningPathItemId: {
          in: allMandatoryItems.map((i) => i.id),
        },
      },
      select: { learningPathItemId: true },
    })

    const allMandatoryComplete = completedItems.length >= allMandatoryItems.length

    // If all mandatory items complete and path has a Credly badge, log for future integration
    if (allMandatoryComplete) {
      const learningPath = await prisma.learningPath.findUnique({
        where: { id: body.learningPathId },
        select: { credlyBadgeId: true, title: true },
      })

      if (learningPath?.credlyBadgeId) {
        // Issue Credly badge asynchronously — do not block the response
        issueCredlyBadge({
          learnerEmail: learner.email,
          learnerFirstName: learner.firstName,
          learnerLastName: learner.lastName,
          badgeTemplateId: learningPath.credlyBadgeId,
          learningPathId: body.learningPathId,
        }).catch((err) => {
          console.error(
            `[Credly] Failed to issue badge for ${learner.email} on path "${learningPath.title}":`,
            err,
          )
        })
      }
    }

    return NextResponse.json({
      completed: true,
      learningPathItemId: body.learningPathItemId,
      allMandatoryComplete,
    })
  } catch (err) {
    console.error('Failed to record learner progress:', err)
    return NextResponse.json(
      { error: 'Failed to record progress. Please try again.' },
      { status: 500 },
    )
  }
}
