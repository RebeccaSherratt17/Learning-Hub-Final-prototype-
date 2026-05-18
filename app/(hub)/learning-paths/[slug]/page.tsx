export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { prisma } from '@/lib/db'
import { ContentStatus } from '@/lib/generated/prisma'
import { incrementViewCount } from '@/lib/view-count'
import { Breadcrumb } from '@/components/hub/Breadcrumb'
import { PreviewBanner } from '@/components/hub/PreviewBanner'
import { RelatedItems } from '@/components/hub/RelatedItems'
import { SafeHtml } from '@/components/hub/SafeHtml'
import { ShareButtons } from '@/components/hub/ShareButtons'
import {
  LearningPathProgress,
  type LearningPathItemData,
} from '@/components/hub/LearningPathProgress'

const LP_INCLUDES = {
  subjects: {
    select: {
      subject: { select: { id: true, name: true, group: { select: { name: true } } } },
    },
  },
  personas: {
    select: { persona: { select: { id: true, name: true } } },
  },
  regions: {
    select: { region: { select: { id: true, name: true } } },
  },
  items: {
    orderBy: { order: 'asc' as const },
    select: {
      id: true,
      contentType: true,
      contentId: true,
      order: true,
      milestoneTitle: true,
      isElective: true,
    },
  },
} as const

const accessTierDisplay: Record<string, string> = {
  FREE: 'Free',
  GATED: 'Gated',
  PREMIUM: 'Premium content',
}

function splitTitleForAccent(title: string): { main: string; accent: string } {
  const words = title.trim().split(/\s+/)
  if (words.length <= 1) return { main: '', accent: title }
  const accent = words.slice(-1).join(' ')
  const main = words.slice(0, -1).join(' ')
  return { main, accent }
}

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const lp = await prisma.learningPath.findFirst({
    where: { slug: resolvedParams.slug, status: ContentStatus.PUBLISHED },
    select: {
      title: true,
      seoTitle: true,
      seoDescription: true,
      description: true,
      ogImageUrl: true,
      thumbnailUrl: true,
    },
  })

  if (!lp) return { title: 'Learning path not found' }

  const title = lp.seoTitle || lp.title
  const description = lp.seoDescription || lp.description?.slice(0, 160)
  const image = lp.ogImageUrl || lp.thumbnailUrl

  return {
    title,
    description,
    openGraph: {
      title,
      description: description ?? undefined,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  }
}

