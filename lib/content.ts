/**
 * Shared content mapping utilities.
 *
 * Converts Prisma query results for courses, templates, videos and learning
 * paths into the unified `ContentItem` interface used by public hub components.
 */

import type { ContentItem, ContentType, AccessTier, DifficultyLevel } from '@/types/content'
import {
  AccessTier as PrismaAccessTier,
  ContentStatus,
  DifficultyLevel as PrismaDifficultyLevel,
} from '@/lib/generated/prisma'

// ---------------------------------------------------------------------------
// Reusable Prisma query fragments
// ---------------------------------------------------------------------------

/** Include clause for taxonomy join tables (subjects with groups, personas, regions). */
export const taxonomyInclude = {
  subjects: { include: { subject: { include: { group: true } } } },
  personas: { include: { persona: true } },
  regions: { include: { region: true } },
} as const

/** Where clause that limits results to published content. */
export const publishedFilter = { status: ContentStatus.PUBLISHED } as const

// ---------------------------------------------------------------------------
// Access tier mapping
// ---------------------------------------------------------------------------

/** Map the Prisma `AccessTier` enum (uppercase) to the lowercase string union. */
export function mapAccessTier(tier: PrismaAccessTier): AccessTier {
  const mapping: Record<PrismaAccessTier, AccessTier> = {
    FREE: 'free',
    GATED: 'gated',
    PREMIUM: 'premium',
  }
  return mapping[tier]
}

// ---------------------------------------------------------------------------
// Base row interface — loose typing so any Prisma result with matching fields
// works without importing specific generated model types.
// ---------------------------------------------------------------------------

interface TaxonomySubjectRow {
  subject: { id: string; name: string; group?: { slug: string } | null }
}

interface TaxonomyPersonaRow {
  persona: { id: string; name: string }
}

interface TaxonomyRegionRow {
  region: { id: string; name: string }
}

interface BaseRow {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  thumbnailAlt: string | null
  accessTier: PrismaAccessTier
  level?: PrismaDifficultyLevel | null
  publishedAt: Date | null
  viewCount: number
  subjects: TaxonomySubjectRow[]
  personas: TaxonomyPersonaRow[]
  regions: TaxonomyRegionRow[]
}

// ---------------------------------------------------------------------------
// Internal mapper — all four public mappers delegate here
// ---------------------------------------------------------------------------

function mapRow(row: BaseRow, type: ContentType): ContentItem {
  return {
    _id: row.id,
    _type: type,
    title: row.title,
    slug: row.slug,
    description: row.description,
    thumbnailUrl: row.thumbnailUrl,
    thumbnailAlt: row.thumbnailAlt,
    accessTier: mapAccessTier(row.accessTier),
    level: (row.level as DifficultyLevel) ?? null,
    subjects: row.subjects.map((s) => ({
      _id: s.subject.id,
      title: s.subject.name,
      group: s.subject.group?.slug ?? null,
    })),
    personas: row.personas.map((p) => ({
      _id: p.persona.id,
      title: p.persona.name,
    })),
    regions: row.regions.map((r) => ({
      _id: r.region.id,
      title: r.region.name,
    })),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    viewCount: row.viewCount,
  }
}

// ---------------------------------------------------------------------------
// Public per-type mappers
// ---------------------------------------------------------------------------

export function toCourseItem(row: BaseRow): ContentItem {
  return mapRow(row, 'course')
}

export function toTemplateItem(row: BaseRow): ContentItem {
  return mapRow(row, 'template')
}

export function toVideoItem(row: BaseRow): ContentItem {
  return mapRow(row, 'video')
}

export function toLearningPathItem(row: BaseRow): ContentItem {
  return mapRow(row, 'learningPath')
}
