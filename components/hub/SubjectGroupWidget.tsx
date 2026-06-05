'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
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
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null)
  const [filteredItems, setFilteredItems] = useState<ContentItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  if (!config) return null

  const seeAllHref = (() => {
    const params = new URLSearchParams()
    subjects.forEach((s) => params.append('subject', s.id))
    if (activeOrgTypeId) params.set('orgType', activeOrgTypeId)
    return `/library?${params.toString()}`
  })()

  // Fetch filtered content when a sub-topic pill is clicked
  useEffect(() => {
    if (!activeSubjectId) {
      setFilteredItems(null)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    const params = new URLSearchParams({
      subject: activeSubjectId,
      ...(activeOrgTypeId ? { orgType: activeOrgTypeId } : {}),
    })

    fetch(`/api/hub/content?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: ContentItem[]) => {
        if (!controller.signal.aborted) {
          setFilteredItems(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [activeSubjectId, activeOrgTypeId])

  const handlePillClick = useCallback((subjectId: string) => {
    setActiveSubjectId((prev) => (prev === subjectId ? null : subjectId))
  }, [])

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

  const displayItems = (filteredItems ?? items).slice(0, 4)

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

              {/* Sub-topic pills — local filters */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => handlePillClick(subject.id)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      activeSubjectId === subject.id
                        ? 'border-diligent-red bg-diligent-red text-white'
                        : 'border-diligent-gray-3 bg-white text-diligent-gray-5 hover:border-diligent-gray-4'
                    }`}
                  >
                    {subject.name}
                  </button>
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
              {isLoading ? (
                // Loading placeholders
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`loading-${i}`}
                    className="flex w-[260px] flex-shrink-0 items-center justify-center border-l border-diligent-gray-2 bg-white p-6"
                  >
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-diligent-gray-3 border-t-diligent-red" />
                  </div>
                ))
              ) : (
                <>
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
                        <p className="text-sm text-diligent-gray-3">
                          {activeSubjectId ? 'No matching content' : 'No content'}
                        </p>
                      </div>
                    ))}
                </>
              )}

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
