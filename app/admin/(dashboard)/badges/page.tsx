import { prisma } from '@/lib/db'
import BadgesManager from '@/components/admin/BadgesManager'

export default async function BadgesPage() {
  const badges = await prisma.certificationBadge.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 font-bold text-diligent-gray-5">
          Certification badges
        </h1>
        <p className="mt-1 text-diligent-gray-4">
          Manage certification badge images and links displayed on the homepage.
        </p>
      </div>

      <BadgesManager initialBadges={badges} />
    </div>
  )
}
