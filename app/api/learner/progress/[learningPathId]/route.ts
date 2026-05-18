import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getLearnerIdFromCookie } from '@/lib/learner-session'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ learningPathId: string }> },
) {
  const { learningPathId } = await params

  if (!learningPathId) {
    return NextResponse.json({ error: 'learningPathId is required' }, { status: 400 })
  }

  const learnerId = await getLearnerIdFromCookie()

  // Not identified — return empty progress
  if (!learnerId) {
    return NextResponse.json({
      identified: false,
      learner: null,
      progress: [],
    })
  }

  // Verify the learner exists
  const learner = await prisma.learner.findUnique({
    where: { id: learnerId },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  if (!learner) {
    return NextResponse.json({
      identified: false,
      learner: null,
      progress: [],
    })
  }

  // Fetch all completed items for this learner in this learning path
  const progress = await prisma.learnerProgress.findMany({
    where: {
      learnerId: learner.id,
      learningPathId,
    },
    select: {
      learningPathItemId: true,
      completedAt: true,
    },
    orderBy: { completedAt: 'asc' },
  })

  return NextResponse.json({
    identified: true,
    learner: {
      firstName: learner.firstName,
      lastName: learner.lastName,
      email: learner.email,
    },
    progress: progress.map((p) => ({
      learningPathItemId: p.learningPathItemId,
      completedAt: p.completedAt.toISOString(),
    })),
  })
}
