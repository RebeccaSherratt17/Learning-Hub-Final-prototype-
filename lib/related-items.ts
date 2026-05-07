import { prisma } from '@/lib/db'
import type { ContentType } from '@/lib/generated/prisma'

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
