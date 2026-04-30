import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import type { ContentItem, AccessTier } from '@/types/content'
import { HeroSection } from '@/components/hub/HeroSection'
import { PopularFeaturedSection } from '@/components/hub/PopularFeaturedSection'
import { PartnerLogoScroller } from '@/components/hub/PartnerLogoScroller'
import { ResourceLibrary } from '@/components/hub/ResourceLibrary'
import { CertificationsSection } from '@/components/hub/CertificationsSection'
import { FooterCTASection } from '@/components/hub/FooterCTASection'
import {
  AccessTier as PrismaAccessTier,
  ContentStatus,
} from '@/lib/generated/prisma'

/** Map Prisma AccessTier enum to lowercase content type string */
function mapAccessTier(tier: PrismaAccessTier): AccessTier {
  const mapping: Record<PrismaAccessTier, AccessTier> = {
    FREE: 'free',
    GATED: 'gated',
    PREMIUM: 'premium',
  }
  return mapping[tier]
}

/** Map Prisma content type to ContentItem _type */
function toCourseItem(c: Awaited<ReturnType<typeof fetchCourses>>[number]): ContentItem {
  return {
    _id: c.id,
    _type: 'course',
    title: c.title,
    slug: c.slug,
    description: c.description,
    thumbnailUrl: c.thumbnailUrl,
    thumbnailAlt: c.thumbnailAlt,
    accessTier: mapAccessTier(c.accessTier),
    subjects: c.subjects.map((s) => ({
      _id: s.subject.id,
      title: s.subject.name,
      group: s.subject.group?.slug ?? null,
    })),
    personas: c.personas.map((p) => ({
      _id: p.persona.id,
      title: p.persona.name,
    })),
    regions: c.regions.map((r) => ({
      _id: r.region.id,
      title: r.region.name,
    })),
    publishedAt: c.publishedAt?.toISOString() ?? null,
    viewCount: c.viewCount,
  }
}

function toTemplateItem(t: Awaited<ReturnType<typeof fetchTemplates>>[number]): ContentItem {
  return {
    _id: t.id,
    _type: 'template',
    title: t.title,
    slug: t.slug,
    description: t.description,
    thumbnailUrl: t.thumbnailUrl,
    thumbnailAlt: t.thumbnailAlt,
    accessTier: mapAccessTier(t.accessTier),
    subjects: t.subjects.map((s) => ({
      _id: s.subject.id,
      title: s.subject.name,
      group: s.subject.group?.slug ?? null,
    })),
    personas: t.personas.map((p) => ({
      _id: p.persona.id,
      title: p.persona.name,
    })),
    regions: t.regions.map((r) => ({
      _id: r.region.id,
      title: r.region.name,
    })),
    publishedAt: t.publishedAt?.toISOString() ?? null,
    viewCount: t.viewCount,
  }
}

function toVideoItem(v: Awaited<ReturnType<typeof fetchVideos>>[number]): ContentItem {
  return {
    _id: v.id,
    _type: 'video',
    title: v.title,
    slug: v.slug,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    thumbnailAlt: v.thumbnailAlt,
    accessTier: mapAccessTier(v.accessTier),
    subjects: v.subjects.map((s) => ({
      _id: s.subject.id,
      title: s.subject.name,
      group: s.subject.group?.slug ?? null,
    })),
    personas: v.personas.map((p) => ({
      _id: p.persona.id,
      title: p.persona.name,
    })),
    regions: v.regions.map((r) => ({
      _id: r.region.id,
      title: r.region.name,
    })),
    publishedAt: v.publishedAt?.toISOString() ?? null,
    viewCount: v.viewCount,
  }
}

function toLearningPathItem(lp: Awaited<ReturnType<typeof fetchLearningPaths>>[number]): ContentItem {
  return {
    _id: lp.id,
    _type: 'learningPath',
    title: lp.title,
    slug: lp.slug,
    description: lp.description,
    thumbnailUrl: lp.thumbnailUrl,
    thumbnailAlt: lp.thumbnailAlt,
    accessTier: mapAccessTier(lp.accessTier),
    subjects: lp.subjects.map((s) => ({
      _id: s.subject.id,
      title: s.subject.name,
      group: s.subject.group?.slug ?? null,
    })),
    personas: lp.personas.map((p) => ({
      _id: p.persona.id,
      title: p.persona.name,
    })),
    regions: lp.regions.map((r) => ({
      _id: r.region.id,
      title: r.region.name,
    })),
    publishedAt: lp.publishedAt?.toISOString() ?? null,
    viewCount: lp.viewCount,
  }
}

const publishedFilter = { status: ContentStatus.PUBLISHED } as const
const taxonomyInclude = {
  subjects: { include: { subject: { include: { group: true } } } },
  personas: { include: { persona: true } },
  regions: { include: { region: true } },
} as const

function fetchCourses() {
  return prisma.course.findMany({
    where: { ...publishedFilter, restricted: false },
    include: taxonomyInclude,
    orderBy: { publishedAt: 'desc' },
  })
}

