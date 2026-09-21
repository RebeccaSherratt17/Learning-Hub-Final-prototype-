import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { learnerSessionCookieHeader } from '@/lib/learner-session'
import { unlockedPathsCookieHeader } from '@/lib/unlocked-paths'

interface IdentifyBody {
  firstName: string
  lastName: string
  email: string
  learningPathId: string
}

export async function POST(request: Request) {
  let body: IdentifyBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate required fields
  const required: (keyof IdentifyBody)[] = ['firstName', 'lastName', 'email', 'learningPathId']
  for (const field of required) {
    if (!body[field] || typeof body[field] !== 'string' || !body[field].trim()) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 })
    }
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Validate learning path exists and is published
  const learningPath = await prisma.learningPath.findUnique({
    where: { id: body.learningPathId.trim() },
    select: { id: true, status: true },
  })

  if (!learningPath) {
    return NextResponse.json({ error: 'Learning path not found' }, { status: 404 })
  }

  if (learningPath.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Learning path is not available' }, { status: 404 })
  }

  try {
    // Upsert learner — find by email, update name if they already exist
    const learner = await prisma.learner.upsert({
      where: { email: body.email.trim().toLowerCase() },
      update: {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
      },
      create: {
        email: body.email.trim().toLowerCase(),
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
      },
    })

    // Update unlocked paths cookie — add this learning path to the list
    const cookieStore = await cookies()
    const existingCookie = cookieStore.get('hub_unlocked_paths')
    let unlockedPaths: string[] = []

    if (existingCookie?.value) {
      try {
        const parsed = JSON.parse(decodeURIComponent(existingCookie.value))
        if (Array.isArray(parsed)) {
          unlockedPaths = parsed.filter((id) => typeof id === 'string')
        }
      } catch {
        // Invalid JSON — start fresh
      }
    }

    // Add current learning path if not already present
    if (!unlockedPaths.includes(body.learningPathId.trim())) {
      unlockedPaths.push(body.learningPathId.trim())
    }

    const response = NextResponse.json({
      learnerId: learner.id,
      firstName: learner.firstName,
      lastName: learner.lastName,
      email: learner.email,
    })
    response.headers.append('Set-Cookie', learnerSessionCookieHeader(learner.id))
    response.headers.append('Set-Cookie', unlockedPathsCookieHeader(unlockedPaths))
    return response
  } catch (err) {
    console.error('Failed to identify learner:', err)
    return NextResponse.json(
      { error: 'Failed to identify learner. Please try again.' },
      { status: 500 },
    )
  }
}
