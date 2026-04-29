import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ContentStatus, ContentType } from '@/lib/generated/prisma'
import StatCard from '@/components/admin/StatCard'
import StatusBadge from '@/components/admin/StatusBadge'
import ContentTypeBadge from '@/components/admin/ContentTypeBadge'

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
  ] = await Promise.all([
    // Status breakdowns
    prisma.course.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.template.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.video.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.learningPath.groupBy({ by: ['status'], _count: { status: true } }),
    // Recent 5 per type
    prisma.course.findMany({
      select: { id: true, title: true, slug: true, status: true, createdAt: true, scheduledPublishAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.template.findMany({
      select: { id: true, title: true, slug: true, status: true, createdAt: true, scheduledPublishAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.video.findMany({
      select: { id: true, title: true, slug: true, status: true, createdAt: true, scheduledPublishAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.learningPath.findMany({
      select: { id: true, title: true, slug: true, status: true, createdAt: true, scheduledPublishAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Scheduled items per type
    prisma.course.findMany({
      select: { id: true, title: true, slug: true, status: true, createdAt: true, scheduledPublishAt: true },
      where: { status: 'SCHEDULED' },
    }),
    prisma.template.findMany({
      select: { id: true, title: true, slug: true, status: true, createdAt: true, scheduledPublishAt: true },
      where: { status: 'SCHEDULED' },
    }),
    prisma.video.findMany({
      select: { id: true, title: true, slug: true, status: true, createdAt: true, scheduledPublishAt: true },
      where: { status: 'SCHEDULED' },
    }),
    prisma.learningPath.findMany({
      select: { id: true, title: true, slug: true, status: true, createdAt: true, scheduledPublishAt: true },
      where: { status: 'SCHEDULED' },
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

  const firstName = session?.user?.name?.split(' ')[0] ?? 'Admin'

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-heading-1 font-bold text-diligent-gray-5">
          Dashboard
        </h1>
        <p className="mt-1 text-diligent-gray-4">
          Welcome back, {firstName}. Here is an overview of your Learning Hub content.
        </p>
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

      {/* Row 2: Recent additions + Scheduled */}
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
