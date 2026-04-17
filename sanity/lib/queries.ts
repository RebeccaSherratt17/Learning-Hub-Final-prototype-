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
  publishedAt,
  archived
`

/** All published, non-archived content items across all 4 content types. */
export const allContentItemsQuery = defineQuery(`
  *[
    _type in ["course", "template", "video", "learningPath"]
    && !(_id in path("drafts.**"))
    && archived != true
    && (_type != "course" || restricted != true)
  ] | order(publishedAt desc) {
    ${cardProjection}
  }
`)

/** The Hub Settings singleton. */
export const hubSettingsQuery = defineQuery(`
  *[_type == "hubSettings"][0]{
    heroHeading,
    heroSubheading,
    heroOverview,
    demoCTAUrl
  }
`)

/** Newest 3 — used by homepage Widget 2 in Phase 3. */
export const newestContentQuery = defineQuery(`
  *[
    _type in ["course", "template", "video", "learningPath"]
    && !(_id in path("drafts.**"))
    && archived != true
    && (_type != "course" || restricted != true)
  ] | order(publishedAt desc)[0...3] {
    ${cardProjection}
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
