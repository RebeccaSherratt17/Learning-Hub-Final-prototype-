import type { ContentType } from '@/lib/generated/prisma'

// ---------------------------------------------------------------------------
// Shared metadata-health checks used by both the admin dashboard and
// the content list pages (courses, templates, videos, learning paths).
// ---------------------------------------------------------------------------

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

function isEmpty(val: string | null | undefined): boolean {
  return !val || val.trim() === ''
}

/** Fields available on every content type. */
export interface CommonHealthFields {
  thumbnailUrl: string | null
  ogImageUrl: string | null
  description: string
  sku: string | null
  seoTitle: string | null
  seoDescription: string | null
  subjects: { subject: { group: { slug: string } } }[]
  personas: unknown[]
  regions: unknown[]
  relatedItemCount: number
}

/** Returns human-readable labels for every missing common field. */
function checkCommonFields(item: CommonHealthFields): string[] {
  const issues: string[] = []
  if (isEmpty(item.sku)) issues.push('SKU')
  if (isEmpty(item.thumbnailUrl)) issues.push('thumbnail')
  if (isEmpty(item.ogImageUrl)) issues.push('OG image')
  if (stripHtmlTags(item.description).trim() === '') issues.push('description')
  if (isEmpty(item.seoTitle)) issues.push('meta title')
  if (isEmpty(item.seoDescription)) issues.push('meta description')
  if (item.relatedItemCount < 1) issues.push('related items')
  if (item.personas.length === 0) issues.push('persona tag')
  if (item.regions.length === 0) issues.push('region tag')

  const hasSubjectTag = item.subjects.some(
    (s) => s.subject.group.slug !== 'organization-type',
  )
  if (!hasSubjectTag) issues.push('subject tag')

  const hasOrgType = item.subjects.some(
    (s) => s.subject.group.slug === 'organization-type',
  )
  if (!hasOrgType) issues.push('organization type')

  return issues
}

// ---------------------------------------------------------------------------
// Per-type checkers
// ---------------------------------------------------------------------------

export interface CourseHealthFields extends CommonHealthFields {
  level: string | null
  launchFile: string | null
}

export function checkCourseHealth(item: CourseHealthFields): string[] {
  const issues = checkCommonFields(item)
  if (!item.level) issues.push('level')
  if (isEmpty(item.launchFile)) issues.push('SCORM file')
  return issues
}

export interface TemplateHealthFields extends CommonHealthFields {
  fileUrl: string | null
}

export function checkTemplateHealth(item: TemplateHealthFields): string[] {
  const issues = checkCommonFields(item)
  if (isEmpty(item.fileUrl)) issues.push('template file')
  return issues
}

export interface VideoHealthFields extends CommonHealthFields {
  level: string | null
  vidyardUrl: string | null
  duration: string | null
}

export function checkVideoHealth(item: VideoHealthFields): string[] {
  const issues = checkCommonFields(item)
  if (!item.level) issues.push('level')
  if (isEmpty(item.vidyardUrl)) issues.push('Vidyard ID')
  if (!item.duration || item.duration.trim() === '' || item.duration.trim() === '0') issues.push('duration')
  return issues
}

export interface LearningPathHealthFields extends CommonHealthFields {
  level: string | null
}

export function checkLearningPathHealth(item: LearningPathHealthFields): string[] {
  const issues = checkCommonFields(item)
  if (!item.level) issues.push('level')
  return issues
}

// ---------------------------------------------------------------------------
// Publish-blocking validation — only the fields required before publishing.
// Used by both client-side forms and server-side API routes.
// ---------------------------------------------------------------------------

export { stripHtmlTags, isEmpty }

export interface PublishFieldsCourse {
  title: string
  slug: string
  description: string
  thumbnailUrl: string | null
  ogImageUrl: string | null
  level: string | null
  launchFile: string | null
  hasOrgType: boolean
}

