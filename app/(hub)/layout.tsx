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
        <SiteHeader subjectGroups={subjectGroups} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CookieConsentBanner />
      </div>
    </CookieConsentProvider>
  )
}
