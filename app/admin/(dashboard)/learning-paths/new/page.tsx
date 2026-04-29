import Link from 'next/link'
import { prisma } from '@/lib/db'
import LearningPathForm from '@/components/admin/LearningPathForm'

export default async function NewLearningPathPage() {
  const [personas, regions, subjects] = await Promise.all([
    prisma.persona.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.region.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.subject.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, group: { select: { id: true, name: true } } },
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/learning-paths"
          className="inline-flex items-center gap-1 text-sm text-diligent-gray-4 hover:text-diligent-gray-5"
        >
          <span className="material-symbols-sharp text-[18px]">arrow_back</span>
          Back to learning paths
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-diligent-gray-5">Create learning path</h1>
      </div>

      <LearningPathForm
        personas={personas}
        regions={regions}
        subjects={subjects}
      />
    </div>
  )
}