export function validateCoursePublish(item: PublishFieldsCourse): string[] {
  const missing: string[] = []
  if (isEmpty(item.title)) missing.push('Title')
  if (isEmpty(item.slug)) missing.push('Slug')
  if (stripHtmlTags(item.description).trim() === '') missing.push('Description')
  if (isEmpty(item.thumbnailUrl)) missing.push('Thumbnail image')
  if (isEmpty(item.ogImageUrl)) missing.push('Open graph image')
  if (!item.level) missing.push('Level')
  if (!item.hasOrgType) missing.push('Organization type')
  if (isEmpty(item.launchFile)) missing.push('SCORM file')
  return missing
}

export interface PublishFieldsTemplate {
  title: string
  slug: string
  description: string
  fileUrl: string | null
  thumbnailUrl: string | null
  ogImageUrl: string | null
  hasOrgType: boolean
}

export function validateTemplatePublish(item: PublishFieldsTemplate): string[] {
  const missing: string[] = []
  if (isEmpty(item.title)) missing.push('Title')
  if (isEmpty(item.slug)) missing.push('Slug')
  if (stripHtmlTags(item.description).trim() === '') missing.push('Description')
  if (isEmpty(item.fileUrl)) missing.push('Template file')
  if (isEmpty(item.thumbnailUrl)) missing.push('Thumbnail image')
  if (isEmpty(item.ogImageUrl)) missing.push('Open graph image')
  if (!item.hasOrgType) missing.push('Organization type')
  return missing
}

export interface PublishFieldsVideo {
  title: string
  slug: string
  description: string
  vidyardUrl: string | null
  duration: string | null
  thumbnailUrl: string | null
  ogImageUrl: string | null
  level: string | null
  hasOrgType: boolean
}

export function validateVideoPublish(item: PublishFieldsVideo): string[] {
  const missing: string[] = []
  if (isEmpty(item.title)) missing.push('Title')
  if (isEmpty(item.slug)) missing.push('Slug')
  if (stripHtmlTags(item.description).trim() === '') missing.push('Description')
  if (isEmpty(item.vidyardUrl)) missing.push('Vidyard URL/ID')
  if (isEmpty(item.duration)) missing.push('Duration')
  if (isEmpty(item.thumbnailUrl)) missing.push('Thumbnail image')
  if (isEmpty(item.ogImageUrl)) missing.push('Open graph image')
  if (!item.level) missing.push('Level')
  if (!item.hasOrgType) missing.push('Organization type')
  return missing
}

export interface PublishFieldsLearningPath {
  title: string
  slug: string
  description: string
  thumbnailUrl: string | null
  ogImageUrl: string | null
  level: string | null
  hasOrgType: boolean
}

export function validateLearningPathPublish(item: PublishFieldsLearningPath): string[] {
  const missing: string[] = []
  if (isEmpty(item.title)) missing.push('Title')
  if (isEmpty(item.slug)) missing.push('Slug')
  if (stripHtmlTags(item.description).trim() === '') missing.push('Description')
  if (isEmpty(item.thumbnailUrl)) missing.push('Thumbnail image')
  if (isEmpty(item.ogImageUrl)) missing.push('Open graph image')
  if (!item.level) missing.push('Level')
  if (!item.hasOrgType) missing.push('Organization type')
  return missing
}

// ---------------------------------------------------------------------------
// Generic dispatcher — useful when you have a ContentType + item
// ---------------------------------------------------------------------------

export function checkMetadataHealth(
  type: ContentType,
  item: CommonHealthFields & {
    level?: string | null
    launchFile?: string | null
    fileUrl?: string | null
    vidyardUrl?: string | null
    duration?: string | null
  },
): string[] {
  switch (type) {
    case 'COURSE':
      return checkCourseHealth(item as CourseHealthFields)
    case 'TEMPLATE':
      return checkTemplateHealth(item as TemplateHealthFields)
    case 'VIDEO':
      return checkVideoHealth(item as VideoHealthFields)
    case 'LEARNING_PATH':
      return checkLearningPathHealth(item as LearningPathHealthFields)
  }
}
