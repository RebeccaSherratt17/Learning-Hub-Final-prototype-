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
import { TemplateShareButtons } from '@/components/hub/TemplateShareButtons'
import { GateProvider } from '@/components/hub/GateContext'
import { TemplateDownloadSection } from '@/components/hub/TemplateDownloadSection'
import { TemplateRightColumn } from '@/components/hub/TemplateRightColumn'

const TEMPLATE_INCLUDES = {
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

const mimeToInfo: Record<string, { label: string; shortLabel: string; extension: string }> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    label: 'Microsoft Word',
    shortLabel: 'DOCX',
    extension: 'docx',
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    label: 'Microsoft Excel',
    shortLabel: 'XLSX',
    extension: 'xlsx',
  },
  'application/pdf': { label: 'PDF Document', shortLabel: 'PDF', extension: 'pdf' },
  'application/msword': { label: 'Microsoft Word', shortLabel: 'DOC', extension: 'doc' },
  'application/vnd.ms-excel': { label: 'Microsoft Excel', shortLabel: 'XLS', extension: 'xls' },
}

const accessTierDisplay: Record<string, string> = {
  FREE: 'Free download',
  GATED: 'Gated download',
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
  const [template, settings] = await Promise.all([
    prisma.template.findFirst({
      where: { slug: resolvedParams.slug, status: ContentStatus.PUBLISHED },
      select: {
        title: true,
        seoTitle: true,
        seoDescription: true,
        description: true,
        ogImageUrl: true,
      },
    }),
    prisma.hubSettings.findFirst({
      select: { defaultSeoTitle: true, defaultSeoDescription: true },
    }),
  ])

  if (!template) return { title: 'Template not found' }

  const title = template.seoTitle || template.title || settings?.defaultSeoTitle || undefined
  const description = template.seoDescription || template.description?.slice(0, 160) || settings?.defaultSeoDescription || undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description: description ?? undefined,
      ...(template.ogImageUrl ? { images: [{ url: template.ogImageUrl }] } : {}),
    },
  }
}

