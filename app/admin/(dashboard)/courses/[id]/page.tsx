import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getRelatedItems } from '@/lib/related-items'
import CourseForm from '@/components/admin/CourseForm'
import RevisionHistory from '@/components/admin/RevisionHistory'

export const dynamic = 'force-dynamic'

export default async function EditCoursePage({
  params,
}: {
  params: { id: string }
}) {
  const [course, personas, regions, subjects] = await Promise.all([
    prisma.course.findUnique({
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

  if (!course) {
    redirect('/admin/courses')
  }

  // Find learning paths that reference this course
  const learningPathItems = await prisma.learningPathItem.findMany({
    where: { contentType: 'COURSE', contentId: course.id },
    include: { learningPath: { select: { id: true, title: true } } },
  })

  const learningPaths = learningPathItems.map((item) => ({
    id: item.learningPath.id,
    title: item.learningPath.title,
  }))

  const relatedItems = await getRelatedItems('COURSE', course.id)

  const courseData = {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    scormCourseId: course.scormCourseId,
    thumbnailUrl: course.thumbnailUrl,
    thumbnailAlt: course.thumbnailAlt,
    ogImageUrl: course.ogImageUrl,
    accessTier: course.accessTier,
    author: course.author,
    publishedAt: course.publishedAt?.toISOString() ?? null,
    scheduledPublishAt: course.scheduledPublishAt?.toISOString() ?? null,
    estimatedDuration: course.estimatedDuration,
    status: course.status,
    restricted: course.restricted,
    accessToken: course.accessToken,
    restrictedNote: course.restrictedNote,
    seoTitle: course.seoTitle,
    seoDescription: course.seoDescription,
    sku: course.sku,
    credlyBadgeId: course.credlyBadgeId,
    personaIds: course.personas.map((cp) => cp.persona.id),
    regionIds: course.regions.map((cr) => cr.region.id),
    subjectIds: course.subjects.map((cs) => cs.subject.id),
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1 text-sm text-diligent-gray-4 hover:text-diligent-gray-5"
        >
          <span className="material-symbols-sharp text-[18px]">arrow_back</span>
          Back to courses
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-diligent-gray-5">Edit course</h1>
      </div>

      <CourseForm
        course={courseData}
        personas={personas}
        regions={regions}
        subjects={subjects}
        learningPaths={learningPaths}
        relatedItems={relatedItems}
      />

      <RevisionHistory contentType="COURSE" contentId={course.id} />
    </div>
  )
}
