import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const q = url.searchParams.get('q') || ''
    const excludeType = url.searchParams.get('excludeType') || ''
    const excludeId = url.searchParams.get('excludeId') || ''

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const titleFilter = { contains: q, mode: 'insensitive' as const }
    const publishedOnly = { status: 'PUBLISHED' as const }

    const [courses, templates, videos, learningPaths] = await Promise.all([
      excludeType === 'COURSE'
        ? prisma.course.findMany({
            where: {
              title: titleFilter,
              ...publishedOnly,
              NOT: { id: excludeId },
            },
            select: { id: true, title: true, slug: true },
            take: 5,
            orderBy: { title: 'asc' },
          })
        : prisma.course.findMany({
            where: { title: titleFilter, ...publishedOnly },
            select: { id: true, title: true, slug: true },
            take: 5,
            orderBy: { title: 'asc' },
          }),
      excludeType === 'TEMPLATE'
        ? prisma.template.findMany({
            where: {
              title: titleFilter,
              ...publishedOnly,
              NOT: { id: excludeId },
            },
            select: { id: true, title: true, slug: true },
            take: 5,
            orderBy: { title: 'asc' },
          })
        : prisma.template.findMany({
            where: { title: titleFilter, ...publishedOnly },
            select: { id: true, title: true, slug: true },
            take: 5,
            orderBy: { title: 'asc' },
          }),
      excludeType === 'VIDEO'
        ? prisma.video.findMany({
            where: {
              title: titleFilter,
              ...publishedOnly,
              NOT: { id: excludeId },
            },
            select: { id: true, title: true, slug: true },
            take: 5,
            orderBy: { title: 'asc' },
          })
        : prisma.video.findMany({
            where: { title: titleFilter, ...publishedOnly },
            select: { id: true, title: true, slug: true },
            take: 5,
            orderBy: { title: 'asc' },
          }),
      excludeType === 'LEARNING_PATH'
        ? prisma.learningPath.findMany({
            where: {
              title: titleFilter,
              ...publishedOnly,
              NOT: { id: excludeId },
            },
            select: { id: true, title: true, slug: true },
            take: 5,
            orderBy: { title: 'asc' },
          })
        : prisma.learningPath.findMany({
            where: { title: titleFilter, ...publishedOnly },
            select: { id: true, title: true, slug: true },
            take: 5,
            orderBy: { title: 'asc' },
          }),
    ])

    const results = [
      ...courses.map((c) => ({ id: c.id, type: 'COURSE' as const, title: c.title, slug: c.slug })),
      ...templates.map((t) => ({ id: t.id, type: 'TEMPLATE' as const, title: t.title, slug: t.slug })),
      ...videos.map((v) => ({ id: v.id, type: 'VIDEO' as const, title: v.title, slug: v.slug })),
      ...learningPaths.map((lp) => ({ id: lp.id, type: 'LEARNING_PATH' as const, title: lp.title, slug: lp.slug })),
    ]

    results.sort((a, b) => a.title.localeCompare(b.title))

    return NextResponse.json({ results: results.slice(0, 10) })
  } catch (error) {
    console.error('Content search error:', error)
    return NextResponse.json({ error: 'Failed to search content' }, { status: 500 })
  }
}
