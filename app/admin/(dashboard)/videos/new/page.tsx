import Link from 'next/link'
import { prisma } from '@/lib/db'
import VideoForm from '@/components/admin/VideoForm'

export default async function NewVideoPage() {
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
          href="/admin/videos"
          className="inline-flex items-center gap-1 text-sm text-diligent-gray-4 hover:text-diligent-gray-5"
        >
          <span className="material-symbols-sharp text-[18px]">arrow_back</span>
          Back to videos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-diligent-gray-5">Create video</h1>
      </div>

      <VideoForm
        personas={personas}
        regions={regions}
        subjects={subjects}
      />
    </div>
  )
}
