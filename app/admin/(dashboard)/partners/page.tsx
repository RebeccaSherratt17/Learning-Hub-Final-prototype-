import { prisma } from '@/lib/db'
import PartnersManager from '@/components/admin/PartnersManager'

export default async function PartnersPage() {
  const partners = await prisma.educationalPartner.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 font-bold text-diligent-gray-5">
          Educational partners
        </h1>
        <p className="mt-1 text-diligent-gray-4">
          Manage partner logos displayed on the homepage.
        </p>
      </div>

      <PartnersManager initialPartners={partners} />
    </div>
  )
}
