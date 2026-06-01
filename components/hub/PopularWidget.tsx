'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { ContentCard } from '@/components/hub/ContentCard'
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
  const router = useRouter()
  const [activeType, setActiveType] = useState<ContentType | null>(null)

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

  const filteredItems = useMemo(() => {
    const filtered = activeType
      ? items.filter((item) => item._type === activeType)
      : items
    return [...filtered]
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 4)
  }, [items, activeType])

  return (
    <section className="py-12">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <div className="flex overflow-hidden rounded-lg border border-[#f0d4d3]">
          {/* Left panel */}
          <div className="flex w-[220px] flex-shrink-0 flex-col justify-between bg-[#fdf5f5] px-6 pt-3 pb-6">
            <div>
              {/* Eyebrow */}
              <div className="flex items-center gap-1.5">
                <Icon
                  name="trending_up"
                  className="text-[16px] text-diligent-red"
                />
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-diligent-red">
                  Across the hub
                </p>
              </div>

              {/* Heading with star icon */}
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-diligent-red">
                  <Icon name="star" className="text-[22px] text-white" fill />
                </span>
                <h2 className="text-lg font-bold leading-tight text-diligent-gray-5">
                  Most popular
                </h2>
              </div>

              {/* Filter tabs */}
              <div className="mt-5 flex flex-wrap gap-1.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.type}
                    type="button"
                    onClick={() =>
                      setActiveType(activeType === tab.type ? null : tab.type)
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-[12px] font-medium transition-colors',
                      activeType === tab.type
                        ? 'border-diligent-gray-5 bg-diligent-gray-5 text-white'
                        : 'border-diligent-gray-3 bg-white text-diligent-gray-5 hover:border-diligent-gray-4'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* See all link */}
            <a
              href="/library?sort=popular"
              onClick={navigateToLibrary}
              className="mt-6 flex items-center gap-2 text-sm font-medium text-diligent-gray-5 no-underline hover:underline"
            >
              See all popular
              <Icon
                name="arrow_forward"
                className="text-[18px] text-diligent-gray-5"
              />
            </a>
          </div>

          {/* Right panel — horizontally scrollable cards + end cap */}
          <div className="min-w-0 flex-1 overflow-x-auto">
            <div className="flex h-full">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  className="w-[260px] flex-shrink-0 border-l border-[#f0d4d3]"
                >
                  <ContentCard
                    item={item}
                    compact
                    className="h-full rounded-none border-0 shadow-none hover:translate-y-0 hover:shadow-none"
                  />
                </div>
              ))}
              {/* Fill empty slots if fewer than 4 items */}
              {filteredItems.length < 4 &&
                Array.from({ length: 4 - filteredItems.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex w-[260px] flex-shrink-0 items-center justify-center border-l border-[#f0d4d3] bg-white p-6"
                  >
                    <p className="text-sm text-diligent-gray-3">No content</p>
                  </div>
                ))}

              {/* "See all in this category" end cap */}
              <a
                href="/library?sort=popular"
                onClick={navigateToLibrary}
                className="flex w-[160px] flex-shrink-0 flex-col items-center justify-center gap-3 border-l border-[#f0d4d3] bg-diligent-gray-1 px-4 text-center no-underline transition-colors hover:bg-diligent-gray-2"
              >
                <Icon
                  name="arrow_forward"
                  className="text-[28px] text-diligent-gray-5"
                />
                <span className="text-sm font-semibold leading-snug text-diligent-gray-5">
                  See all
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
