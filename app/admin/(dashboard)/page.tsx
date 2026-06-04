import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ContentStatus, ContentType } from '@/lib/generated/prisma'
import StatCard from '@/components/admin/StatCard'
import StatusBadge from '@/components/admin/StatusBadge'
import ContentTypeBadge from '@/components/admin/ContentTypeBadge'
import { checkCourseHealth, checkTemplateHealth, checkVideoHealth, checkLearningPathHealth } from '@/lib/admin/metadataHealth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function contentTypePath(type: ContentType): string {
  switch (type) {
    case 'COURSE':
      return 'courses'
    case 'TEMPLATE':
      return 'templates'
    case 'VIDEO':
      return 'videos'
    case 'LEARNING_PATH':
      return 'learning-paths'
  }
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays} days ago`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  const diffYears = Math.floor(diffDays / 365)
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
}

function formatScheduledDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function buildBreakdown(
  groups: { status: ContentStatus; _count: { status: number } }[]
): string {
  const parts: string[] = []
  const statusOrder: ContentStatus[] = ['PUBLISHED', 'DRAFT', 'SCHEDULED', 'ARCHIVED']
  const labels: Record<ContentStatus, string> = {
    PUBLISHED: 'published',
    DRAFT: 'draft',
    SCHEDULED: 'scheduled',
    ARCHIVED: 'archived',
  }
  for (const s of statusOrder) {
    const found = groups.find((g) => g.status === s)
    if (found && found._count.status > 0) {
      parts.push(`${found._count.status} ${labels[s]}`)
    }
  }
  return parts.length > 0 ? parts.join(', ') : 'No items yet'
}

function sumCounts(
  groups: { _count: { status: number } }[]
): number {
  return groups.reduce((sum, g) => sum + g._count.status, 0)
}

// ---------------------------------------------------------------------------
// Unified content item type for recent / scheduled lists
// ---------------------------------------------------------------------------

interface ContentListItem {
  id: string
  title: string
  slug: string
  type: ContentType
  status: ContentStatus
  createdAt: Date
  scheduledPublishAt: Date | null
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  // Shared select for content list queries
  const listSelect = { id: true, title: true, slug: true, status: true, createdAt: true, scheduledPublishAt: true } as const

  // Fetch all data in parallel
  const [
    coursesByStatus,
    templatesByStatus,
    videosByStatus,
    learningPathsByStatus,
    recentCourses,
    recentTemplates,
    recentVideos,
    recentLearningPaths,
    scheduledCourses,
    scheduledTemplates,
    scheduledVideos,
    scheduledLearningPaths,
    publishedCourses,
    publishedTemplates,
    publishedVideos,
    publishedLearningPaths,
    relatedItemCounts,
  ] = await Promise.all([
    // Status breakdowns
    prisma.course.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.template.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.video.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.learningPath.groupBy({ by: ['status'], _count: { status: true } }),
    // Recent 5 per type
    prisma.course.findMany({ select: listSelect, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.template.findMany({ select: listSelect, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.video.findMany({ select: listSelect, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.learningPath.findMany({ select: listSelect, orderBy: { createdAt: 'desc' }, take: 5 }),
    // Scheduled items per type
    prisma.course.findMany({ select: listSelect, where: { status: 'SCHEDULED' } }),
    prisma.template.findMany({ select: listSelect, where: { status: 'SCHEDULED' } }),
    prisma.video.findMany({ select: listSelect, where: { status: 'SCHEDULED' } }),
    prisma.learningPath.findMany({ select: listSelect, where: { status: 'SCHEDULED' } }),
    // Published items with metadata fields for "action required" panel
    prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true, title: true, slug: true, thumbnailUrl: true, ogImageUrl: true, description: true,
        sku: true, seoTitle: true, seoDescription: true, launchFile: true, level: true,
        subjects: { include: { subject: { include: { group: true } } } },
        personas: true, regions: true,
      },
    }),
    prisma.template.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true, title: true, slug: true, thumbnailUrl: true, ogImageUrl: true, description: true,
        sku: true, seoTitle: true, seoDescription: true, fileUrl: true,
        subjects: { include: { subject: { include: { group: true } } } },
        personas: true, regions: true,
      },
    }),
    prisma.video.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true, title: true, slug: true, thumbnailUrl: true, ogImageUrl: true, description: true,
        sku: true, seoTitle: true, seoDescription: true, vidyardUrl: true, duration: true, level: true,
        subjects: { include: { subject: { include: { group: true } } } },
        personas: true, regions: true,
      },
    }),
    prisma.learningPath.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true, title: true, slug: true, thumbnailUrl: true, ogImageUrl: true, description: true,
        sku: true, seoTitle: true, seoDescription: true, level: true,
        subjects: { include: { subject: { include: { group: true } } } },
        personas: true, regions: true,
      },
    }),
    // Related items counts for all published content
    prisma.relatedItem.groupBy({
      by: ['sourceType', 'sourceId'],
      _count: { id: true },
    }),
  ])

  // Merge recent items, sort by createdAt desc, take top 5
  const recentItems: ContentListItem[] = [
    ...recentCourses.map((c) => ({ ...c, type: 'COURSE' as const })),
    ...recentTemplates.map((t) => ({ ...t, type: 'TEMPLATE' as const })),
    ...recentVideos.map((v) => ({ ...v, type: 'VIDEO' as const })),
    ...recentLearningPaths.map((lp) => ({ ...lp, type: 'LEARNING_PATH' as const })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)

  // Merge scheduled items, sort by scheduledPublishAt asc
  const scheduledItems: ContentListItem[] = [
    ...scheduledCourses.map((c) => ({ ...c, type: 'COURSE' as const })),
    ...scheduledTemplates.map((t) => ({ ...t, type: 'TEMPLATE' as const })),
    ...scheduledVideos.map((v) => ({ ...v, type: 'VIDEO' as const })),
    ...scheduledLearningPaths.map((lp) => ({ ...lp, type: 'LEARNING_PATH' as const })),
  ].sort((a, b) => {
    const aTime = a.scheduledPublishAt?.getTime() ?? 0
    const bTime = b.scheduledPublishAt?.getTime() ?? 0
    return aTime - bTime
  })

  // Total published count across all types
  const totalPublished =
    publishedCourses.length +
    publishedTemplates.length +
    publishedVideos.length +
    publishedLearningPaths.length

  // Build "action required" list — published items missing metadata
  interface AttentionItem {
    id: string
    title: string
    slug: string
    type: ContentType
    missing: string[]
  }

  // Build a lookup for related item counts: "TYPE:id" → count
  const relatedCountMap = new Map<string, number>()
  for (const row of relatedItemCounts) {
    relatedCountMap.set(`${row.sourceType}:${row.sourceId}`, row._count.id)
  }

  const attentionItems: AttentionItem[] = []

  for (const c of publishedCourses) {
    const missing = checkCourseHealth({ ...c, relatedItemCount: relatedCountMap.get(`COURSE:${c.id}`) ?? 0 })
    if (missing.length > 0) attentionItems.push({ id: c.id, title: c.title, slug: c.slug, type: 'COURSE', missing })
  }
  for (const t of publishedTemplates) {
    const missing = checkTemplateHealth({ ...t, relatedItemCount: relatedCountMap.get(`TEMPLATE:${t.id}`) ?? 0 })
    if (missing.length > 0) attentionItems.push({ id: t.id, title: t.title, slug: t.slug, type: 'TEMPLATE', missing })
  }
  for (const v of publishedVideos) {
    const missing = checkVideoHealth({ ...v, relatedItemCount: relatedCountMap.get(`VIDEO:${v.id}`) ?? 0 })
    if (missing.length > 0) attentionItems.push({ id: v.id, title: v.title, slug: v.slug, type: 'VIDEO', missing })
  }
  for (const lp of publishedLearningPaths) {
    const missing = checkLearningPathHealth({ ...lp, relatedItemCount: relatedCountMap.get(`LEARNING_PATH:${lp.id}`) ?? 0 })
    if (missing.length > 0) attentionItems.push({ id: lp.id, title: lp.title, slug: lp.slug, type: 'LEARNING_PATH', missing })
  }

  const totalAttention = attentionItems.length
  const displayedAttention = attentionItems.slice(0, 10)

  const firstName = session?.user?.name?.split(' ')[0] ?? 'Admin'

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-heading-1 font-bold text-diligent-gray-5">
            Dashboard
          </h1>
          <p className="mt-1 text-diligent-gray-4">
            Welcome back! Here is an overview of your Learning Hub content.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-3xl font-bold text-diligent-gray-5">{totalPublished}</p>
          <p className="mt-0.5 text-sm text-diligent-gray-4">published resources</p>
        </div>
      </div>

      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="school"
          label="Courses"
          total={sumCounts(coursesByStatus)}
          breakdown={buildBreakdown(coursesByStatus)}
        />
        <StatCard
          icon="description"
          label="Templates"
          total={sumCounts(templatesByStatus)}
          breakdown={buildBreakdown(templatesByStatus)}
        />
        <StatCard
          icon="videocam"
          label="Videos"
          total={sumCounts(videosByStatus)}
          breakdown={buildBreakdown(videosByStatus)}
        />
        <StatCard
          icon="route"
          label="Learning paths"
          total={sumCounts(learningPathsByStatus)}
          breakdown={buildBreakdown(learningPathsByStatus)}
        />
      </div>

      {/* Row 2: Action required */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-heading-3 font-bold text-diligent-gray-5">
          Action required
        </h2>

        {displayedAttention.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 py-6 text-diligent-gray-3">
            <span className="material-symbols-sharp text-[40px]">
              check_circle
            </span>
            <p className="text-sm text-diligent-gray-4">
              All published content looks good.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-1 text-xs text-diligent-gray-4">
              These published items are missing key information that may affect how they appear to learners.
            </p>
            <ul className="mt-4 divide-y divide-diligent-gray-1">
              {displayedAttention.map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <ContentTypeBadge type={item.type} />
                  <Link
                    href={`/admin/${contentTypePath(item.type)}/${item.slug}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-diligent-gray-5 hover:text-link"
                  >
                    {item.title}
                  </Link>
                  <span className="shrink-0 text-xs text-diligent-gray-4">
                    Missing: {item.missing.join(', ')}
                  </span>
                </li>
              ))}
            </ul>
            {totalAttention > 10 && (
              <p className="mt-3 text-xs text-diligent-gray-4">
                And {totalAttention - 10} more item{totalAttention - 10 > 1 ? 's' : ''} need attention.
              </p>
            )}
          </>
        )}
      </div>

      {/* Row 3: Recent additions + Scheduled */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent additions */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-heading-3 font-bold text-diligent-gray-5">
            Recent additions
          </h2>

          {recentItems.length === 0 ? (
            <p className="mt-4 text-sm text-diligent-gray-4">
              No content yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-diligent-gray-1">
              {recentItems.map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <ContentTypeBadge type={item.type} />
                  <Link
                    href={`/admin/${contentTypePath(item.type)}/${item.slug}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-diligent-gray-5 hover:text-link"
                  >
                    {item.title}
                  </Link>
                  <StatusBadge status={item.status} />
                  <span className="shrink-0 text-xs text-diligent-gray-4">
                    {formatRelativeDate(item.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Scheduled items */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-heading-3 font-bold text-diligent-gray-5">
            Scheduled
          </h2>

          {scheduledItems.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-2 py-6 text-diligent-gray-3">
              <span className="material-symbols-sharp text-[40px]">
                event_available
              </span>
              <p className="text-sm text-diligent-gray-4">
                No scheduled items.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-diligent-gray-1">
              {scheduledItems.map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <ContentTypeBadge type={item.type} />
                  <Link
                    href={`/admin/${contentTypePath(item.type)}/${item.slug}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-diligent-gray-5 hover:text-link"
                  >
                    {item.title}
                  </Link>
                  {item.scheduledPublishAt && (
                    <span className="shrink-0 text-xs text-diligent-gray-4">
                      {formatScheduledDate(item.scheduledPublishAt)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
