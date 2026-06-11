'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { ContentCard } from '@/components/hub/ContentCard'
import { subjectGroupConfig } from '@/components/hub/subjectGroupConfig'
import type { ContentItem } from '@/types/content'
import { toSentenceCase } from '@/lib/toSentenceCase'

interface SubjectInfo {
  id: string
  name: string
  slug: string
}

interface SubjectGroupWidgetProps {
  groupSlug: string
  groupName: string
  subjects: SubjectInfo[]
  items: ContentItem[]
  activeOrgTypeId: string
}

export function SubjectGroupWidget({
  groupSlug,
  groupName,
  subjects,
  items,
  activeOrgTypeId,
}: SubjectGroupWidgetProps) {
  const router = useRouter()
  const config = subjectGroupConfig[groupSlug]

  if (!config) return null

  const seeAllHref = (() => {
    const params = new URLSearchParams()
    subjects.forEach((s) => params.append('subject', s.id))
    if (activeOrgTypeId) params.set('orgType', activeOrgTypeId)
    return `/library?${params.toString()}`
  })()

  const navigateToLibrary = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      router.push(seeAllHref)
      setTimeout(() => {
        document
          .getElementById('resource-library')
          ?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    },
    [router, seeAllHref]
  )

  const displayItems = items.slice(0, 4)

  return (
    <section className="py-6">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <div className="overflow-hidden">
          {/* Header row */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-diligent-red">
                <Icon name={config.icon} className="text-[18px] text-white" />
              </span>
              <div>
                <h2 className="text-lg font-bold leading-tight text-diligent-gray-5">
                  {toSentenceCase(groupName)}
                </h2>
                <p className="text-sm font-normal text-diligent-gray-4">
                  {config.description}
                </p>
              </div>
            </div>
            <a
              href={seeAllHref}
              onClick={navigateToLibrary}
              className="flex items-center gap-2 text-sm font-medium text-diligent-gray-5 no-underline hover:underline"
            >
              See all {items.length} items
              <Icon
                name="arrow_forward"
                className="text-[18px] text-diligent-gray-5"
              />
            </a>
          </div>

          {/* Divider */}
          <div className="border-t border-[#DADADA]" />

          {/* Card scroller */}
          <div className="overflow-x-auto">
            <div className="flex">
              {displayItems.map((item) => (
                <div
                  key={item._id}
                  className="w-[260px] flex-shrink-0 border-l border-diligent-gray-2 first:border-l-0"
                >
                  <ContentCard
                    item={item}
                    compact
                    className="h-full rounded-none border-0 shadow-none hover:translate-y-0 hover:shadow-none"
                  />
                </div>
              ))}
              {/* Fill empty slots if fewer than 4 items */}
              {displayItems.length < 4 &&
                Array.from({ length: 4 - displayItems.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex w-[260px] flex-shrink-0 items-center justify-center border-l border-diligent-gray-2 bg-white p-6"
                  >
                    <p className="text-sm text-diligent-gray-3">No content</p>
                  </div>
                ))}

              {/* "See all" end cap */}
              <a
                href={seeAllHref}
                onClick={navigateToLibrary}
                className="flex w-[160px] flex-shrink-0 flex-col items-center justify-center gap-3 border-l border-diligent-gray-2 bg-diligent-gray-1 px-4 text-center no-underline transition-colors hover:bg-diligent-gray-2"
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
