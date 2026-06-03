import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { ContentStatus } from '@/lib/generated/prisma'

interface Suggestion {
  id: string
  title: string
  slug: string
  type: 'course' | 'template' | 'video' | 'learningPath'
  subTopics: string[]
}

const DISPLAY_LIMIT = 5

/**
 * GET /api/hub/search-suggest?q=term
 *
 * Returns up to 5 published, non-restricted content items whose title
 * contains the search term (case-insensitive), plus the total count of
 * all matching results. Used by the homepage search typeahead.
 *
 * Response: { results: Suggestion[], total: number }
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], total: 0 })
  }

  const where = {
    status: ContentStatus.PUBLISHED,
    title: { contains: q, mode: 'insensitive' as const },
  }

  const select = {
    id: true,
    title: true,
    slug: true,
    subjects: {
      include: { subject: { include: { group: true } } },
    },
  } as const

  const [courses, templates, videos, learningPaths] = await Promise.all([
    prisma.course.findMany({
      where: { ...where, restricted: false },
      select,
      orderBy: { title: 'asc' },
    }),
    prisma.template.findMany({ where, select, orderBy: { title: 'asc' } }),
    prisma.video.findMany({ where, select, orderBy: { title: 'asc' } }),
    prisma.learningPath.findMany({ where, select, orderBy: { title: 'asc' } }),
  ])

  function toSuggestion(
    r: {
      id: string
      title: string
      slug: string
      subjects: { subject: { name: string; group: { slug: string } } }[]
    },
    type: Suggestion['type'],
  ): Suggestion {
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      type,
      subTopics: r.subjects
        .filter((s) => s.subject.group.slug !== 'organization-type')
        .map((s) => s.subject.name),
    }
  }

  const all: Suggestion[] = [
    ...courses.map((r) => toSuggestion(r, 'course')),
    ...templates.map((r) => toSuggestion(r, 'template')),
    ...videos.map((r) => toSuggestion(r, 'video')),
    ...learningPaths.map((r) => toSuggestion(r, 'learningPath')),
  ]

  all.sort((a, b) => a.title.localeCompare(b.title))

  return NextResponse.json({
    results: all.slice(0, DISPLAY_LIMIT),
    total: all.length,
  })
}
