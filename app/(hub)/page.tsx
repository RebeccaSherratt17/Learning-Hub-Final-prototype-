import { sanityFetch } from '@/sanity/lib/sanity-fetch'
import {
  hubSettingsQuery,
  popularContentQuery,
  newestContentQuery,
  allContentItemsQuery,
  educationalPartnersQuery,
  certificationBadgesQuery,
  allPersonasQuery,
  allRegionsQuery,
  allSubjectsQuery,
} from '@/sanity/lib/queries'
import type {
  HubSettingsQueryResult,
  PopularContentQueryResult,
  NewestContentQueryResult,
  AllContentItemsQueryResult,
  EducationalPartnersQueryResult,
  CertificationBadgesQueryResult,
  AllPersonasQueryResult,
  AllRegionsQueryResult,
  AllSubjectsQueryResult,
} from '@/types/sanity.generated'
import { HeroSection } from '@/components/hub/HeroSection'
import { PopularFeaturedSection } from '@/components/hub/PopularFeaturedSection'
import { PartnerLogoScroller } from '@/components/hub/PartnerLogoScroller'
import { ResourceLibrary } from '@/components/hub/ResourceLibrary'
import { QuestionsSection } from '@/components/hub/QuestionsSection'
import { CertificationsSection } from '@/components/hub/CertificationsSection'
import { FooterCTASection } from '@/components/hub/FooterCTASection'

export default async function HubHomePage() {
  const [
    settings,
    popularItems,
    newestItems,
    allItems,
    partners,
    badges,
    personas,
    regions,
    subjects,
  ] = await Promise.all([
    sanityFetch<HubSettingsQueryResult>({
      query: hubSettingsQuery,
      tags: ['settings'],
    }),
    sanityFetch<PopularContentQueryResult>({
      query: popularContentQuery,
      tags: ['content'],
    }),
    sanityFetch<NewestContentQueryResult>({
      query: newestContentQuery,
      tags: ['content'],
    }),
    sanityFetch<AllContentItemsQueryResult>({
      query: allContentItemsQuery,
      tags: ['content'],
    }),
    sanityFetch<EducationalPartnersQueryResult>({
      query: educationalPartnersQuery,
      tags: ['partners'],
    }),
    sanityFetch<CertificationBadgesQueryResult>({
      query: certificationBadgesQuery,
      tags: ['badges'],
    }),
    sanityFetch<AllPersonasQueryResult>({
      query: allPersonasQuery,
      tags: ['taxonomy'],
    }),
    sanityFetch<AllRegionsQueryResult>({
      query: allRegionsQuery,
      tags: ['taxonomy'],
    }),
    sanityFetch<AllSubjectsQueryResult>({
      query: allSubjectsQuery,
      tags: ['taxonomy'],
    }),
  ])

  return (
    <>
      {/* Section 1: Hero */}
      <HeroSection
        heading={settings?.heroHeading ?? null}
        subheading={settings?.heroSubheading ?? null}
        overview={settings?.heroOverview ?? null}
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
        partners={partners}
      />

      {/* Section 4: Full Resource Library */}
      <ResourceLibrary
        heading={settings?.librarySectionHeading ?? null}
        items={allItems}
        personas={personas}
        regions={regions}
        subjects={subjects}
      />

      {/* Section 5: Got Questions? */}
      <QuestionsSection
        heading={settings?.questionsSectionHeading ?? null}
        body={settings?.questionsSectionBody ?? null}
      />

      {/* Section 6: Professionally-Accredited Certifications */}
      <CertificationsSection
        heading={settings?.certificationsSectionHeading ?? null}
        body={settings?.certificationsSectionBody ?? null}
        badges={badges}
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
