import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import LearningPathForm from '@/components/admin/LearningPathForm'
import RevisionHistory from '@/components/admin/RevisionHistory'

export const dynamic = 'force-dynamic'
import type { ContentType } from '@/lib/generated/prisma'

async function resolveItemTitles(
  items: { id: string; contentType: ContentType | null; contentId: string | null; order: number; milestoneTitle: string | null; isElective: boolean }[]
) {
  // Separate content items from milestones
  const contentItems = items.filter((item) => item.milestoneTitle === null && item.contentType !== null)

  const grouped: Record<string, string[]> = {
    COURSE: [],
    TEMPLATE: [],
    VIDEO: [],
    LEARNING_PATH: [],
  }

  for (const item of contentItems) {
    if (item.contentType && item.contentId) {
      grouped[item.contentType].push(item.contentId)
    }
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

  return items.map((item) => ({
    id: item.id,
    contentType: item.contentType as string | null,
    contentId: item.contentId,
    milestoneTitle: item.milestoneTitle,
    isElective: item.isElective,
    title: item.milestoneTitle ?? (item.contentId ? titleMap.get(item.contentId) ?? '(Deleted content)' : '(Unknown)'),
  }))
}

export default async function EditLearningPathPage({
  params,
}: {
  params: { id: string }
}) {
  const [learningPath, personas, regions, subjects] = await Promise.all([
    prisma.learningPath.findUnique({
      where: { id: params.id },
      include: {
        personas: { include: { persona: true } },
        regions: { include: { region: true } },
        subjects: { include: { subject: true } },
        items: { orderBy: { order: 'asc' } },
      },
    }),
    prisma.persona.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.region.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.subject.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, group: { select: { id: true, name: true } } },
    }),
  ])

  if (!learningPath) {
    redirect('/admin/learning-paths')
  }

  const itemsWithTitles = await resolveItemTitles(learningPath.items)

  const learningPathData = {
    id: learningPath.id,
    title: learningPath.title,
    slug: learningPath.slug,
    description: learningPath.description,
    estimatedCompletionTime: learningPath.estimatedCompletionTime,
    credlyBadgeId: learningPath.credlyBadgeId,
    thumbnailUrl: learningPath.thumbnailUrl,
    thumbnailAlt: learningPath.thumbnailAlt,
    ogImageUrl: learningPath.ogImageUrl,
    accessTier: learningPath.accessTier,
    publishedAt: learningPath.publishedAt?.toISOString() ?? null,
    scheduledPublishAt: learningPath.scheduledPublishAt?.toISOString() ?? null,
    status: learningPath.status,
    seoTitle: learningPath.seoTitle,
    seoDescription: learningPath.seoDescription,
    sku: learningPath.sku,
    personaIds: learningPath.personas.map((lp) => lp.persona.id),
    regionIds: learningPath.regions.map((lr) => lr.region.id),
    subjectIds: learningPath.subjects.map((ls) => ls.subject.id),
    items: itemsWithTitles,
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/learning-paths"
          className="inline-flex items-center gap-1 text-sm text-diligent-gray-4 hover:text-diligent-gray-5"
        >
          <span className="material-symbols-sharp text-[18px]">arrow_back</span>
          Back to learning paths
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-diligent-gray-5">Edit learning path</h1>
      </div>

      <LearningPathForm
        learningPath={learningPathData}
        personas={personas}
        regions={regions}
        subjects={subjects}
      />

      <RevisionHistory contentType="LEARNING_PATH" contentId={learningPath.id} />
    </div>
  )
}
