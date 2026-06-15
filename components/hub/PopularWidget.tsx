'use client'

import { useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { ContentCard } from '@/components/hub/ContentCard'
import type { ContentItem } from '@/types/content'

export interface PopularWidgetProps {
  items: ContentItem[]
}

export function PopularWidget({ items }: PopularWidgetProps) {
  const router = useRouter()

  const navigateToLibrary = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      router.push('/library?sort=popular')
      setTimeout(() => {
        document
          .getElementById('resource-library')
          ?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    },
    [router]
  )

  const displayItems = useMemo(() => {
    return [...items]
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 4)
  }, [items])

  return (
    <section className="py-8" aria-labelledby="popular-heading">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <div>
          {/* Header row */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-diligent-red">
                <Icon variant="rounded" name="star" className="text-[18px] text-white" fill />
              </span>
              <div>
                <h2 id="popular-heading" className="text-lg font-bold leading-tight text-diligent-gray-5">
                  Most popular
                </h2>
                <p className="text-sm font-normal text-[#5C5F63]">
                  The most-accessed resources across the hub
                </p>
              </div>
            </div>
            <a
              href="/library?sort=popular"
              onClick={navigateToLibrary}
              className="flex items-center gap-2 text-sm font-medium text-diligent-gray-5 no-underline hover:underline"
            >
              See all popular
              <Icon
                variant="rounded"
                name="arrow_forward"
                className="text-[18px] text-diligent-gray-5"
              />
            </a>
          </div>

          {/* Card grid */}
          <div role="region" aria-label="Most popular resources">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {displayItems.map((item) => (
                <div key={item._id}>
                  <ContentCard
                    item={item}
                    compact
                    className="h-full"
                  />
                </div>
              ))}
              {/* Fill empty slots if fewer than 4 items */}
              {displayItems.length < 4 &&
                Array.from({ length: 4 - displayItems.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center justify-center rounded-xl border border-diligent-gray-2 bg-white p-6"
                  >
                    <p className="text-sm text-diligent-gray-3">No popular resources available</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