export default async function LearningPathPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  // Preview support
  const previewToken = resolvedSearchParams.preview
    ? await prisma.previewToken.findFirst({
        where: {
          token: resolvedSearchParams.preview as string,
          contentType: 'LEARNING_PATH',
          expiresAt: { gt: new Date() },
        },
      })
    : null

  const isPreview = !!previewToken

  // Fetch learning path
  const learningPath = isPreview
    ? await prisma.learningPath.findFirst({
        where: { id: previewToken!.contentId },
        include: LP_INCLUDES,
      })
    : await prisma.learningPath.findFirst({
        where: { slug: resolvedParams.slug, status: ContentStatus.PUBLISHED },
        include: LP_INCLUDES,
      })

  if (!learningPath) notFound()

  // Fire-and-forget view count (skip for previews)
  if (!isPreview) {
    incrementViewCount('LEARNING_PATH', learningPath.id)
  }

  // Resolve content details for each non-milestone item
  const itemsWithContent = await resolveItemContent(learningPath.items)

  // Derived data
  const { main: titleMain, accent: titleAccent } = splitTitleForAccent(learningPath.title)
  const contentItems = learningPath.items.filter((i) => !i.milestoneTitle)
  const mandatoryCount = contentItems.filter((i) => !i.isElective).length
  const electiveCount = contentItems.filter((i) => i.isElective).length

  // JSON-LD structured data (Course schema)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: learningPath.title,
    description: learningPath.description ?? undefined,
    ...(learningPath.publishedAt
      ? { datePublished: learningPath.publishedAt.toISOString() }
      : {}),
    ...(learningPath.estimatedCompletionTime
      ? { timeRequired: learningPath.estimatedCompletionTime }
      : {}),
    numberOfCredits: contentItems.length,
    provider: {
      '@type': 'Organization',
      name: 'Diligent',
      url: 'https://www.diligent.com',
    },
  }

  return (
    <>
      {isPreview && <PreviewBanner />}

      <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-12 lg:py-16">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Learning Paths', href: '/?type=LEARNING_PATH' },
            { label: learningPath.title },
          ]}
        />

        {/* Two-column layout */}
        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[55%_45%]">
          {/* ── Left column ── */}
          <div>
            {/* Metadata row */}
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-diligent-gray-4">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-diligent-red" aria-hidden="true" />
              <span>Learning Path</span>
              <span className="text-diligent-gray-3" aria-hidden="true">|</span>
              <span>{accessTierDisplay[learningPath.accessTier] ?? learningPath.accessTier}</span>
            </div>

            {/* Title */}
            <h1 className="mt-5 text-[2.25rem] font-bold leading-[1.15] text-diligent-gray-5 sm:text-[2.75rem] lg:text-[3.25rem]">
              {titleMain && <>{titleMain}{' '}</>}
              <span className="text-diligent-red">{titleAccent}</span>
            </h1>

            {/* Description */}
            {learningPath.description && (
              <div className="mt-5 text-base leading-relaxed text-diligent-gray-5">
                <SafeHtml html={learningPath.description} />
              </div>
            )}

            {/* Premium CTA */}
            {learningPath.accessTier === 'PREMIUM' && (
              <div className="mt-6 rounded-lg border border-diligent-gray-2 bg-diligent-gray-1 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-diligent-gray-5">Premium content</h2>
                <p className="mt-2 text-sm text-diligent-gray-4">
                  This learning path requires a Diligent One Platform subscription. Get unlimited access
                  to our full Education &amp; Templates Library.
                </p>
                <a
                  href="/#footer-cta"
                  className="mt-4 inline-flex items-center rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
                >
                  Request a demo
                </a>
              </div>
            )}

            {/* Divider */}
            <hr className="mt-10 border-diligent-gray-2" />

            {/* Learning path metadata row */}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-diligent-gray-4">
              {learningPath.estimatedCompletionTime && (
                <>
                  <span className="material-symbols-sharp text-[16px]">schedule</span>
                  <span>{learningPath.estimatedCompletionTime}</span>
                  <span aria-hidden="true">|</span>
                </>
              )}
              <span>{contentItems.length} {contentItems.length === 1 ? 'item' : 'items'}</span>
              {mandatoryCount > 0 && (
                <>
                  <span aria-hidden="true">|</span>
                  <span>{mandatoryCount} mandatory</span>
                </>
              )}
              {electiveCount > 0 && (
                <>
                  <span aria-hidden="true">|</span>
                  <span>{electiveCount} elective</span>
                </>
              )}
              {learningPath.credlyBadgeId && (
                <>
                  <span aria-hidden="true">|</span>
                  <span className="material-symbols-sharp text-[16px]">workspace_premium</span>
                  <span>Digital badge on completion</span>
                </>
              )}
            </div>

            {/* Taxonomy tags */}
            {(learningPath.subjects.length > 0 || learningPath.personas.length > 0 || learningPath.regions.length > 0) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {learningPath.subjects.map((s) => (
                  <a
                    key={`subject-${s.subject.id}`}
                    href={`/?subject=${s.subject.id}#resource-library`}
                    className="rounded border border-diligent-gray-2 px-2.5 py-1 text-xs text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
                  >
                    {s.subject.name}
                  </a>
                ))}
                {learningPath.regions.map((r) => (
                  <a
                    key={`region-${r.region.id}`}
                    href={`/?region=${r.region.id}#resource-library`}
                    className="rounded border border-diligent-gray-2 px-2.5 py-1 text-xs text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
                  >
                    {r.region.name}
                  </a>
                ))}
                {learningPath.personas.map((p) => (
                  <a
                    key={`persona-${p.persona.id}`}
                    href={`/?persona=${p.persona.id}#resource-library`}
                    className="rounded border border-diligent-gray-2 px-2.5 py-1 text-xs text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
                  >
                    {p.persona.name}
                  </a>
                ))}
              </div>
            )}

            {/* Share row */}
            <div className="mt-5 flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-diligent-gray-4">
                Share
              </span>
              <ShareButtons title={learningPath.title} path={`/learning-paths/${learningPath.slug}`} />
            </div>
          </div>

          {/* ── Right column: learner identity + progress ── */}
          <div>
            <LearningPathProgress
              learningPathId={learningPath.id}
              learningPathSlug={learningPath.slug}
              items={itemsWithContent}
              accessTier={learningPath.accessTier}
              credlyBadgeId={learningPath.credlyBadgeId}
            />
          </div>
        </div>

        {/* Related items */}
        <RelatedItems sourceType="LEARNING_PATH" sourceId={learningPath.id} />
      </div>

      {/* CTA banner */}
      <section className="relative mt-16 overflow-hidden bg-diligent-gray-5">
        <div className="mx-auto flex max-w-[var(--max-content-width)] flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:py-16">
          {/* Text column */}
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-diligent-gray-3">
              Diligent&apos;s Education &amp; Templates Library
            </p>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-tight text-white sm:text-[2rem] lg:text-[2.25rem]">
              Build your skills, step by step.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85">
              Follow curated learning paths designed by governance experts. Master essential GRC topics with courses, templates and videos — all in one place.
            </p>
          </div>

          {/* CTA column */}
          <div className="shrink-0">
            <a
              href="/#footer-cta"
              className="inline-flex items-center gap-2 rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
            >
              Request a demo
              <span className="text-[18px]" aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        {/* Red accent bar on far right edge */}
        <div className="absolute right-0 top-0 hidden h-full w-3 bg-diligent-red lg:block" aria-hidden="true" />
      </section>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}

