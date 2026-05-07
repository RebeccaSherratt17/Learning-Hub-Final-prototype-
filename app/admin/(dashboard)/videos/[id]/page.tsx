import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getRelatedItems } from '@/lib/related-items'
import VideoForm from '@/components/admin/VideoForm'
import RevisionHistory from '@/components/admin/RevisionHistory'

export const dynamic = 'force-dynamic'

export default async function EditVideoPage({
  params,
}: {
  params: { id: string }
}) {
  const [video, personas, regions, subjects] = await Promise.all([
    prisma.video.findUnique({
      where: { id: params.id },
      include: {
        personas: { include: { persona: true } },
        regions: { include: { region: true } },
        subjects: { include: { subject: true } },
      },
    }),
    prisma.persona.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.region.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.subject.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, group: { select: { id: true, name: true } } },
    }),
  ])

  if (!video) {
    redirect('/admin/videos')
  }

  // Find learning paths that reference this video
  const learningPathItems = await prisma.learningPathItem.findMany({
    where: { contentType: 'VIDEO', contentId: video.id },
    include: { learningPath: { select: { id: true, title: true } } },
  })

  const learningPaths = learningPathItems.map((item) => ({
    id: item.learningPath.id,
    title: item.learningPath.title,
  }))

  const relatedItems = await getRelatedItems('VIDEO', video.id)

  const videoData = {
    id: video.id,
    title: video.title,
    slug: video.slug,
    description: video.description,
    vidyardUrl: video.vidyardUrl,
    duration: video.duration,
    thumbnailUrl: video.thumbnailUrl,
    thumbnailAlt: video.thumbnailAlt,
    ogImageUrl: video.ogImageUrl,
    accessTier: video.accessTier,
    publishedAt: video.publishedAt?.toISOString() ?? null,
    scheduledPublishAt: video.scheduledPublishAt?.toISOString() ?? null,
    status: video.status,
    seoTitle: video.seoTitle,
    seoDescription: video.seoDescription,
    sku: video.sku,
    credlyBadgeId: video.credlyBadgeId,
    personaIds: video.personas.map((vp) => vp.persona.id),
    regionIds: video.regions.map((vr) => vr.region.id),
    subjectIds: video.subjects.map((vs) => vs.subject.id),
  }

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
        <h1 className="mt-2 text-2xl font-bold text-diligent-gray-5">Edit video</h1>
      </div>

      <VideoForm
        video={videoData}
        personas={personas}
        regions={regions}
        subjects={subjects}
        learningPaths={learningPaths}
        relatedItems={relatedItems}
      />

      <RevisionHistory contentType="VIDEO" contentId={video.id} />
    </div>
  )
}