export default async function TemplatePage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  // Token-based access for restricted templates
  const tokenParam = resolvedSearchParams.token as string | undefined

  // Preview support
  const previewToken = resolvedSearchParams.preview
    ? await prisma.previewToken.findFirst({
        where: {
          token: resolvedSearchParams.preview as string,
          contentType: 'TEMPLATE',
          expiresAt: { gt: new Date() },
        },
      })
    : null

  const isPreview = !!previewToken

  // Fetch template
  let template
  if (isPreview) {
    template = await prisma.template.findFirst({
      where: { id: previewToken!.contentId },
      include: TEMPLATE_INCLUDES,
    })
  } else if (tokenParam) {
    // Restricted template: validate token
    template = await prisma.template.findFirst({
      where: {
        slug: resolvedParams.slug,
        restricted: true,
        accessToken: tokenParam,
      },
      include: TEMPLATE_INCLUDES,
    })
    if (!template) {
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
    template = await prisma.template.findFirst({
      where: {
        slug: resolvedParams.slug,
        status: ContentStatus.PUBLISHED,
        restricted: false,
      },
      include: TEMPLATE_INCLUDES,
    })
  }

  if (!template) notFound()

  // Fire-and-forget view count (skip for previews)
  if (!isPreview) {
    incrementViewCount('TEMPLATE', template.id)
  }

  // Check gate session
  const gated = await hasGateSession()

  // Derived data
  const fileInfo = template.fileType ? mimeToInfo[template.fileType] : null
  const { main: titleMain, accent: titleAccent } = splitTitleForAccent(template.title)
  const updatedMonthYear = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
    template.publishedAt ?? template.updatedAt,
  )

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: template.title,
    description: template.description ?? undefined,
    datePublished: template.publishedAt?.toISOString() ?? undefined,
  }

  return (
    <>
      {isPreview && <PreviewBanner />}

      <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-12 lg:py-16">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Templates', href: '/?type=TEMPLATE' },
            { label: template.title },
          ]}
        />

        {/* Two-column layout */}
        <GateProvider initialGated={template.accessTier === 'FREE' || gated}>
        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[55%_45%]">
          {/* ── Left column ── */}
          <div>
            {/* Metadata row */}
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-diligent-gray-4">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-diligent-red" aria-hidden="true" />
              <span>Template</span>
              <span className="text-diligent-gray-3" aria-hidden="true">|</span>
              <span>{accessTierDisplay[template.accessTier] ?? template.accessTier}</span>
            </div>

            {/* Title */}
            <h1 className="mt-5 text-[2.25rem] font-bold leading-[1.15] text-diligent-gray-5 sm:text-[2.75rem] lg:text-[3.25rem]">
              {titleMain && <>{titleMain}{' '}</>}
              <span className="text-diligent-red">{titleAccent}</span>
            </h1>

            {/* Description */}
            {template.description && (
              <div className="mt-5 text-base leading-relaxed text-diligent-gray-5">
                <SafeHtml html={template.description} />
              </div>
            )}

            {/* Legal disclaimer */}
            <p className="mt-5 border-t border-diligent-gray-2 pt-4 text-[13px] italic leading-relaxed text-diligent-gray-4">
              This template is provided in good faith with the intention of furthering the understanding of the subject matter and should not be considered as a substitute for legal advice. The reader is advised to seek legal, financial and other professional advice based on the circumstances of their own situation.
            </p>

            {/* Download / Gate section */}
            <div className="mt-8">
              <TemplateDownloadSection
                accessTier={template.accessTier}
                fileUrl={template.fileUrl ?? undefined}
              />
            </div>

            {/* Divider */}
            <hr className="mt-10 border-diligent-gray-2" />

            {/* File metadata row */}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-diligent-gray-4">
              {fileInfo && <span>{fileInfo.shortLabel}</span>}
              {template.pageCount && (
                <>
                  <span aria-hidden="true">|</span>
                  <span>{template.pageCount} {template.pageCount === 1 ? 'page' : 'pages'}</span>
                </>
              )}
              {template.fileSize && (
                <>
                  <span aria-hidden="true">|</span>
                  <span>{template.fileSize}</span>
                </>
              )}
              <span aria-hidden="true">|</span>
              <span>Updated {updatedMonthYear}</span>
            </div>

            {/* Taxonomy tags */}
            {(template.subjects.length > 0 || template.personas.length > 0 || template.regions.length > 0) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {template.subjects.map((s) => (
                  <a
                    key={`subject-${s.subject.id}`}
                    href={`/library?subject=${s.subject.id}`}
                    className="rounded border border-diligent-gray-2 px-2.5 py-1 text-xs text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
                  >
                    {s.subject.name}
                  </a>
                ))}
                {template.regions.map((r) => (
                  <a
                    key={`region-${r.region.id}`}
                    href={`/library?region=${r.region.id}`}
                    className="rounded border border-diligent-gray-2 px-2.5 py-1 text-xs text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
                  >
                    {r.region.name}
                  </a>
                ))}
                {template.personas.map((p) => (
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
              <TemplateShareButtons title={template.title} slug={template.slug} />
            </div>
          </div>

          {/* ── Right column: gate form or document preview ── */}
          <TemplateRightColumn
            accessTier={template.accessTier}
            contentId={template.id}
            downloadUrl={template.fileUrl ?? undefined}
            fromLearningPath={resolvedSearchParams.from as string | undefined}
          />
        </div>
        </GateProvider>

        {/* Related items */}
        <RelatedItems sourceType="TEMPLATE" sourceId={template.id} />
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
              From blank page to board-ready, faster.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85">
              Join the world&apos;s leading boards and access our full library of ready-to-use templates, expert courses and professionally-accredited certifications.
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
