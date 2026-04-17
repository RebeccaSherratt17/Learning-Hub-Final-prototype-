import { sanityFetch } from '@/sanity/lib/sanity-fetch'
import { allContentItemsQuery } from '@/sanity/lib/queries'
import type { AllContentItemsQueryResult } from '@/types/sanity.generated'
import { ContentCard } from '@/components/hub/ContentCard'

export default async function HubHomePage() {
  const items = await sanityFetch<AllContentItemsQueryResult>({
    query: allContentItemsQuery,
    tags: ['content'],
  })

  return (
    <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-12">
      <header className="mb-10">
        <h1 className="text-display-1 font-bold text-diligent-gray-5">
          Diligent Learning Hub
        </h1>
        <p className="mt-4 max-w-2xl text-diligent-gray-4">
          Phase 2 demo — this page will be replaced with the full homepage in
          Phase 3. For now, it lists all published content items to verify the
          data + design pipeline.
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-diligent-gray-4">
          No content published yet. Open{' '}
          <a href="/studio" className="font-medium">
            Studio
          </a>{' '}
          and publish at least one item.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item._id}>
              <ContentCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
