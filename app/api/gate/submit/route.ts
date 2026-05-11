import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { gateSessionCookieHeader } from '@/lib/gate-session'

interface GateSubmitBody {
  firstName: string
  lastName: string
  email: string
  organization: string
  jobTitle: string
  contentType: string
  contentId: string
}

const VALID_CONTENT_TYPES = ['COURSE', 'TEMPLATE', 'VIDEO', 'LEARNING_PATH']

export async function POST(request: Request) {
  let body: GateSubmitBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate required fields
  const required: (keyof GateSubmitBody)[] = [
    'firstName', 'lastName', 'email', 'organization', 'jobTitle', 'contentType', 'contentId',
  ]
  for (const field of required) {
    if (!body[field] || typeof body[field] !== 'string' || !body[field].trim()) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 })
    }
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Validate content type
  if (!VALID_CONTENT_TYPES.includes(body.contentType)) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  try {
    await prisma.gateSubmission.create({
      data: {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        email: body.email.trim(),
        organization: body.organization.trim(),
        jobTitle: body.jobTitle.trim(),
        contentType: body.contentType as any, // validated above
        contentId: body.contentId.trim(),
      },
    })
  } catch (err) {
    console.error('Failed to store gate submission:', err)
    return NextResponse.json(
      { error: 'Failed to submit. Please try again.' },
      { status: 500 },
    )
  }

  const response = NextResponse.json({ success: true })
  response.headers.append('Set-Cookie', gateSessionCookieHeader())
  return response
}
