import { ContentWidget } from '@/components/hub/ContentWidget'
import type { ContentItem } from '@/types/content'

interface PopularFeaturedSectionProps {
  heading: string | null
  popularItems: ContentItem[]
  newestItems: ContentItem[]
}

export function PopularFeaturedSection({
  heading,
  popularItems,
  newestItems,
}: PopularFeaturedSectionProps) {
  if (popularItems.length === 0 && newestItems.length === 0) return null

  return (
    <section className="bg-diligent-gray-1 py-16">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <h2 className="mb-8 text-heading-1 font-bold text-diligent-gray-5">
          {heading ?? 'Jump in: Popular and featured content'}
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <ContentWidget title="Most popular" items={popularItems} />
          <ContentWidget title="Newest" items={newestItems} />
        </div>
      </div>
    </section>
  )
}
