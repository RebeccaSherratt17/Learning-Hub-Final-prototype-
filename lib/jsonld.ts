/**
 * Shared JSON-LD structured data builders.
 *
 * Each function returns a plain object ready for JSON.stringify.
 * Fields set to `undefined` are automatically stripped by JSON.stringify.
 */

import { stripHtmlTags } from '@/lib/admin/metadataHealth'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://learning-hub-final-prototype-3zio4xt7t.vercel.app'

// ---------------------------------------------------------------------------
// Shared fragments
// ---------------------------------------------------------------------------

export function buildOrganizationJsonLd() {
  return {
    '@type': 'Organization' as const,
    name: 'Diligent',
    url: 'https://www.diligent.com',
  }
}

function cleanDescription(html: string | null | undefined): string | undefined {
  if (!html) return undefined
  const text = stripHtmlTags(html).trim()
  return text || undefined
}

// ---------------------------------------------------------------------------
// Content detail pages
// ---------------------------------------------------------------------------

interface CourseJsonLdInput {
  title: string
  description: string | null
  thumbnailUrl: string | null
  publishedAt: Date | null
  estimatedDuration: string | null
}

export function buildCourseJsonLd(course: CourseJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: cleanDescription(course.description),
    ...(course.thumbnailUrl ? { image: course.thumbnailUrl } : {}),
    ...(course.publishedAt ? { datePublished: course.publishedAt.toISOString() } : {}),
    ...(course.estimatedDuration ? { timeRequired: course.estimatedDuration } : {}),
    provider: buildOrganizationJsonLd(),
    inLanguage: 'en',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/OnlineOnly',
    },
  }
}

interface TemplateJsonLdInput {
  title: string
  description: string | null
  thumbnailUrl: string | null
  publishedAt: Date | null
  fileType: string | null
}

export function buildTemplateJsonLd(template: TemplateJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: template.title,
    description: cleanDescription(template.description),
    ...(template.thumbnailUrl ? { image: template.thumbnailUrl } : {}),
    ...(template.publishedAt ? { datePublished: template.publishedAt.toISOString() } : {}),
    ...(template.fileType ? { encodingFormat: template.fileType } : {}),
    provider: buildOrganizationJsonLd(),
  }
}

interface VideoJsonLdInput {
  title: string
  description: string | null
  thumbnailUrl: string | null
  publishedAt: Date | null
  duration: string | null
  vidyardUrl: string | null
}

export function buildVideoJsonLd(video: VideoJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: cleanDescription(video.description),
    ...(video.thumbnailUrl ? { thumbnailUrl: video.thumbnailUrl } : {}),
    ...(video.publishedAt ? { uploadDate: video.publishedAt.toISOString() } : {}),
    ...(video.duration ? { duration: video.duration } : {}),
    ...(video.vidyardUrl ? { embedUrl: video.vidyardUrl } : {}),
    provider: buildOrganizationJsonLd(),
    inLanguage: 'en',
  }
}

interface LearningPathItem {
  contentType: string | null
  contentId: string | null
  milestoneTitle: string | null
}

interface LearningPathJsonLdInput {
  title: string
  description: string | null
  thumbnailUrl: string | null
  publishedAt: Date | null
  estimatedCompletionTime: string | null
  items: LearningPathItem[]
  /** Map of content ID → title, built from resolved item content */
  itemTitles: Map<string, string>
}

const lpTypeMap: Record<string, string> = {
  COURSE: 'Course',
  TEMPLATE: 'DigitalDocument',
  VIDEO: 'VideoObject',
  LEARNING_PATH: 'Course',
}

export function buildLearningPathJsonLd(lp: LearningPathJsonLdInput) {
  const contentItems = lp.items.filter((i) => !i.milestoneTitle && i.contentId)
  const hasPart = contentItems
    .map((item) => {
      const name = item.contentId ? lp.itemTitles.get(item.contentId) : undefined
      if (!name) return null
      return {
        '@type': lpTypeMap[item.contentType ?? ''] ?? 'CreativeWork',
        name,
      }
    })
    .filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: lp.title,
    description: cleanDescription(lp.description),
    ...(lp.thumbnailUrl ? { image: lp.thumbnailUrl } : {}),
    ...(lp.publishedAt ? { datePublished: lp.publishedAt.toISOString() } : {}),
    ...(lp.estimatedCompletionTime ? { timeRequired: lp.estimatedCompletionTime } : {}),
    numberOfCredits: contentItems.length,
    ...(hasPart.length > 0 ? { hasPart } : {}),
    provider: buildOrganizationJsonLd(),
    inLanguage: 'en',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }
}

// ---------------------------------------------------------------------------
// Site-level pages
// ---------------------------------------------------------------------------

export function buildWebsiteJsonLd(description?: string | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Diligent Learning Hub',
    url: SITE_URL,
    ...(description ? { description: stripHtmlTags(description).trim() } : {}),
    publisher: buildOrganizationJsonLd(),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/library?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildCollectionPageJsonLd(description?: string | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Resource Library — Diligent Learning Hub',
    url: `${SITE_URL}/library`,
    ...(description ? { description: stripHtmlTags(description).trim() } : {}),
    publisher: buildOrganizationJsonLd(),
  }
}

// ---------------------------------------------------------------------------
// Breadcrumb
// ---------------------------------------------------------------------------

interface BreadcrumbItem {
  name: string
  url: string
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
