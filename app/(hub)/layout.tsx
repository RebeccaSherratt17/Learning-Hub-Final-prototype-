import { prisma } from '@/lib/db'
import { SiteHeader } from '@/components/hub/SiteHeader'
import { SiteFooter } from '@/components/hub/SiteFooter'
import { CookieConsentProvider } from '@/components/hub/CookieConsentProvider'
import { CookieConsentBanner } from '@/components/hub/CookieConsentBanner'
import { subjectGroupOrder } from '@/components/hub/subjectGroupConfig'

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const subjectGroupsRaw = await prisma.subjectGroup.findMany({
    where: { slug: { not: 'organization-type' } },
    include: { subjects: { select: { id: true }, orderBy: { name: 'asc' } } },
  })

  // Order by the canonical homepage order and map to a minimal shape
  const subjectGroups = subjectGroupOrder
    .map((slug) => subjectGroupsRaw.find((g) => g.slug === slug))
    .filter(Boolean)
    .map((g) => ({
      name: g!.name,
      slug: g!.slug,
      subjectIds: g!.subjects.map((s) => s.id),
    }))

  return (
    <CookieConsentProvider>
      <div className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-diligent-gray-5 focus:rounded focus:shadow-md"
        >
          Skip to main content
        </a>
        <SiteHeader subjectGroups={subjectGroups} />
        <main id="main-content" className="flex-1">{children}</main>
        <SiteFooter />
        <CookieConsentBanner />
      </div>
    </CookieConsentProvider>
  )
}
