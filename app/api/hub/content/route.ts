import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import {
  toCourseItem,
  toTemplateItem,
  toVideoItem,
  toLearningPathItem,
  taxonomyInclude,
  publishedFilter,
} from '@/lib/content'
import type { ContentItem } from '@/types/content'

const MAX_LIMIT = 50
const DEFAULT_LIMIT = 12

type ContentTypeParam = 'COURSE' | 'TEMPLATE' | 'VIDEO' | 'LEARNING_PATH'

/**
 * GET /api/hub/content
 *
 * Public endpoint that returns published content items, optionally filtered by
 * organization type, subject(s), and content type. Used by the homepage org-type
 * selector and content widgets.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const orgType = searchParams.get('orgType') || undefined
  const subjectIds = searchParams.getAll('subject').filter(Boolean)
  const regionIds = searchParams.getAll('region').filter(Boolean)
  const sort = searchParams.get('sort') === 'newest' ? 'newest' : 'popular'
  const typeParam = searchParams.get('type') as ContentTypeParam | null
  const limitParam = parseInt(searchParams.get('limit') ?? '', 10)
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
    : DEFAULT_LIMIT

  // Build filter clauses — orgType, subject, and region use AND logic between dimensions.
  const andClauses: Record<string, unknown>[] = []
  if (orgType) {
    andClauses.push({ subjects: { some: { subjectId: orgType } } })
  }
  if (subjectIds.length > 0) {
    andClauses.push({
      subjects: { some: { subjectId: { in: subjectIds } } },
    })
  }

  // Region filter — include "Global" content alongside the selected region(s)
  if (regionIds.length > 0) {
    const globalRegion = await prisma.region.findFirst({
      where: { slug: 'global' },
      select: { id: true },
    })
    const allRegionIds = globalRegion && !regionIds.includes(globalRegion.id)
      ? [...regionIds, globalRegion.id]
      : regionIds
    andClauses.push({
      regions: { some: { regionId: { in: allRegionIds } } },
    })
  }

  // Determine which content types to query
  const types: ContentTypeParam[] = typeParam
    ? [typeParam]
    : ['COURSE', 'TEMPLATE', 'VIDEO', 'LEARNING_PATH']

  const results: ContentItem[] = []

  // Query each requested content type in parallel
  const queries: Promise<void>[] = []

  if (types.includes('COURSE')) {
    queries.push(
      prisma.course
        .findMany({
          where: {
            ...publishedFilter,
            restricted: false,
            ...(andClauses.length > 0 ? { AND: andClauses } : {}),
          },
          include: taxonomyInclude,
          orderBy:
            sort === 'newest'
              ? { publishedAt: 'desc' }
              : { viewCount: 'desc' },
        })
        .then((rows) => {
          results.push(...rows.map(toCourseItem))
        }),
    )
  }

  if (types.includes('TEMPLATE')) {
    queries.push(
      prisma.template
        .findMany({
          where: {
            ...publishedFilter,
            ...(andClauses.length > 0 ? { AND: andClauses } : {}),
          },
          include: taxonomyInclude,
          orderBy:
            sort === 'newest'
              ? { publishedAt: 'desc' }
              : { viewCount: 'desc' },
        })
        .then((rows) => {
          results.push(...rows.map(toTemplateItem))
        }),
    )
  }

  if (types.includes('VIDEO')) {
    queries.push(
      prisma.video
        .findMany({
          where: {
            ...publishedFilter,
            ...(andClauses.length > 0 ? { AND: andClauses } : {}),
          },
          include: taxonomyInclude,
          orderBy:
            sort === 'newest'
              ? { publishedAt: 'desc' }
              : { viewCount: 'desc' },
        })
        .then((rows) => {
          results.push(...rows.map(toVideoItem))
        }),
    )
  }

  if (types.includes('LEARNING_PATH')) {
    queries.push(
      prisma.learningPath
        .findMany({
          where: {
            ...publishedFilter,
            ...(andClauses.length > 0 ? { AND: andClauses } : {}),
          },
          include: taxonomyInclude,
          orderBy:
            sort === 'newest'
              ? { publishedAt: 'desc' }
              : { viewCount: 'desc' },
        })
        .then((rows) => {
          results.push(...rows.map(toLearningPathItem))
        }),
    )
  }

  await Promise.all(queries)

  // Sort the combined results across content types
  if (sort === 'newest') {
    results.sort((a, b) => {
      const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
      return db - da
    })
  } else {
    results.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
  }

  return NextResponse.json(results.slice(0, limit))
}
