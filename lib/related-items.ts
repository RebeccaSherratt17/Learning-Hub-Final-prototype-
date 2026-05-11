import { prisma } from '@/lib/db'
import type { ContentType } from '@/lib/generated/prisma'
import type { ContentItem, TaxonomyRef } from '@/types/content'

export type ResolvedRelatedItem = {
  type: string
  id: string
  title: string
}

export async function getRelatedItems(
  sourceType: ContentType,
  sourceId: string
): Promise<ResolvedRelatedItem[]> {
  const rows = await prisma.relatedItem.findMany({
    where: { sourceType, sourceId },
  })

  if (rows.length === 0) return []

  const grouped: Record<string, string[]> = {
    COURSE: [],
    TEMPLATE: [],
    VIDEO: [],
    LEARNING_PATH: [],
  }

  for (const row of rows) {
    grouped[row.targetType].push(row.targetId)
  }

  const [courses, templates, videos, learningPaths] = await Promise.all([
    grouped.COURSE.length
      ? prisma.course.findMany({
          where: { id: { in: grouped.COURSE } },
          select: { id: true, title: true },
        })
      : [],
    grouped.TEMPLATE.length
      ? prisma.template.findMany({
          where: { id: { in: grouped.TEMPLATE } },
          select: { id: true, title: true },
        })
      : [],
    grouped.VIDEO.length
      ? prisma.video.findMany({
          where: { id: { in: grouped.VIDEO } },
          select: { id: true, title: true },
        })
      : [],
    grouped.LEARNING_PATH.length
      ? prisma.learningPath.findMany({
          where: { id: { in: grouped.LEARNING_PATH } },
          select: { id: true, title: true },
        })
      : [],
  ])

  const titleMap = new Map<string, string>()
  for (const item of [...courses, ...templates, ...videos, ...learningPaths]) {
    titleMap.set(item.id, item.title)
  }

  return rows.map((row) => ({
    type: row.targetType,
    id: row.targetId,
    title: titleMap.get(row.targetId) ?? '(Deleted content)',
  }))
}

// ---------------------------------------------------------------------------
// Full ContentItem fetcher for use by the public hub RelatedItems component
// ---------------------------------------------------------------------------

const contentTypeMap: Record<string, ContentItem['_type']> = {
  COURSE: 'course',
  TEMPLATE: 'template',
  VIDEO: 'video',
  LEARNING_PATH: 'learningPath',
}

const accessTierMap: Record<string, ContentItem['accessTier']> = {
  FREE: 'free',
  GATED: 'gated',
  PREMIUM: 'premium',
}

function mapSubjects(
  subjects: { subject: { id: string; name: string; group: { name: string } | null } }[],
): TaxonomyRef[] {
  return subjects.map((s) => ({
    _id: s.subject.id,
    title: s.subject.name,
    group: s.subject.group?.name ?? null,
  }))
}

/** Convert a Prisma content record + its type label into a ContentItem. */
function toContentItem(
  _type: ContentItem['_type'],
  record: {
    id: string
    title: string
    slug: string
    description: string | null
    thumbnailUrl: string | null
    thumbnailAlt: string | null
    accessTier: string
    publishedAt: Date | null
    viewCount: number
    subjects: { subject: { id: string; name: string; group: { name: string } | null } }[]
  },
): ContentItem {
  return {
    _id: record.id,
    _type,
    title: record.title,
    slug: record.slug,
    description: record.description,
    thumbnailUrl: record.thumbnailUrl,
    thumbnailAlt: record.thumbnailAlt,
    accessTier: accessTierMap[record.accessTier] ?? 'free',
    subjects: mapSubjects(record.subjects),
    publishedAt: record.publishedAt?.toISOString() ?? null,
    viewCount: record.viewCount,
  }
}

/**
 * Fetch full ContentItem data for every related item attached to a source.
 * Returns items in the same order they were stored in the RelatedItem table.
 */
export async function getRelatedContentItems(
  sourceType: ContentType,
  sourceId: string,
): Promise<ContentItem[]> {
  const rows = await prisma.relatedItem.findMany({
    where: { sourceType, sourceId },
  })

  if (rows.length === 0) return []

  // Group target IDs by content type
  const grouped: Record<string, string[]> = {
    COURSE: [],
    TEMPLATE: [],
    VIDEO: [],
    LEARNING_PATH: [],
  }
  for (const row of rows) {
    grouped[row.targetType].push(row.targetId)
  }

  const subjectInclude = {
    select: {
      subject: {
        select: { id: true, name: true, group: { select: { name: true } } },
      },
    },
  } as const

  const [courses, templates, videos, learningPaths] = await Promise.all([
    grouped.COURSE.length
      ? prisma.course.findMany({
          where: { id: { in: grouped.COURSE } },
          include: { subjects: subjectInclude },
        })
      : [],
    grouped.TEMPLATE.length
      ? prisma.template.findMany({
          where: { id: { in: grouped.TEMPLATE } },
          include: { subjects: subjectInclude },
        })
      : [],
    grouped.VIDEO.length
      ? prisma.video.findMany({
          where: { id: { in: grouped.VIDEO } },
          include: { subjects: subjectInclude },
        })
      : [],
    grouped.LEARNING_PATH.length
      ? prisma.learningPath.findMany({
          where: { id: { in: grouped.LEARNING_PATH } },
          include: { subjects: subjectInclude },
        })
      : [],
  ])

  // Build a lookup map of id → ContentItem
  const itemMap = new Map<string, ContentItem>()

  for (const c of courses) {
    itemMap.set(c.id, toContentItem('course', c))
  }
  for (const t of templates) {
    itemMap.set(t.id, toContentItem('template', t))
  }
  for (const v of videos) {
    itemMap.set(v.id, toContentItem('video', v))
  }
  for (const lp of learningPaths) {
    itemMap.set(lp.id, toContentItem('learningPath', lp))
  }

  // Preserve original row order, skip any that weren't found (deleted content)
  return rows
    .map((row) => itemMap.get(row.targetId))
    .filter((item): item is ContentItem => item != null)
}
