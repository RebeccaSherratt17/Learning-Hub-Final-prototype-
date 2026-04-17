import type { AllContentItemsQueryResult } from './sanity.generated'

/**
 * Single content item as returned by the list queries.
 * Use this shape for ContentCard and any list rendering.
 */
export type ContentItem = AllContentItemsQueryResult[number]

export type ContentType = ContentItem['_type']

export const contentTypeLabels: Record<ContentType, string> = {
  course: 'Course',
  template: 'Template',
  video: 'Video',
  learningPath: 'Learning Path',
}

export type AccessTier = 'free' | 'gated' | 'premium'

export const accessTierLabels: Record<AccessTier, string> = {
  free: 'Free',
  gated: 'Gated',
  premium: 'Premium',
}
