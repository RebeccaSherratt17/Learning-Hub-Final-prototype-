'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { HorizontalCardScroller } from '@/components/hub/HorizontalCardScroller'
import { cn } from '@/lib/cn'
import type { ContentItem, ContentType } from '@/types/content'

export interface PopularWidgetProps {
  items: ContentItem[]
}

const tabs: { label: string; type: ContentType }[] = [
  { label: 'Templates', type: 'template' },
  { label: 'Courses', type: 'course' },
  { label: 'Videos', type: 'video' },
  { label: 'Learning paths', type: 'learningPath' },
]

export function PopularWidget({ items }: PopularWidgetProps) {
  const [activeType, setActiveType] = useState<ContentType | null>(null)

  const filteredItems = useMemo(() => {
    const filtered = activeType
      ? items.filter((item) => item._type === activeType)
      : items
    return [...filtered]
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 12)
  }, [items, activeType])

  return (
    <section className="border-b border-diligent-gray-2 py-12">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        {/* Eyebrow */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-diligent-gray-3">
          Across the hub
        </p>

        {/* Heading row */}
        <div className="mt-2 flex items-center gap-3">
          <Icon name="star" className="text-[24px] text-diligent-red" />
          <h2 className="text-heading-2 font-semibold text-diligent-gray-5">
            Most popular
          </h2>
        </div>

        {/* See all link */}
        <Link
          href="/library?sort=popular"
          className="mt-2 inline-block text-sm font-medium text-link no-underline hover:underline"
        >
          See all popular &rarr;
        </Link>

        {/* Content type filter tabs */}
        <div className="mb-6 mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveType(null)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              activeType === null
                ? 'border-diligent-gray-5 bg-diligent-gray-5 text-white'
                : 'border-diligent-gray-2 text-diligent-gray-4 hover:border-diligent-gray-3'
            )}
          >
            All
          </button>
          {tabs.map((tab) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => setActiveType(tab.type)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                activeType === tab.type
                  ? 'border-diligent-gray-5 bg-diligent-gray-5 text-white'
                  : 'border-diligent-gray-2 text-diligent-gray-4 hover:border-diligent-gray-3'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Card scroller */}
        <HorizontalCardScroller
          items={filteredItems}
          seeAllHref="/library?sort=popular"
          seeAllLabel="See all popular"
        />
      </div>
    </section>
  )
}
