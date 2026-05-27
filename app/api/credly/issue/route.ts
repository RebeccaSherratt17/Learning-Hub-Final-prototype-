import { NextResponse } from 'next/server'
import { issueCredlyBadge } from '@/lib/credly'

interface IssueBody {
  learnerEmail: string
  learnerFirstName: string
  learnerLastName?: string
  credlyBadgeId: string
  learningPathId: string
}

export async function POST(request: Request) {
  let body: IssueBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate required fields
  if (!body.learnerEmail || typeof body.learnerEmail !== 'string') {
    return NextResponse.json({ error: 'learnerEmail is required' }, { status: 400 })
  }
  if (!body.learnerFirstName || typeof body.learnerFirstName !== 'string') {
    return NextResponse.json({ error: 'learnerFirstName is required' }, { status: 400 })
  }
  if (!body.credlyBadgeId || typeof body.credlyBadgeId !== 'string') {
    return NextResponse.json({ error: 'credlyBadgeId is required' }, { status: 400 })
  }
  if (!body.learningPathId || typeof body.learningPathId !== 'string') {
    return NextResponse.json({ error: 'learningPathId is required' }, { status: 400 })
  }

  const result = await issueCredlyBadge({
    learnerEmail: body.learnerEmail,
    learnerFirstName: body.learnerFirstName,
    learnerLastName: body.learnerLastName,
    badgeTemplateId: body.credlyBadgeId,
    learningPathId: body.learningPathId,
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Failed to issue Credly badge' },
      { status: 502 },
    )
  }

  return NextResponse.json({
    success: true,
    credlyBadgeId: result.credlyBadgeId,
  })
}
