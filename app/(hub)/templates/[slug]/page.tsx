export const dynamic = 'force-dynamic'

import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { prisma } from '@/lib/db'
import { ContentStatus } from '@/lib/generated/prisma'
import { incrementViewCount } from '@/lib/view-count'
import { hasGateSession } from '@/lib/gate-session'
import { Breadcrumb } from '@/components/hub/Breadcrumb'
import { PreviewBanner } from '@/components/hub/PreviewBanner'
import { RelatedItems } from '@/components/hub/RelatedItems'
import GateForm from '@/components/hub/GateForm'
import { Badge } from '@/components/ui/Badge'
import { SafeHtml } from '@/components/hub/SafeHtml'
import { FallbackThumbnail } from '@/components/hub/FallbackThumbnail'

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

const accessTierVariant: Record<string, 'free' | 'gated' | 'premium'> = {
  FREE: 'free',
  GATED: 'gated',
  PREMIUM: 'premium',
}

const accessTierLabel: Record<string, string> = {
  FREE: 'Free',
  GATED: 'Gated',
  PREMIUM: 'Premium',
}

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const template = await prisma.template.findFirst({
    where: { slug: resolvedParams.slug, status: ContentStatus.PUBLISHED },
    select: {
      title: true,
      seoTitle: true,
      seoDescription: true,
      description: true,
      ogImageUrl: true,
    },
  })

  if (!template) return { title: 'Template not found' }

  const title = template.seoTitle || template.title
  const description = template.seoDescription || template.description?.slice(0, 160)

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
  const template = isPreview
    ? await prisma.template.findFirst({
        where: { id: previewToken!.contentId },
        include: TEMPLATE_INCLUDES,
      })
    : await prisma.template.findFirst({
        where: { slug: resolvedParams.slug, status: ContentStatus.PUBLISHED },
        include: TEMPLATE_INCLUDES,
      })

  if (!template) notFound()

  // Fire-and-forget view count (skip for previews)
  if (!isPreview) {
    incrementViewCount('TEMPLATE', template.id)
  }

  // Check gate session
  const gated = await hasGateSession()

  // Collect taxonomy tags
  const tags = [
    ...template.subjects.map((s) => s.subject.name),
    ...template.personas.map((p) => p.persona.name),
    ...template.regions.map((r) => r.region.name),
  ]

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

      <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-12">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Templates', href: '/?type=TEMPLATE' },
            { label: template.title },
          ]}
        />

        {/* Header: thumbnail + title/meta */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-[280px_1fr]">
          {/* Thumbnail */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg sm:w-[280px]">
            {template.thumbnailUrl ? (
              <Image
                src={template.thumbnailUrl}
                alt={template.thumbnailAlt || template.title}
                fill
                className="object-cover"
                sizes="280px"
                priority
              />
            ) : (
              <FallbackThumbnail alt={template.title} />
            )}
          </div>

          {/* Title and metadata */}
          <div className="flex flex-col justify-center">
            {/* Badges */}
            <div className="flex items-center gap-2">
              <Badge variant="template">Template</Badge>
              <Badge variant={accessTierVariant[template.accessTier]}>
                {accessTierLabel[template.accessTier]}
              </Badge>
              {template.fileType && (
                <span className="text-xs font-medium uppercase text-diligent-gray-4">
                  {template.fileType}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="mt-3 text-heading-1 font-bold text-diligent-gray-5">{template.title}</h1>

            {/* Subtitle */}
            <p className="mt-1 text-base text-diligent-gray-4">Never start from scratch</p>
          </div>
        </div>

        {/* Description */}
        {template.description && (
          <div className="mt-4 text-base leading-relaxed text-diligent-gray-4">
            <SafeHtml html={template.description} />
          </div>
        )}

        {/* Taxonomy tags */}
        {tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {tags.map((name) => (
              <span
                key={name}
                className="rounded-full bg-diligent-gray-1 px-3 py-1 text-xs text-diligent-gray-4"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Download / Gate section */}
        <div className="mt-8">
          {template.accessTier === 'FREE' || gated ? (
            <a
              href={template.fileUrl ?? '#'}
              download
              className="inline-flex items-center gap-2 rounded bg-diligent-red px-6 py-3 text-sm font-medium text-white hover:bg-diligent-red-2"
            >
              <span className="material-symbols-sharp text-[20px]">download</span>
              Download template
            </a>
          ) : template.accessTier === 'GATED' ? (
            <GateForm
              contentType="TEMPLATE"
              contentId={template.id}
              downloadUrl={template.fileUrl ?? undefined}
              fromLearningPath={resolvedSearchParams.from as string | undefined}
            />
          ) : (
            <div className="rounded-lg border border-diligent-gray-2 bg-diligent-gray-1 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-diligent-gray-5">Premium content</h2>
              <p className="mt-2 text-sm text-diligent-gray-4">
                This template requires a Diligent One Platform subscription. Get unlimited access to
                our full Education &amp; Templates Library.
              </p>
              <a
                href="#"
                className="mt-4 inline-flex items-center rounded bg-diligent-red px-6 py-3 text-sm font-medium text-white hover:bg-diligent-red-2"
              >
                Request a demo
              </a>
            </div>
          )}
        </div>

        {/* Related items */}
        <RelatedItems sourceType="TEMPLATE" sourceId={template.id} />
      </div>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
