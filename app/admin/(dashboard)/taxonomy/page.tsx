import { prisma } from '@/lib/db'
import TaxonomyManager from '@/components/admin/TaxonomyManager'

export default async function TaxonomyPage() {
  const [personas, regions, subjectGroups] = await Promise.all([
    prisma.persona.findMany({ orderBy: { name: 'asc' } }),
    prisma.region.findMany({ orderBy: { name: 'asc' } }),
    prisma.subjectGroup.findMany({
      include: {
        subjects: {
          orderBy: { name: 'asc' },
          include: { group: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 font-bold text-diligent-gray-5">
          Taxonomy
        </h1>
        <p className="mt-1 text-diligent-gray-4">
          Manage personas, regions, and subjects used to tag content.
        </p>
      </div>

      <TaxonomyManager
        initialPersonas={personas}
        initialRegions={regions}
        initialSubjectGroups={subjectGroups}
      />
    </div>
  )
}
