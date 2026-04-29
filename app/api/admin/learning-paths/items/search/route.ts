import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface SearchResult {
  contentType: string
  contentId: string
  title: string
  status: string
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const q = url.searchParams.get('q') || ''
    const type = url.searchParams.get('type') || ''

    if (!q.trim()) {
      return NextResponse.json({ items: [] })
    }

    const titleFilter = { contains: q, mode: 'insensitive' as const }
    const validStatuses: ('PUBLISHED' | 'DRAFT')[] = ['PUBLISHED', 'DRAFT']
    const items: SearchResult[] = []

    const shouldSearch = (contentType: string) => !type || type === contentType

    const [courses, templates, videos] = await Promise.all([
      shouldSearch('COURSE')
        ? prisma.course.findMany({
            where: { title: titleFilter, status: { in: validStatuses } },
            select: { id: true, title: true, status: true },
            take: 10,
            orderBy: { title: 'asc' },
          })
        : [],
      shouldSearch('TEMPLATE')
        ? prisma.template.findMany({
            where: { title: titleFilter, status: { in: validStatuses } },
            select: { id: true, title: true, status: true },
            take: 10,
            orderBy: { title: 'asc' },
          })
        : [],
      shouldSearch('VIDEO')
        ? prisma.video.findMany({
            where: { title: titleFilter, status: { in: validStatuses } },
            select: { id: true, title: true, status: true },
            take: 10,
            orderBy: { title: 'asc' },
          })
        : [],
    ])

    for (const course of courses) {
      items.push({
        contentType: 'COURSE',
        contentId: course.id,
        title: course.title,
        status: course.status,
      })
    }

    for (const template of templates) {
      items.push({
        contentType: 'TEMPLATE',
        contentId: template.id,
        title: template.title,
        status: template.status,
      })
    }

    for (const video of videos) {
      items.push({
        contentType: 'VIDEO',
        contentId: video.id,
        title: video.title,
        status: video.status,
      })
    }

    // Sort combined results alphabetically
    items.sort((a, b) => a.title.localeCompare(b.title))

    return NextResponse.json({ items: items.slice(0, 20) })
  } catch (error) {
    console.error('Failed to search content items:', error)
    return NextResponse.json({ error: 'Failed to search content items' }, { status: 500 })
  }
}
