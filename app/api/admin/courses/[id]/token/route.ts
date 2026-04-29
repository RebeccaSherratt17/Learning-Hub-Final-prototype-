import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      select: { slug: true },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const token = crypto.randomBytes(32).toString('hex')

    await prisma.course.update({
      where: { id: params.id },
      data: { accessToken: token, restricted: true },
    })

    return NextResponse.json({
      token,
      url: `/courses/${course.slug}?token=${token}`,
    })
  } catch (error) {
    console.error('Failed to generate token:', error)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.course.update({
      where: { id: params.id },
      data: { accessToken: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to revoke token:', error)
    return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 })
  }
}
