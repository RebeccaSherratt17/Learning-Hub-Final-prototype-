/**
 * Standalone content types for the public hub.
 * These mirror the Prisma models but are plain TS interfaces
 * suitable for client components (which cannot import from @prisma/client).
 */

export type ContentType = 'course' | 'template' | 'video' | 'learningPath'

export type AccessTier = 'free' | 'gated' | 'premium'

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export interface TaxonomyRef {
  _id: string
  title: string | null
  group?: string | null
}

/**
 * Unified content item shape used by ContentCard, ResourceLibrary, etc.
 * Each item is normalised into this shape from the four Prisma content models.
 */
export interface ContentItem {
  _id: string
  _type: ContentType
  title: string | null
  slug: string | null
  description: string | null
  thumbnailUrl: string | null
  thumbnailAlt: string | null
  accessTier: AccessTier
  subjects: TaxonomyRef[]
  personas?: TaxonomyRef[]
  regions?: TaxonomyRef[]
  level?: DifficultyLevel | null
  publishedAt: string | null
  viewCount?: number
}

export const contentTypeLabels: Record<ContentType, string> = {
  course: 'Course',
  template: 'Template',
  video: 'Video',
  learningPath: 'Learning Path',
}

export const accessTierLabels: Record<AccessTier, string> = {
  free: 'Free',
  gated: 'Gated',
  premium: 'Premium',
}

export const subjectGroupLabels: Record<string, string> = {
  'board-governance': 'Board Governance',
  'board-meetings-committees': 'Board Meetings & Committees',
  'ai-technology': 'AI & Technology',
  'risk-management': 'Risk Management',
  'compliance-policy': 'Compliance & Policy',
  'governance-professionals': 'Governance Professionals',
  'organization-type': 'Organization Type',
}
