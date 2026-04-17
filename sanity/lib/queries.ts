import { defineQuery } from 'next-sanity'

// Projection used by every list/grid so ContentCard consumers get a consistent shape.
const cardProjection = `
  _id,
  _type,
  title,
  "slug": slug.current,
  description,
  thumbnail,
  accessTier,
  "subjects": subjects[]->{ _id, title, group },
  "personas": personas[]->{ _id, title },
  "regions": regions[]->{ _id, title },
  publishedAt,
  archived
`

// Shared content filter — excludes drafts, archived, and restricted courses.
const contentFilter = `
  _type in ["course", "template", "video", "learningPath"]
  && !(_id in path("drafts.**"))
  && archived != true
  && (_type != "course" || restricted != true)
`

/** All published, non-archived content items across all 4 content types. */
export const allContentItemsQuery = defineQuery(`
  *[${contentFilter}] | order(publishedAt desc) {
    ${cardProjection}
  }
`)

/** The Hub Settings singleton — all fields needed by the homepage. */
export const hubSettingsQuery = defineQuery(`
  *[_type == "hubSettings"][0]{
    siteTitle,
    siteDescription,
    demoCTAUrl,
    heroHeading,
    heroSubheading,
    heroOverview,
    popularSectionHeading,
    partnersSectionHeading,
    librarySectionHeading,
    questionsSectionHeading,
    questionsSectionBody,
    certificationsSectionHeading,
    certificationsSectionBody,
    footerHeading,
    footerBody,
    footerCTAText,
    privacyPolicyUrl
  }
`)

/** Newest 3 — homepage Widget 2. */
export const newestContentQuery = defineQuery(`
  *[${contentFilter}] | order(publishedAt desc)[0...3] {
    ${cardProjection}
  }
`)

/** Most popular 3 — homepage Widget 1 (by viewCount). */
export const popularContentQuery = defineQuery(`
  *[${contentFilter}] | order(viewCount desc, publishedAt desc)[0...3] {
    ${cardProjection}
  }
`)

/** Educational partner logos for the homepage scroller. */
export const educationalPartnersQuery = defineQuery(`
  *[_type == "educationalPartner"] | order(order asc) {
    _id,
    name,
    logo,
    url
  }
`)

/** Certification badges for the homepage row. */
export const certificationBadgesQuery = defineQuery(`
  *[_type == "certificationBadge"] | order(order asc) {
    _id,
    title,
    image,
    url
  }
`)

/** All personas — for filter dropdown. */
export const allPersonasQuery = defineQuery(`
  *[_type == "persona"] | order(title asc) {
    _id,
    title
  }
`)

/** All regions — for filter dropdown. */
export const allRegionsQuery = defineQuery(`
  *[_type == "region"] | order(title asc) {
    _id,
    title
  }
`)

/** All subjects — for filter dropdown (grouped). */
export const allSubjectsQuery = defineQuery(`
  *[_type == "subject"] | order(group asc, title asc) {
    _id,
    title,
    group
  }
`)

/** Single course by slug — for Phase 4 course detail page. */
export const courseBySlugQuery = defineQuery(`
  *[_type == "course" && slug.current == $slug && archived != true][0] {
    ${cardProjection},
    scormCourseId,
    estimatedDuration,
    author,
    restricted,
    restrictedAccessNote
  }
`)

/** Single template by slug — for Phase 4 template detail page. */
export const templateBySlugQuery = defineQuery(`
  *[_type == "template" && slug.current == $slug && archived != true][0] {
    ${cardProjection},
    file
  }
`)

/** Single video by slug — for Phase 4 video detail page. */
export const videoBySlugQuery = defineQuery(`
  *[_type == "video" && slug.current == $slug && archived != true][0] {
    ${cardProjection},
    vidyardEmbed,
    duration
  }
`)

/** Single learning path by slug — for Phase 4 learning path page. */
export const learningPathBySlugQuery = defineQuery(`
  *[_type == "learningPath" && slug.current == $slug && archived != true][0] {
    ${cardProjection},
    estimatedCompletionTime,
    credlyBadgeId,
    items[]->{ ${cardProjection} }
  }
`)
