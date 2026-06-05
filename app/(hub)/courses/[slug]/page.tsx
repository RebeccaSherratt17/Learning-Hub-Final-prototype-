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
import { CourseRightColumn } from '@/components/hub/CourseRightColumn'
import { GatedPrompt } from '@/components/hub/GatedPrompt'

const COURSE_INCLUDES = {
  author: true,
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
  const [course, settings] = await Promise.all([
    prisma.course.findFirst({
      where: { slug: resolvedParams.slug, status: ContentStatus.PUBLISHED },
      select: {
        title: true,
        seoTitle: true,
        seoDescription: true,
        description: true,
        ogImageUrl: true,
        thumbnailUrl: true,
      },
    }),
    prisma.hubSettings.findFirst({
      select: { defaultSeoTitle: true, defaultSeoDescription: true },
    }),
  ])

  if (!course) return { title: 'Course not found' }

  const title = course.seoTitle || course.title || settings?.defaultSeoTitle || undefined
  const description = course.seoDescription || course.description?.slice(0, 160) || settings?.defaultSeoDescription || undefined
  const image = course.ogImageUrl || course.thumbnailUrl

  return {
    title,
    description,
    openGraph: {
      title,
      description: description ?? undefined,
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
  }
}

export default async function CoursePage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  // Token-based access for restricted courses
  const tokenParam = resolvedSearchParams.token as string | undefined

  // Preview support
  const previewToken = resolvedSearchParams.preview
    ? await prisma.previewToken.findFirst({
        where: {
          token: resolvedSearchParams.preview as string,
          contentType: 'COURSE',
          expiresAt: { gt: new Date() },
        },
      })
    : null

  const isPreview = !!previewToken

  // Fetch course
  let course
  if (isPreview) {
    course = await prisma.course.findFirst({
      where: { id: previewToken!.contentId },
      include: COURSE_INCLUDES,
    })
  } else if (tokenParam) {
    // Restricted course: validate token
    course = await prisma.course.findFirst({
      where: {
        slug: resolvedParams.slug,
        restricted: true,
        accessToken: tokenParam,
      },
      include: COURSE_INCLUDES,
    })
    if (!course) {
      return (
        <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-24 text-center">
          <span className="material-symbols-sharp text-[48px] text-diligent-gray-3">link_off</span>
          <h1 className="mt-4 text-2xl font-bold text-diligent-gray-5">This link is not valid</h1>
          <p className="mt-2 text-sm text-diligent-gray-4">
            The access link you followed is invalid or has been revoked. Please contact the person who shared it with you.
          </p>
        </div>
      )
    }
  } else {
    course = await prisma.course.findFirst({
      where: {
        slug: resolvedParams.slug,
        status: ContentStatus.PUBLISHED,
        restricted: false,
      },
      include: COURSE_INCLUDES,
    })
  }

  if (!course) notFound()

  // Fire-and-forget view count (skip for previews)
  if (!isPreview) {
    incrementViewCount('COURSE', course.id)
  }

  // Check gate session
  const gated = await hasGateSession()

  // Derived data
  const { main: titleMain, accent: titleAccent } = splitTitleForAccent(course.title)
  const publishedLabel = course.publishedAt
    ? new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(course.publishedAt)
    : null

  // JSON-LD (Course schema)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description ?? undefined,
    ...(course.thumbnailUrl ? { image: course.thumbnailUrl } : {}),
    ...(course.publishedAt ? { datePublished: course.publishedAt.toISOString() } : {}),
    ...(course.author ? { provider: { '@type': 'Organization', name: course.author.name } } : {}),
    ...(course.estimatedDuration ? { timeRequired: course.estimatedDuration } : {}),
  }

  return (
    <>
      {isPreview && <PreviewBanner />}

      <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-12 lg:py-16">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Courses', href: '/?type=COURSE' },
            { label: course.title },
          ]}
        />

        <GateProvider initialGated={course.accessTier === 'FREE' || gated}>
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[45%_55%]">
            {/* Left column */}
            <div>
              {/* Metadata row */}
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-diligent-gray-4">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-diligent-red" aria-hidden="true" />
                <span>Course</span>
                <span className="text-diligent-gray-3" aria-hidden="true">|</span>
                <span>{accessTierDisplay[course.accessTier] ?? course.accessTier}</span>
              </div>

              {/* Title */}
              <h1 className="mt-5 text-[2.25rem] font-bold leading-[1.15] text-diligent-gray-5 sm:text-[2.75rem] lg:text-[3.25rem]">
                {titleMain && <>{titleMain}{' '}</>}
                <span className="text-diligent-red">{titleAccent}</span>
              </h1>

              {/* Description */}
              {course.description && (
                <div className="mt-5 text-base leading-relaxed text-diligent-gray-5">
                  <SafeHtml html={course.description} />
                </div>
              )}

              {/* Access prompt for gated content */}
              {course.accessTier === 'GATED' && (
                <div className="mt-6">
                  <GatedPrompt label="Complete the form to access this course" />
                </div>
              )}

              {/* Premium CTA */}
              {course.accessTier === 'PREMIUM' && (
                <div className="mt-6 rounded-lg border border-diligent-gray-2 bg-diligent-gray-1 p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-diligent-gray-5">Premium content</h2>
                  <p className="mt-2 text-sm text-diligent-gray-4">
                    This course requires a Diligent One Platform subscription. Get unlimited access
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

              <hr className="mt-10 border-diligent-gray-2" />

              {/* Course metadata row */}
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-diligent-gray-4">
                {course.estimatedDuration && (
                  <>
                    <span className="material-symbols-sharp text-[16px]">schedule</span>
                    <span>{course.estimatedDuration}</span>
                  </>
                )}
                {course.author && (
                  <>
                    {course.estimatedDuration && <span aria-hidden="true">|</span>}
                    <span>By {course.author.name}</span>
                  </>
                )}
                {publishedLabel && (
                  <>
                    {(course.estimatedDuration || course.author) && <span aria-hidden="true">|</span>}
                    <span>Published {publishedLabel}</span>
                  </>
                )}
              </div>

              {/* Taxonomy tags */}
              {(course.subjects.length > 0 || course.personas.length > 0 || course.regions.length > 0) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {course.subjects.map((s) => (
                    <a
                      key={`subject-${s.subject.id}`}
                      href={`/library?subject=${s.subject.id}`}
                      className="rounded border border-diligent-gray-2 px-2.5 py-1 text-xs text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
                    >
                      {s.subject.name}
                    </a>
                  ))}
                  {course.regions.map((r) => (
                    <a
                      key={`region-${r.region.id}`}
                      href={`/library?region=${r.region.id}`}
                      className="rounded border border-diligent-gray-2 px-2.5 py-1 text-xs text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
                    >
                      {r.region.name}
                    </a>
                  ))}
                  {course.personas.map((p) => (
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
                <ShareButtons title={course.title} path={`/courses/${course.slug}`} />
              </div>
            </div>

            {/* Right column */}
            <CourseRightColumn
              accessTier={course.accessTier}
              courseId={course.id}
              courseTitle={course.title}
              launchFile={course.launchFile ?? null}
              scormVersion={course.scormVersion ?? null}
            />
          </div>
        </GateProvider>

        <RelatedItems sourceType="COURSE" sourceId={course.id} />
      </div>

      {/* CTA banner */}
      <section className="relative mt-16 overflow-hidden bg-diligent-gray-5">
        <div className="mx-auto flex max-w-[var(--max-content-width)] flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:py-16">
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-diligent-gray-3">
              Diligent&apos;s Education &amp; Templates Library
            </p>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-tight text-white sm:text-[2rem] lg:text-[2.25rem]">
              Master governance, risk and compliance.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85">
              Access targeted short courses from our premium Education &amp; Templates Library to build your expertise and enhance board effectiveness.
            </p>
          </div>
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
        <div className="absolute right-0 top-0 hidden h-full w-3 bg-diligent-red lg:block" aria-hidden="true" />
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
