import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getRelatedItems } from '@/lib/related-items'
import TemplateForm from '@/components/admin/TemplateForm'
import PreviewButton from '@/components/admin/PreviewButton'
import RevisionHistory from '@/components/admin/RevisionHistory'

export const dynamic = 'force-dynamic'

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

  const relatedItems = await getRelatedItems('TEMPLATE', template.id)

  const templateData = {
    id: template.id,
    title: template.title,
    slug: template.slug,
    description: template.description,
    fileUrl: template.fileUrl,
    fileName: template.fileName,
    fileType: template.fileType,
    fileSize: template.fileSize,
    pageCount: template.pageCount,
    thumbnailUrl: template.thumbnailUrl,
    thumbnailAlt: template.thumbnailAlt,
    ogImageUrl: template.ogImageUrl,
    ogImageAlt: template.ogImageAlt,
    accessTier: template.accessTier,
    publishedAt: template.publishedAt?.toISOString() ?? null,
    scheduledPublishAt: template.scheduledPublishAt?.toISOString() ?? null,
    status: template.status,
    seoTitle: template.seoTitle,
    seoDescription: template.seoDescription,
    restricted: template.restricted,
    accessToken: template.accessToken,
    restrictedNote: template.restrictedNote,
    sku: template.sku,
    authorId: template.authorId,
    credlyBadgeId: template.credlyBadgeId,
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
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-diligent-gray-5">Edit template</h1>
          {template.status === 'PUBLISHED' && (
            <a
              href={`/templates/${template.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded border border-diligent-gray-2 bg-white px-4 py-2 text-sm font-medium text-diligent-gray-5 hover:border-diligent-gray-3"
            >
              Visit live page
              <span className="material-symbols-sharp text-[18px]">open_in_new</span>
            </a>
          )}
        </div>
      </div>

      <TemplateForm
        template={templateData}
        personas={personas}
        regions={regions}
        subjects={subjects}
        learningPaths={learningPaths}
        relatedItems={relatedItems}
        previewButton={<PreviewButton contentType="TEMPLATE" contentId={template.id} />}
      />

      <RevisionHistory contentType="TEMPLATE" contentId={template.id} />
    </div>
  )
}
