import 'server-only'
import { prisma } from '@/lib/db'
import type { ContentStatus, ContentType } from '@/lib/generated/prisma'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'
import {
  bucketKeys,
  rangeBucket,
  rangeStart,
  type ReportRange,
  type TrendBucket,
} from '@/lib/admin/reportingRanges'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportOverview {
  visitors: number
  pageViews: number
  leads: number
  courseStarts: number
  courseCompletions: number
  templateDownloads: number
  pathEnrolments: number
  pathCompletions: number
  badgesIssued: number
}

export interface TrendPoint {
  date: string // YYYY-MM-DD, start of bucket
  visitors: number
  views: number
}

export interface ItemReportRow {
  id: string
  type: ContentType
  title: string
  status: ContentStatus
  views: number
  visitors: number
  allTimeViews: number
  leads: number
  downloads: number | null // templates only
  starts: number | null // courses only
  completions: number | null // courses only
  badges: number | null // courses only
}

export interface PathReportRow {
  id: string
  title: string
  status: ContentStatus
  views: number
  enrolled: number
  activeLearners: number
  completions: number
  badges: number
}

export interface Report {
  range: ReportRange
  from: Date
  bucket: TrendBucket
  trackingSince: Date | null
  overview: ReportOverview
  trend: TrendPoint[]
  items: ItemReportRow[]
  paths: PathReportRow[]
}