// ─────────────────────────────────────────────
// Resolve content details for learning path items
// ─────────────────────────────────────────────

type RawItem = {
  id: string
  contentType: string | null
  contentId: string | null
  order: number
  milestoneTitle: string | null
  isElective: boolean
}

async function resolveItemContent(
  items: RawItem[],
): Promise<LearningPathItemData[]> {
  // Collect IDs by content type
  const courseIds: string[] = []
  const templateIds: string[] = []
  const videoIds: string[] = []
  const lpIds: string[] = []

  for (const item of items) {
    if (item.milestoneTitle || !item.contentType || !item.contentId) continue
    switch (item.contentType) {
      case 'COURSE':
        courseIds.push(item.contentId)
        break
      case 'TEMPLATE':
        templateIds.push(item.contentId)
        break
      case 'VIDEO':
        videoIds.push(item.contentId)
        break
      case 'LEARNING_PATH':
        lpIds.push(item.contentId)
        break
    }
  }

  // Batch-fetch all referenced content
  const [courses, templates, videos, learningPaths] = await Promise.all([
    courseIds.length > 0
      ? prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, title: true, slug: true, thumbnailUrl: true, thumbnailAlt: true },
        })
      : [],
    templateIds.length > 0
      ? prisma.template.findMany({
          where: { id: { in: templateIds } },
          select: { id: true, title: true, slug: true, thumbnailUrl: true, thumbnailAlt: true },
        })
      : [],
    videoIds.length > 0
      ? prisma.video.findMany({
          where: { id: { in: videoIds } },
          select: { id: true, title: true, slug: true, thumbnailUrl: true, thumbnailAlt: true },
        })
      : [],
    lpIds.length > 0
      ? prisma.learningPath.findMany({
          where: { id: { in: lpIds } },
          select: { id: true, title: true, slug: true, thumbnailUrl: true, thumbnailAlt: true },
        })
      : [],
  ])

  // Build lookup maps
  const contentMap = new Map<
    string,
    { title: string; slug: string; thumbnailUrl: string | null; thumbnailAlt: string | null }
  >()
  for (const c of courses) contentMap.set(c.id, c)
  for (const t of templates) contentMap.set(t.id, t)
  for (const v of videos) contentMap.set(v.id, v)
  for (const l of learningPaths) contentMap.set(l.id, l)

  // Map Prisma content types to client content types
  const typeMap: Record<string, 'course' | 'template' | 'video' | 'learningPath'> = {
    COURSE: 'course',
    TEMPLATE: 'template',
    VIDEO: 'video',
    LEARNING_PATH: 'learningPath',
  }

  return items.map((item) => {
    if (item.milestoneTitle) {
      return {
        id: item.id,
        contentType: null,
        contentId: null,
        contentTitle: null,
        contentSlug: null,
        contentThumbnailUrl: null,
        contentThumbnailAlt: null,
        order: item.order,
        milestoneTitle: item.milestoneTitle,
        isElective: item.isElective,
      }
    }

    const content = item.contentId ? contentMap.get(item.contentId) : null

    return {
      id: item.id,
      contentType: item.contentType ? typeMap[item.contentType] ?? null : null,
      contentId: item.contentId,
      contentTitle: content?.title ?? null,
      contentSlug: content?.slug ?? null,
      contentThumbnailUrl: content?.thumbnailUrl ?? null,
      contentThumbnailAlt: content?.thumbnailAlt ?? null,
      order: item.order,
      milestoneTitle: null,
      isElective: item.isElective,
    }
  })
}
