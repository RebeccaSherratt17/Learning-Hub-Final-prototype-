'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { ContentCard } from '@/components/hub/ContentCard'
import { subjectGroupConfig } from '@/components/hub/subjectGroupConfig'
import type { ContentItem } from '@/types/content'

/** Preserve acronyms (e.g. "AI") and lowercase the rest */
const PRESERVE = new Set(['AI', 'ESG', 'ERM', 'GRC', 'IPO'])

function toSentenceCase(str: string): string {
  return str
    .split(' ')
    .map((word, i) => {
      if (PRESERVE.has(word)) return word
      if (i === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      return word.toLowerCase()
    })
    .join(' ')
}

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
  activeOrgTypeSlug: string
}

export function SubjectGroupWidget({
  groupSlug,
  groupName,
  subjects,
  items,
  activeOrgTypeSlug,
}: SubjectGroupWidgetProps) {
  const router = useRouter()
  const config = subjectGroupConfig[groupSlug]
  if (!config) return null

  const seeAllHref = `/library?subject=${groupSlug}&orgType=${activeOrgTypeSlug}`
  const displayItems = items.slice(0, 4)

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

  return (
    <section className="py-6">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <div className="flex overflow-hidden rounded-lg border border-diligent-gray-2">
          {/* Left panel */}
          <div className="flex w-[220px] flex-shrink-0 flex-col justify-between bg-diligent-gray-1 px-6 pt-3 pb-3">
            <div>
              {/* Icon badge + heading */}
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-diligent-red">
                  <Icon name={config.icon} className="text-[22px] text-white" />
                </span>
                <h2 className="text-lg font-bold leading-tight text-diligent-gray-5">
                  {toSentenceCase(groupName)}
                </h2>
              </div>

              {/* Description */}
              <p className="mt-3 text-xs leading-relaxed text-diligent-gray-4">
                {config.description}
              </p>

              {/* Sub-topic pills */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {subjects.map((subject) => (
                  <Link
                    key={subject.id}
                    href={`/library?subject=${subject.id}`}
                    className="rounded-full border border-diligent-gray-3 bg-white px-2 py-0.5 text-[11px] font-medium text-diligent-gray-5 no-underline transition-colors hover:border-diligent-gray-4 hover:no-underline"
                  >
                    {subject.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* See all link */}
            <a
              href={seeAllHref}
              onClick={navigateToLibrary}
              className="mt-6 flex items-center gap-2 text-sm font-medium text-diligent-gray-5 no-underline hover:underline"
            >
              See all {items.length} items
              <Icon
                name="arrow_forward"
                className="text-[18px] text-diligent-gray-5"
              />
            </a>
          </div>

          {/* Right panel — horizontally scrollable cards + end cap */}
          <div className="min-w-0 flex-1 overflow-x-auto">
            <div className="flex h-full">
              {displayItems.map((item) => (
                <div
                  key={item._id}
                  className="w-[260px] flex-shrink-0 border-l border-diligent-gray-2"
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

              {/* "See all in this category" end cap */}
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
