export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import type { ContentItem } from '@/types/content'
import {
  toCourseItem,
  toTemplateItem,
  toVideoItem,
  toLearningPathItem,
  taxonomyInclude,
  publishedFilter,
} from '@/lib/content'
import { HomepageHero } from '@/components/hub/HomepageHero'
import { HomepageContent } from '@/components/hub/HomepageContent'
import { FooterCTASection } from '@/components/hub/FooterCTASection'

export default async function HubHomePage() {
  const [
    settings,
    courses,
    templates,
    videos,
    learningPaths,
    partners,
    orgTypeSubjects,
    subjectGroupsRaw,
  ] = await Promise.all([
    prisma.hubSettings.findFirst(),
    prisma.course.findMany({
      where: { ...publishedFilter, restricted: false },
      include: taxonomyInclude,
      orderBy: { viewCount: 'desc' },
    }),
    prisma.template.findMany({
      where: publishedFilter,
      include: taxonomyInclude,
      orderBy: { viewCount: 'desc' },
    }),
    prisma.video.findMany({
      where: publishedFilter,
      include: taxonomyInclude,
      orderBy: { viewCount: 'desc' },
    }),
    prisma.learningPath.findMany({
      where: publishedFilter,
      include: taxonomyInclude,
      orderBy: { viewCount: 'desc' },
    }),
    prisma.educationalPartner.findMany({ orderBy: { order: 'asc' } }),
    prisma.subject.findMany({
      where: { group: { slug: 'organization-type' } },
      include: { group: true },
    }),
    prisma.subjectGroup.findMany({
      where: { slug: { not: 'organization-type' } },
      include: { subjects: { orderBy: { name: 'asc' } } },
    }),
  ])

  // Build unified content items from all four content types
  const allItems: ContentItem[] = [
    ...courses.map(toCourseItem),
    ...templates.map(toTemplateItem),
    ...videos.map(toVideoItem),
    ...learningPaths.map(toLearningPathItem),
  ]

  // Determine default org type (prefer public-company, fall back to first)
  const defaultOrgType =
    orgTypeSubjects.find((s) => s.slug === 'public-company') ??
    orgTypeSubjects[0]
  const defaultOrgTypeId = defaultOrgType?.id ?? null

  // Compute org type resource counts
  const orgTypes = orgTypeSubjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    slug: subject.slug,
    count: allItems.filter((item) =>
      item.subjects?.some((s) => s._id === subject.id),
    ).length,
  }))

  // Filter initial items to default org type
  const initialItems = defaultOrgTypeId
    ? allItems.filter((item) =>
        item.subjects?.some((s) => s._id === defaultOrgTypeId),
      )
    : allItems

  // Map subject groups for the content component
  const subjectGroups = subjectGroupsRaw.map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    subjects: g.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
    })),
  }))

  // Map partners for the scroller
  const mappedPartners = partners.map((p) => ({
    _id: p.id,
    name: p.name,
    logoUrl: p.logoUrl,
    logoAlt: p.logoAlt,
    url: p.linkUrl,
  }))

  return (
    <>
      {/* Section 1: Hero / Search */}
      <HomepageHero partners={mappedPartners} />

      {/* Sections 2-4: Org type selector, Popular, Subject groups */}
      <HomepageContent
        orgTypes={orgTypes}
        defaultOrgTypeId={defaultOrgTypeId}
        subjectGroups={subjectGroups}
        initialItems={initialItems}
      />

      {/* Section 5: Footer CTA */}
      <FooterCTASection
        heading={settings?.footerHeading ?? null}
        body={settings?.footerBody ?? null}
        ctaText={settings?.footerCTAText ?? null}
        ctaUrl={settings?.demoCTAUrl ?? null}
      />
    </>
  )
}