export interface LeadRow {
  submittedAt: Date
  firstName: string
  lastName: string
  email: string
  organization: string
  jobTitle: string
  contentType: ContentType
  contentTitle: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COMPLETED_STATUSES = new Set(['COMPLETED', 'PASSED'])

function increment(map: Map<string, number>, key: string, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by)
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

async function getTrackingSince(): Promise<Date | null> {
  const first = await prisma.analyticsEvent.findFirst({
    where: { eventType: ANALYTICS_EVENTS.PAGE_VIEW },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  })
  return first?.createdAt ?? null
}

async function getEventTotals(from: Date) {
  const [row] = await prisma.$queryRaw<
    { views: bigint; visitors: bigint; downloads: bigint }[]
  >`
    SELECT
      COUNT(*) FILTER (WHERE "eventType" = ${ANALYTICS_EVENTS.PAGE_VIEW}) AS views,
      COUNT(DISTINCT metadata->>'visitorHash') FILTER (WHERE "eventType" = ${ANALYTICS_EVENTS.PAGE_VIEW}) AS visitors,
      COUNT(*) FILTER (WHERE "eventType" = ${ANALYTICS_EVENTS.TEMPLATE_DOWNLOAD}) AS downloads
    FROM analytics_events
    WHERE "createdAt" >= ${from}
  `
  return {
    views: Number(row?.views ?? 0),
    visitors: Number(row?.visitors ?? 0),
    downloads: Number(row?.downloads ?? 0),
  }
}

async function getTrend(from: Date, bucket: TrendBucket, trackingSince: Date | null): Promise<TrendPoint[]> {
  if (!trackingSince) return []

  const rows = await prisma.$queryRaw<{ bucket: string; visitors: bigint; views: bigint }[]>`
    SELECT
      to_char(date_trunc(${bucket}, "createdAt"), 'YYYY-MM-DD') AS bucket,
      COUNT(DISTINCT metadata->>'visitorHash') AS visitors,
      COUNT(*) AS views
    FROM analytics_events
    WHERE "eventType" = ${ANALYTICS_EVENTS.PAGE_VIEW} AND "createdAt" >= ${from}
    GROUP BY 1
    ORDER BY 1
  `
  const byKey = new Map(rows.map((r) => [r.bucket, r]))

  // "All time" starts when tracking began rather than at the epoch
  const start = from.getTime() === 0 ? trackingSince : from
  return bucketKeys(start, new Date(), bucket).map((date) => ({
    date,
    visitors: Number(byKey.get(date)?.visitors ?? 0),
    views: Number(byKey.get(date)?.views ?? 0),
  }))
}

async function getEventsByItem(from: Date) {
  const rows = await prisma.$queryRaw<
    { contentId: string; eventType: string; total: bigint; visitors: bigint; learners: bigint }[]
  >`
    SELECT
      "contentId",
      "eventType",
      COUNT(*) AS total,
      COUNT(DISTINCT metadata->>'visitorHash') AS visitors,
      COUNT(DISTINCT metadata->>'learnerId') AS learners
    FROM analytics_events
    WHERE "contentId" IS NOT NULL AND "createdAt" >= ${from}
    GROUP BY 1, 2
  `
  const views = new Map<string, number>()
  const visitors = new Map<string, number>()
  const downloads = new Map<string, number>()
  const enrolments = new Map<string, number>()
  for (const r of rows) {
    if (r.eventType === ANALYTICS_EVENTS.PAGE_VIEW) {
      views.set(r.contentId, Number(r.total))
      visitors.set(r.contentId, Number(r.visitors))
    } else if (r.eventType === ANALYTICS_EVENTS.TEMPLATE_DOWNLOAD) {
      downloads.set(r.contentId, Number(r.total))
    } else if (r.eventType === ANALYTICS_EVENTS.LEARNING_PATH_ENROL) {
      enrolments.set(r.contentId, Number(r.learners))
    }
  }
  return { views, visitors, downloads, enrolments }
}

/**
 * Learning path completion, mirroring /api/learner/progress: a learner has
 * completed a path once every mandatory, non-milestone item is done. The
 * completion date is when their last mandatory item was finished.
 */
async function getPathProgress(from: Date) {
  const [mandatoryItems, progress] = await Promise.all([
    prisma.learningPathItem.findMany({
      where: { isElective: false, milestoneTitle: null },
      select: { id: true, learningPathId: true },
    }),
    prisma.learnerProgress.findMany({
      select: { learnerId: true, learningPathId: true, learningPathItemId: true, completedAt: true },
    }),
  ])

  const mandatoryByPath = new Map<string, Set<string>>()
  for (const item of mandatoryItems) {
    if (!mandatoryByPath.has(item.learningPathId)) mandatoryByPath.set(item.learningPathId, new Set())
    mandatoryByPath.get(item.learningPathId)!.add(item.id)
  }

  // pathId → learnerId → { mandatory items done, latest mandatory completion, active in range }
  const perLearner = new Map<string, Map<string, { done: number; last: Date; active: boolean }>>()
  for (const p of progress) {
    if (!perLearner.has(p.learningPathId)) perLearner.set(p.learningPathId, new Map())
    const learners = perLearner.get(p.learningPathId)!
    const entry = learners.get(p.learnerId) ?? { done: 0, last: new Date(0), active: false }
    if (p.completedAt >= from) entry.active = true
    if (mandatoryByPath.get(p.learningPathId)?.has(p.learningPathItemId)) {
      entry.done += 1
      if (p.completedAt > entry.last) entry.last = p.completedAt
    }
    learners.set(p.learnerId, entry)
  }

  const activeLearners = new Map<string, number>()
  const completions = new Map<string, number>()
  perLearner.forEach((learners, pathId) => {
    const required = mandatoryByPath.get(pathId)?.size ?? 0
    learners.forEach((entry) => {
      if (entry.active) increment(activeLearners, pathId)
      if (required > 0 && entry.done >= required && entry.last >= from) increment(completions, pathId)
    })
  })

  return { activeLearners, completions }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getReport(range: ReportRange): Promise<Report> {
  const from = rangeStart(range)
  const bucket = rangeBucket(range)
  const contentSelect = { id: true, title: true, status: true, viewCount: true } as const

  const [
    trackingSince,
    totals,
    events,
    pathProgress,
    leadGroups,
    attemptGroups,
    badges,
    courses,
    templates,
    videos,
    learningPaths,
  ] = await Promise.all([
    getTrackingSince(),
    getEventTotals(from),
    getEventsByItem(from),
    getPathProgress(from),
    prisma.gateSubmission.groupBy({
      by: ['contentId'],
      where: { createdAt: { gte: from } },
      _count: { _all: true },
    }),
    prisma.attempt.groupBy({
      by: ['courseId', 'status'],
      where: { createdAt: { gte: from } },
      _count: { _all: true },
    }),
    prisma.credlyBadgeIssuance.findMany({
      where: { issuedAt: { gte: from } },
      select: { courseId: true, learningPathId: true },
    }),
    prisma.course.findMany({ select: contentSelect }),
    prisma.template.findMany({ select: contentSelect }),
    prisma.video.findMany({ select: contentSelect }),
    prisma.learningPath.findMany({ select: contentSelect }),
  ])

  const trend = await getTrend(from, bucket, trackingSince)

  const leads = new Map(leadGroups.map((g) => [g.contentId, g._count._all]))

  // Course starts = attempts begun in range; completions = those attempts that finished
  const starts = new Map<string, number>()
  const completions = new Map<string, number>()
  for (const g of attemptGroups) {
    increment(starts, g.courseId, g._count._all)
    if (COMPLETED_STATUSES.has(g.status)) increment(completions, g.courseId, g._count._all)
  }

  const badgesByItem = new Map<string, number>()
  for (const b of badges) {
    const key = b.learningPathId ?? b.courseId
    if (key) increment(badgesByItem, key)
  }

  function baseRow(item: (typeof courses)[number], type: ContentType): ItemReportRow {
    return {
      id: item.id,
      type,
      title: item.title,
      status: item.status,
      views: events.views.get(item.id) ?? 0,
      visitors: events.visitors.get(item.id) ?? 0,
      allTimeViews: item.viewCount,
      leads: leads.get(item.id) ?? 0,
      downloads: null,
      starts: null,
      completions: null,
      badges: null,
    }
  }

  const items: ItemReportRow[] = [
    ...courses.map((c) => ({
      ...baseRow(c, 'COURSE'),
      starts: starts.get(c.id) ?? 0,
      completions: completions.get(c.id) ?? 0,
      badges: badgesByItem.get(c.id) ?? 0,
    })),
    ...templates.map((t) => ({ ...baseRow(t, 'TEMPLATE'), downloads: events.downloads.get(t.id) ?? 0 })),
    ...videos.map((v) => baseRow(v, 'VIDEO')),
    ...learningPaths.map((lp) => baseRow(lp, 'LEARNING_PATH')),
  ]

  const paths: PathReportRow[] = learningPaths.map((lp) => ({
    id: lp.id,
    title: lp.title,
    status: lp.status,
    views: events.views.get(lp.id) ?? 0,
    enrolled: events.enrolments.get(lp.id) ?? 0,
    activeLearners: pathProgress.activeLearners.get(lp.id) ?? 0,
    completions: pathProgress.completions.get(lp.id) ?? 0,
    badges: badgesByItem.get(lp.id) ?? 0,
  }))

  const sum = (values: Iterable<number>) => Array.from(values).reduce((a, b) => a + b, 0)

  return {
    range,
    from,
    bucket,
    trackingSince,
    overview: {
      visitors: totals.visitors,
      pageViews: totals.views,
      leads: sum(leads.values()),
      courseStarts: sum(starts.values()),
      courseCompletions: sum(completions.values()),
      templateDownloads: totals.downloads,
      pathEnrolments: sum(events.enrolments.values()),
      pathCompletions: sum(pathProgress.completions.values()),
      badgesIssued: badges.length,
    },
    trend,
    items,
    paths,
  }
}

/** Gate form submissions in range, newest first, with the item they unlocked. */
export async function getLeads(range: ReportRange): Promise<LeadRow[]> {
  const from = rangeStart(range)
  const submissions = await prisma.gateSubmission.findMany({
    where: { createdAt: { gte: from } },
    orderBy: { createdAt: 'desc' },
  })

  const idsByType = (type: ContentType) =>
    Array.from(new Set(submissions.filter((s) => s.contentType === type).map((s) => s.contentId)))
  const titleSelect = { id: true, title: true } as const

  const [courses, templates, videos, learningPaths] = await Promise.all([
    prisma.course.findMany({ where: { id: { in: idsByType('COURSE') } }, select: titleSelect }),
    prisma.template.findMany({ where: { id: { in: idsByType('TEMPLATE') } }, select: titleSelect }),
    prisma.video.findMany({ where: { id: { in: idsByType('VIDEO') } }, select: titleSelect }),
    prisma.learningPath.findMany({ where: { id: { in: idsByType('LEARNING_PATH') } }, select: titleSelect }),
  ])
  const titles = new Map([...courses, ...templates, ...videos, ...learningPaths].map((c) => [c.id, c.title]))

  return submissions.map((s) => ({
    submittedAt: s.createdAt,
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    organization: s.organization,
    jobTitle: s.jobTitle,
    contentType: s.contentType,
    contentTitle: titles.get(s.contentId) ?? '(deleted item)',
  }))
}
