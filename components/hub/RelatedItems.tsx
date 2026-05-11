import { getRelatedContentItems } from '@/lib/related-items'
import { ContentCard } from '@/components/hub/ContentCard'
import type { ContentType } from '@/lib/generated/prisma'

interface RelatedItemsProps {
  sourceType: ContentType
  sourceId: string
}

export async function RelatedItems({ sourceType, sourceId }: RelatedItemsProps) {
  const items = await getRelatedContentItems(sourceType, sourceId)

  if (items.length === 0) return null

  return (
    <section className="mt-16">
      <h2 className="text-heading-2 font-semibold text-diligent-gray-5 mb-6">
        Related content
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ContentCard key={item._id} item={item} />
        ))}
      </div>
    </section>
  )
}
