'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ContentCard } from '@/components/hub/ContentCard'
import { Icon } from '@/components/ui/Icon'
import type { ContentItem } from '@/types/content'

export interface HorizontalCardScrollerProps {
  items: ContentItem[]
  seeAllHref: string
  seeAllLabel?: string
}

const CARD_WIDTH = 280
const GAP = 24

export function HorizontalCardScroller({
  items,
  seeAllHref,
  seeAllLabel = 'See all',
}: HorizontalCardScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollState()

    el.addEventListener('scroll', updateScrollState, { passive: true })

    const observer = new ResizeObserver(() => updateScrollState())
    observer.observe(el)

    return () => {
      el.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
    }
  }, [updateScrollState, items])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = CARD_WIDTH + GAP
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-diligent-gray-4">
        No content available for this selection.
      </p>
    )
  }

  return (
    <div className="relative">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="absolute -left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-diligent-gray-2 bg-white shadow-md transition-colors hover:bg-diligent-gray-1"
        >
          <Icon name="chevron_left" className="text-[20px] text-diligent-gray-5" />
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="absolute -right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-diligent-gray-2 bg-white shadow-md transition-colors hover:bg-diligent-gray-1"
        >
          <Icon name="chevron_right" className="text-[20px] text-diligent-gray-5" />
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]"
      >
        {items.map((item) => (
          <div key={item._id} className="w-[280px] flex-shrink-0">
            <ContentCard item={item} className="h-full" />
          </div>
        ))}

        {/* "See all" card */}
        <Link
          href={seeAllHref}
          className="flex w-[280px] flex-shrink-0 items-center justify-center rounded-md border-2 border-dashed border-diligent-gray-3 bg-diligent-gray-1 no-underline transition-colors hover:border-diligent-gray-4 hover:bg-diligent-gray-2"
        >
          <span className="flex items-center gap-2 font-medium text-diligent-gray-5">
            {seeAllLabel}
            <Icon name="arrow_forward" className="text-[20px] text-diligent-gray-5" />
          </span>
        </Link>
      </div>
    </div>
  )
}
