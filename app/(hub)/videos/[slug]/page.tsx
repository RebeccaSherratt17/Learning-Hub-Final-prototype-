export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { prisma } from '@/lib/db'
import { ContentStatus } from '@/lib/generated/prisma'
import { incrementViewCount } from '@/lib/view-count'
import { hasGateSession } from '@/lib/gate-session'
import { Breadcrumb } from '@/components/hub/Breadcrumb'
import { PreviewBanner } from '@/components/hub/PreviewBanner'
import { RelatedItems } from '@/components/hub/RelatedItems'
import { SafeHtml } from '@/components/hub/SafeHtml'
import { ShareButtons } from '@/components/hub/ShareButtons'
import { GateProvider } from '@/components/hub/GateContext'
import { VideoRightColumn } from '@/components/hub/VideoRightColumn'
import { GatedPrompt } from '@/components/hub/GatedPrompt'

const VIDEO_INCLUDES = {
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
  const video = await prisma.video.findFirst({
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

  if (!video) return { title: 'Video not found' }

  const title = video.seoTitle || video.title
  const description = video.seoDescription || video.description?.slice(0, 160)
  const image = video.ogImageUrl || video.thumbnailUrl

  return {
    title,
    description,
    openGraph: {
      title,
      description: description ?? undefined,
      type: 'video.other',
      ...(image ? { images: [{ url: image }] } : {}),
    },
  }
}

export default async function VideoPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  // Preview support
  const previewToken = resolvedSearchParams.preview
    ? await prisma.previewToken.findFirst({
        where: {
          token: resolvedSearchParams.preview as string,
          contentType: 'VIDEO',
          expiresAt: { gt: new Date() },
        },
      })
    : null

  const isPreview = !!previewToken

  // Fetch video
  const video = isPreview
    ? await prisma.video.findFirst({
        where: { id: previewToken!.contentId },
        include: VIDEO_INCLUDES,
      })
    : await prisma.video.findFirst({
        where: { slug: resolvedParams.slug, status: ContentStatus.PUBLISHED },
        include: VIDEO_INCLUDES,
      })

  if (!video) notFound()

  // Fire-and-forget view count (skip for previews)
  if (!isPreview) {
    incrementViewCount('VIDEO', video.id)
  }

  // Check gate session
  const gated = await hasGateSession()

  // Derived data
  const { main: titleMain, accent: titleAccent } = splitTitleForAccent(video.title)
  const publishedLabel = video.publishedAt
    ? new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(video.publishedAt)
    : null

  // JSON-LD structured data (VideoObject)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description ?? undefined,
    ...(video.thumbnailUrl ? { thumbnailUrl: video.thumbnailUrl } : {}),
    ...(video.publishedAt ? { uploadDate: video.publishedAt.toISOString() } : {}),
    ...(video.duration ? { duration: video.duration } : {}),
  }

  return (
    <>
      {isPreview && <PreviewBanner />}

      <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-12 lg:py-16">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Videos', href: '/?type=VIDEO' },
            { label: video.title },
          ]}
        />

        {/* Two-column layout */}
        <GateProvider initialGated={video.accessTier === 'FREE' || gated}>
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[45%_55%]">
            {/* ── Left column ── */}
            <div>
              {/* Metadata row */}
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-diligent-gray-4">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-diligent-red" aria-hidden="true" />
                <span>Video</span>
                <span className="text-diligent-gray-3" aria-hidden="true">|</span>
                <span>{accessTierDisplay[video.accessTier] ?? video.accessTier}</span>
              </div>

              {/* Title */}
              <h1 className="mt-5 text-[2.25rem] font-bold leading-[1.15] text-diligent-gray-5 sm:text-[2.75rem] lg:text-[3.25rem]">
                {titleMain && <>{titleMain}{' '}</>}
                <span className="text-diligent-red">{titleAccent}</span>
              </h1>

              {/* Description */}
              {video.description && (
                <div className="mt-5 text-base leading-relaxed text-diligent-gray-5">
                  <SafeHtml html={video.description} />
                </div>
              )}

              {/* Access prompt for gated content */}
              {video.accessTier === 'GATED' && (
                <div className="mt-6">
                  <GatedPrompt label="Complete the form to watch this video" />
                </div>
              )}

              {/* Premium CTA */}
              {video.accessTier === 'PREMIUM' && (
                <div className="mt-6 rounded-lg border border-diligent-gray-2 bg-diligent-gray-1 p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-diligent-gray-5">Premium content</h2>
                  <p className="mt-2 text-sm text-diligent-gray-4">
                    This video requires a Diligent One Platform subscription. Get unlimited access
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

              {/* Video metadata row */}
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-diligent-gray-4">
                {video.duration && (
                  <>
                    <span className="material-symbols-sharp text-[16px]">schedule</span>
                    <span>{video.duration}</span>
                  </>
                )}
                {publishedLabel && (
                  <>
                    {video.duration && <span aria-hidden="true">|</span>}
                    <span>Published {publishedLabel}</span>
                  </>
                )}
              </div>

              {/* Taxonomy tags */}
              {(video.subjects.length > 0 || video.personas.length > 0 || video.regions.length > 0) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {video.subjects.map((s) => (
                    <a
                      key={`subject-${s.subject.id}`}
                      href={`/library?subject=${s.subject.id}`}
                      className="rounded border border-diligent-gray-2 px-2.5 py-1 text-xs text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
                    >
                      {s.subject.name}
                    </a>
                  ))}
                  {video.regions.map((r) => (
                    <a
                      key={`region-${r.region.id}`}
                      href={`/library?region=${r.region.id}`}
                      className="rounded border border-diligent-gray-2 px-2.5 py-1 text-xs text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
                    >
                      {r.region.name}
                    </a>
                  ))}
                  {video.personas.map((p) => (
                    <a
                      key={`persona-${p.persona.id}`}
                      href={`/library?persona=${p.persona.id}`}
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
                <ShareButtons title={video.title} path={`/videos/${video.slug}`} />
              </div>
            </div>

            {/* ── Right column: gate form or Vidyard player ── */}
            <VideoRightColumn
              accessTier={video.accessTier}
              contentId={video.id}
              vidyardUrl={video.vidyardUrl ?? undefined}
              thumbnailAlt={video.thumbnailAlt ?? video.title}
            />
          </div>
        </GateProvider>

        {/* Related items */}
        <RelatedItems sourceType="VIDEO" sourceId={video.id} />
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
              Watch, learn and lead with confidence.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85">
              Explore expert-led video content from our premium Education &amp; Templates Library to strengthen your governance, risk and compliance knowledge.
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

