import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import TemplateForm from '@/components/admin/TemplateForm'
import RevisionHistory from '@/components/admin/RevisionHistory'

export default async function EditTemplatePage({
  params,
}: {
  params: { id: string }
}) {
  const [template, personas, regions, subjects] = await Promise.all([
    prisma.template.findUnique({
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

  if (!template) {
    redirect('/admin/templates')
  }

  // Find learning paths that reference this template
  const learningPathItems = await prisma.learningPathItem.findMany({
    where: { contentType: 'TEMPLATE', contentId: template.id },
    include: { learningPath: { select: { id: true, title: true } } },
  })

  const learningPaths = learningPathItems.map((item) => ({
    id: item.learningPath.id,
    title: item.learningPath.title,
  }))

  const templateData = {
    id: template.id,
    title: template.title,
    slug: template.slug,
    description: template.description,
    fileUrl: template.fileUrl,
    fileName: template.fileName,
    fileType: template.fileType,
    thumbnailUrl: template.thumbnailUrl,
    thumbnailAlt: template.thumbnailAlt,
    ogImageUrl: template.ogImageUrl,
    accessTier: template.accessTier,
    publishedAt: template.publishedAt?.toISOString() ?? null,
    scheduledPublishAt: template.scheduledPublishAt?.toISOString() ?? null,
    status: template.status,
    seoTitle: template.seoTitle,
    seoDescription: template.seoDescription,
    personaIds: template.personas.map((tp) => tp.persona.id),
    regionIds: template.regions.map((tr) => tr.region.id),
    subjectIds: template.subjects.map((ts) => ts.subject.id),
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/templates"
          className="inline-flex items-center gap-1 text-sm text-diligent-gray-4 hover:text-diligent-gray-5"
        >
          <span className="material-symbols-sharp text-[18px]">arrow_back</span>
          Back to templates
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-diligent-gray-5">Edit template</h1>
      </div>

      <TemplateForm
        template={templateData}
        personas={personas}
        regions={regions}
        subjects={subjects}
        learningPaths={learningPaths}
      />

      <RevisionHistory contentType="TEMPLATE" contentId={template.id} />
    </div>
  )
}
