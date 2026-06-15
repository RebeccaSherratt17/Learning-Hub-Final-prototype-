export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import type { ContentItem } from '@/types/content'
import { ResourceLibrary } from '@/components/hub/ResourceLibrary'
import { FooterCTASection } from '@/components/hub/FooterCTASection'
import { buildCollectionPageJsonLd } from '@/lib/jsonld'
import {
  toCourseItem,
  toTemplateItem,
  toVideoItem,
  toLearningPathItem,
  taxonomyInclude,
  publishedFilter,
} from '@/lib/content'

export function generateMetadata(): Metadata {
  return {
    title: 'Resource Library | Diligent Learning Hub',
    description:
      'Explore educational courses, ready-to-use templates, and videos to develop your expertise and enhance board effectiveness across key governance, risk, and compliance topics.',
  }
}

function fetchCourses() {
  return prisma.course.findMany({
    where: { ...publishedFilter, restricted: false },
    include: taxonomyInclude,
    orderBy: { publishedAt: 'desc' },
  })
}

function fetchTemplates() {
  return prisma.template.findMany({
    where: { ...publishedFilter, restricted: false },
    include: taxonomyInclude,
    orderBy: { publishedAt: 'desc' },
  })
}

function fetchVideos() {
  return prisma.video.findMany({
    where: { ...publishedFilter, restricted: false },
    include: taxonomyInclude,
    orderBy: { publishedAt: 'desc' },
  })
}

function fetchLearningPaths() {
  return prisma.learningPath.findMany({
    where: { ...publishedFilter, restricted: false },
    include: taxonomyInclude,
    orderBy: { publishedAt: 'desc' },
  })
}

export default async function LibraryPage() {
  const [
    settings,
    courses,
    templates,
    videos,
    learningPaths,
    personas,
    regions,
    subjectsWithGroups,
  ] = await Promise.all([
    prisma.hubSettings.findFirst(),
    fetchCourses(),
    fetchTemplates(),
    fetchVideos(),
    fetchLearningPaths(),
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

  const collectionJsonLd = buildCollectionPageJsonLd(settings?.librarySectionBody)

  return (
    <>
      {/* Section 1: Full Resource Library */}
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

      {/* Section 2: Footer CTA */}
      <FooterCTASection
        heading={settings?.footerHeading ?? null}
        body={settings?.footerBody ?? null}
        ctaText={settings?.footerCTAText ?? null}
        email={settings?.footerEmail ?? null}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
    </>
  )
}
