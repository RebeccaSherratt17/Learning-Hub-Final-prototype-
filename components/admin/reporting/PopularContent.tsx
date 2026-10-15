'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ContentType } from '@/lib/generated/prisma'

interface PopularItem {
  id: string
  type: ContentType
  title: string
  views: number
  visitors: number
  allTimeViews: number
}

interface PopularContentProps {
  items: PopularItem[]
  /** Human-readable description of the selected period, e.g. "1 Sep – 30 Sep 2026" */
  periodLabel: string
}

type Mode = 'period' | 'allTime'

// Order requested for the reporting page
const SECTIONS: { type: ContentType; label: string; plural: string; icon: string; adminPath: string }[] = [
  { type: 'COURSE', label: 'Courses', plural: 'courses', icon: 'school', adminPath: 'courses' },
  { type: 'LEARNING_PATH', label: 'Learning paths', plural: 'learning paths', icon: 'route', adminPath: 'learning-paths' },
  { type: 'VIDEO', label: 'Videos', plural: 'videos', icon: 'videocam', adminPath: 'videos' },
  { type: 'TEMPLATE', label: 'Templates', plural: 'templates', icon: 'description', adminPath: 'templates' },
]

const TOP_N = 10
const SERIES = '#0B4CCE'

function rank(items: PopularItem[], type: ContentType, mode: Mode): PopularItem[] {
  const value = (i: PopularItem) => (mode === 'period' ? i.views : i.allTimeViews)
  return items
    .filter((i) => i.type === type && value(i) > 0)
    .sort((a, b) => value(b) - value(a) || b.visitors - a.visitors || a.title.localeCompare(b.title))
    .slice(0, TOP_N)
}

export default function PopularContent({ items, periodLabel }: PopularContentProps) {
  const [mode, setMode] = useState<Mode>('period')

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-heading-3 font-bold text-diligent-gray-5">Most popular</h2>
          <p className="mt-1 text-xs text-diligent-gray-4">
            {mode === 'period'
              ? `Top ${TOP_N} by page views, ${periodLabel}`
              : `Top ${TOP_N} by all-time views since launch (includes visits from before tracking began)`}
          </p>
        </div>
        <div className="inline-flex rounded border border-diligent-gray-2 p-0.5" role="group" aria-label="Popularity period">
          {([
            { value: 'period', label: 'Selected period' },
            { value: 'allTime', label: 'All time' },
          ] as const).map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={mode === m.value}
              onClick={() => setMode(m.value)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === m.value ? 'bg-diligent-gray-5 text-white' : 'text-diligent-gray-4 hover:text-diligent-gray-5'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {SECTIONS.map((section) => {
          const ranked = rank(items, section.type, mode)
          const max = Math.max(1, ...ranked.map((i) => (mode === 'period' ? i.views : i.allTimeViews)))
          return (
            <section key={section.type} aria-labelledby={`popular-${section.type}`}>
              <h3
                id={`popular-${section.type}`}
                className="flex items-center gap-2 border-b border-diligent-gray-2 pb-2 text-sm font-semibold text-diligent-gray-5"
              >
                <span className="material-symbols-sharp text-[18px] text-diligent-gray-4" aria-hidden="true">{section.icon}</span>
                {section.label}
              </h3>

              {ranked.length === 0 ? (
                <p className="py-6 text-center text-sm text-diligent-gray-4">
                  No {section.plural} viewed {mode === 'period' ? 'in this period' : 'yet'}.
                </p>
              ) : (
                <ol className="mt-1">
                  {ranked.map((item, index) => {
                    const value = mode === 'period' ? item.views : item.allTimeViews
                    const detail =
                      mode === 'period'
                        ? `${item.views.toLocaleString('en-GB')} views · ${item.visitors.toLocaleString('en-GB')} unique visitors`
                        : `${item.allTimeViews.toLocaleString('en-GB')} all-time views`
                    return (
                      <li key={item.id} className="group relative">
                        <Link
                          href={`/admin/${section.adminPath}/${item.id}`}
                          className="flex items-center gap-3 rounded px-1 py-2 hover:bg-diligent-gray-1/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-diligent-red"
                          aria-label={`${index + 1}. ${item.title}: ${detail}`}
                        >
                          <span className="w-5 shrink-0 text-right text-xs font-medium tabular-nums text-diligent-gray-4">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-diligent-gray-5">{item.title}</span>
                            <span className="mt-1 block h-2" aria-hidden="true">
                              <span
                                className="block h-full rounded-r"
                                style={{ width: `${Math.max(2, (value / max) * 100)}%`, backgroundColor: SERIES }}
                              />
                            </span>
                          </span>
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-diligent-gray-5">
                            {value.toLocaleString('en-GB')}
                          </span>
                        </Link>
                        {/* Hover / focus detail */}
                        <span
                          className="pointer-events-none absolute right-0 top-full z-10 mt-1 hidden whitespace-nowrap rounded border border-diligent-gray-2 bg-white px-3 py-1.5 text-xs text-diligent-gray-5 shadow-md group-hover:block group-focus-within:block"
                          aria-hidden="true"
                        >
                          {detail}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