function fetchTemplates() {
  return prisma.template.findMany({
    where: publishedFilter,
    include: taxonomyInclude,
    orderBy: { publishedAt: 'desc' },
  })
}

function fetchVideos() {
  return prisma.video.findMany({
    where: publishedFilter,
    include: taxonomyInclude,
    orderBy: { publishedAt: 'desc' },
  })
}

function fetchLearningPaths() {
  return prisma.learningPath.findMany({
    where: publishedFilter,
    include: taxonomyInclude,
    orderBy: { publishedAt: 'desc' },
  })
}

export default async function HubHomePage() {
  const [
    settings,
    courses,
    templates,
    videos,
    learningPaths,
    partners,
    badges,
    personas,
    regions,
    subjectsWithGroups,
  ] = await Promise.all([
    prisma.hubSettings.findFirst(),
    fetchCourses(),
    fetchTemplates(),
    fetchVideos(),
    fetchLearningPaths(),
    prisma.educationalPartner.findMany({ orderBy: { order: 'asc' } }),
    prisma.certificationBadge.findMany({ orderBy: { order: 'asc' } }),
    prisma.persona.findMany({ orderBy: { name: 'asc' } }),
    prisma.region.findMany({ orderBy: { name: 'asc' } }),
    prisma.subject.findMany({
      include: { group: true },
      orderBy: { name: 'asc' },
    }),
  ])

  // Normalise all content into unified ContentItem[]
  const allItems: ContentItem[] = [
    ...courses.map(toCourseItem),
    ...templates.map(toTemplateItem),
    ...videos.map(toVideoItem),
    ...learningPaths.map(toLearningPathItem),
  ]

  // Popular: top 3 by viewCount
  const popularItems = [...allItems]
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, 3)

  // Newest: top 3 by publishedAt
  const newestItems = [...allItems]
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() -
        new Date(a.publishedAt ?? 0).getTime(),
    )
    .slice(0, 3)

  // Map partners
  const mappedPartners = partners.map((p) => ({
    _id: p.id,
    name: p.name,
    logoUrl: p.logoUrl,
    logoAlt: p.logoAlt,
    url: p.linkUrl,
  }))

  // Map badges
  const mappedBadges = badges.map((b) => ({
    _id: b.id,
    title: b.name,
    imageUrl: b.imageUrl,
    imageAlt: b.imageAlt,
    url: b.linkUrl,
  }))

  // Map taxonomy for filters
  const mappedPersonas = personas.map((p) => ({
    _id: p.id,
    title: p.name,
  }))

  const mappedRegions = regions.map((r) => ({
    _id: r.id,
    title: r.name,
  }))

  const mappedSubjects = subjectsWithGroups.map((s) => ({
    _id: s.id,
    title: s.name,
    group: s.group?.slug ?? null,
  }))

  // Compute filter counts from published items
  const filterCounts: Record<string, number> = {}
  for (const item of allItems) {
    const itemWithTax = item as ContentItem & {
      personas?: { _id: string }[]
      regions?: { _id: string }[]
    }
    itemWithTax.personas?.forEach((p) => {
      filterCounts[p._id] = (filterCounts[p._id] ?? 0) + 1
    })
    itemWithTax.regions?.forEach((r) => {
      filterCounts[r._id] = (filterCounts[r._id] ?? 0) + 1
    })
    item.subjects?.forEach((s) => {
      filterCounts[s._id] = (filterCounts[s._id] ?? 0) + 1
    })
  }

  return (
    <>
      {/* Section 1: Hero */}
      <HeroSection
        heading={settings?.heroHeading ?? null}
        subheading={settings?.heroSubheading ?? null}
        overview={settings?.heroOverview ?? null}
        ctaText={settings?.heroCTAText ?? null}
        ctaUrl={settings?.heroCTAUrl ?? null}
      />

      {/* Section 2: Popular & Featured Content */}
      <PopularFeaturedSection
        heading={settings?.popularSectionHeading ?? null}
        popularItems={popularItems}
        newestItems={newestItems}
      />

      {/* Section 3: Educational Partners */}
      <PartnerLogoScroller
        heading={settings?.partnersSectionHeading ?? null}
        partners={mappedPartners}
      />

      {/* Section 4: Full Resource Library */}
      <Suspense fallback={null}>
        <ResourceLibrary
          heading={settings?.librarySectionHeading ?? null}
          body={settings?.librarySectionBody ?? null}
          items={allItems}
          personas={mappedPersonas}
          regions={mappedRegions}
          subjects={mappedSubjects}
          filterCounts={filterCounts}
        />
      </Suspense>

      {/* Section 5: Professionally-Accredited Certifications */}
      <CertificationsSection
        heading={settings?.certificationsSectionHeading ?? null}
        body={settings?.certificationsSectionBody ?? null}
        badges={mappedBadges}
      />

      {/* Section 7: Footer CTA */}
      <FooterCTASection
        heading={settings?.footerHeading ?? null}
        body={settings?.footerBody ?? null}
        ctaText={settings?.footerCTAText ?? null}
        ctaUrl={settings?.demoCTAUrl ?? null}
      />
    </>
  )
}
