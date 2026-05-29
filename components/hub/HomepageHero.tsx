'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'

const SUGGESTION_PILLS = [
  'CSRD reporting',
  'AGM minutes',
  'Cybersecurity oversight',
  'Subsidiary governance',
  'AI policy',
]

export function HomepageHero() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/library?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/library')
    }
  }

  function handlePillClick(term: string) {
    router.push(`/library?q=${encodeURIComponent(term)}`)
  }

  return (
    <section className="bg-diligent-gray-1 py-8 md:py-12">
      <div className="mx-auto px-4 text-center">
        {/* Heading */}
        <h1 className="whitespace-nowrap text-center text-3xl font-semibold text-diligent-gray-5 md:text-4xl lg:text-display-1">
          Search the hub. Or scan the{' '}
          <span className="text-diligent-red">shelves.</span>
        </h1>

        {/* Subheading */}
        <p className="mx-auto mt-4 max-w-2xl text-lg text-diligent-gray-4">
          Browse a category, search a keyword, or click a subtopic to jump
          straight to what you need.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="relative mx-auto mt-8 max-w-3xl">
          <Icon
            name="search"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-diligent-gray-3"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, templates, videos..."
            className="w-full rounded-lg border-2 border-diligent-gray-5 bg-white py-4 pl-12 pr-4 text-base shadow-sm placeholder:text-diligent-gray-3 focus:outline-none focus:ring-2 focus:ring-diligent-red/20"
          />
        </form>

        {/* Suggestion pills */}
        <div className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">
            Try:
          </span>
          {SUGGESTION_PILLS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handlePillClick(term)}
              className="rounded-full border border-diligent-gray-2 bg-white px-3.5 py-1.5 text-sm text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
