'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { HorizontalCardScroller } from '@/components/hub/HorizontalCardScroller'
import { subjectGroupConfig } from '@/components/hub/subjectGroupConfig'
import type { ContentItem } from '@/types/content'

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
  const config = subjectGroupConfig[groupSlug]
  if (!config) return null

  const seeAllHref = `/library?subject=${groupSlug}&orgType=${activeOrgTypeSlug}`

  return (
    <section className="border-b border-diligent-gray-2 py-12">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr]">
          {/* Left panel */}
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-diligent-red">
              <Icon name={config.icon} className="text-[24px] text-white" />
            </div>

            <h2 className="text-heading-2 font-semibold text-diligent-gray-5">
              {groupName}
            </h2>

            <p className="text-sm leading-relaxed text-diligent-gray-4">
              {config.description}
            </p>

            {/* Sub-topic pills */}
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={`/library?subject=${subject.id}`}
                  className="rounded-full border border-diligent-gray-2 px-3 py-1 text-xs text-diligent-gray-4 no-underline transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5 hover:no-underline"
                >
                  {subject.name}
                </Link>
              ))}
            </div>

            {/* See all link */}
            <Link
              href={seeAllHref}
              className="mt-auto text-sm font-medium text-link no-underline hover:underline"
            >
              See all {items.length} items &rarr;
            </Link>
          </div>

          {/* Right panel */}
          <div className="min-w-0">
            <HorizontalCardScroller
              items={items.slice(0, 12)}
              seeAllHref={seeAllHref}
              seeAllLabel="See all in this category"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
