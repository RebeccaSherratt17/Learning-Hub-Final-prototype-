'use client'

import { useState, useEffect, useRef, useCallback, FormEvent, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Icon } from '@/components/ui/Icon'
import { SEARCH_SUGGESTION_POOL } from '@/lib/searchSuggestions'

interface Suggestion {
  id: string
  title: string
  slug: string
  type: 'course' | 'template' | 'video' | 'learningPath'
  subTopics: string[]
}

const TYPE_LABELS: Record<Suggestion['type'], string> = {
  course: 'Course',
  template: 'Template',
  video: 'Video',
  learningPath: 'Learning Path',
}

const TYPE_BADGE_COLORS: Record<Suggestion['type'], string> = {
  course: 'bg-diligent-red',
  video: 'bg-diligent-gray-5',
  template: 'bg-[#0B4CCE]',
  learningPath: 'bg-diligent-gray-4',
}

interface Partner {
  _id: string
  name: string | null
  logoUrl: string | null
  logoAlt: string | null
  url: string | null
}

interface HomepageHeroProps {
  partners?: Partner[]
}

const TYPE_ROUTES: Record<Suggestion['type'], string> = {
  course: '/courses',
  template: '/templates',
  video: '/videos',
  learningPath: '/learning-paths',
}

export function HomepageHero({ partners = [] }: HomepageHeroProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [pills, setPills] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const shuffled = [...SEARCH_SUGGESTION_POOL].sort(() => Math.random() - 0.5)
    setPills(shuffled.slice(0, 4))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSuggestions([])
      setTotalCount(0)
      setShowDropdown(false)
      return
    }
    try {
      const res = await fetch(`/api/hub/search-suggest?q=${encodeURIComponent(term)}`)
      if (res.ok) {
        const data: { results: Suggestion[]; total: number } = await res.json()
        setSuggestions(data.results)
        setTotalCount(data.total)
        setShowDropdown(data.results.length > 0)
        setActiveIndex(-1)
      }
    } catch {
      // Silently fail — search bar still works via Enter
    }
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value.trim()), 300)
  }

  function navigateToItem(suggestion: Suggestion) {
    setShowDropdown(false)
    router.push(`${TYPE_ROUTES[suggestion.type]}/${suggestion.slug}`)
  }

  function navigateToLibrary() {
    setShowDropdown(false)
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/library?q=${encodeURIComponent(trimmed)}#resource-library`)
    } else {
      router.push('/library')
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // "Show all" button is at index === suggestions.length
    if (activeIndex === suggestions.length) {
      navigateToLibrary()
      return
    }
    if (activeIndex >= 0 && activeIndex < suggestions.length) {
      navigateToItem(suggestions[activeIndex])
      return
    }
    setShowDropdown(false)
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/library?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/library')
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || suggestions.length === 0) return

    // Total navigable items: suggestions + "Show all" button
    const maxIndex = suggestions.length // last index is the "Show all" button
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : maxIndex))
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setActiveIndex(-1)
    }
  }

  function handlePillClick(term: string) {
    router.push(`/library?q=${encodeURIComponent(term)}#resource-library`)
  }

  return (
    <>
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

        {/* Search bar with autocomplete */}
        <div ref={containerRef} className="relative mx-auto mt-8 max-w-3xl">
          <form onSubmit={handleSubmit} className="relative">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-diligent-gray-3"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true)
              }}
              placeholder="Search courses, templates, videos..."
              className="w-full rounded-lg border-2 border-diligent-gray-5 bg-white py-4 pl-12 pr-4 text-base shadow-sm placeholder:text-diligent-gray-3 focus:outline-none focus:ring-2 focus:ring-diligent-red/20"
              role="combobox"
              aria-expanded={showDropdown}
              aria-autocomplete="list"
              aria-controls="search-suggestions"
              aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
            />
          </form>

          {/* Autocomplete dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div
              id="search-suggestions"
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-diligent-gray-2 bg-white"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
            >
              {suggestions.map((s, i) => (
                <div
                  key={s.id}
                  id={`suggestion-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    navigateToItem(s)
                  }}
                  className={`flex cursor-pointer items-center text-left text-sm transition-colors ${
                    i < suggestions.length - 1 ? 'border-b border-b-diligent-gray-2' : ''
                  } ${
                    i === activeIndex
                      ? 'border-l-[3px] border-l-diligent-red bg-diligent-gray-1 py-3 pl-[13px] pr-4'
                      : 'border-l-[3px] border-l-transparent py-3 pl-4 pr-4'
                  }`}
                >
                  <Icon
                    name="chevron_right"
                    className="mr-3 flex-shrink-0 text-base text-diligent-gray-3"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-diligent-gray-5">{s.title}</span>
                    {s.subTopics.length > 0 && (
                      <span className="text-diligent-gray-4" style={{ fontSize: '11px' }}>
                        {s.subTopics.slice(0, 3).join(' · ')}
                      </span>
                    )}
                  </div>
                  <span
                    className={`ml-3 flex-shrink-0 rounded-full font-medium text-white ${TYPE_BADGE_COLORS[s.type]}`}
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                  >
                    {TYPE_LABELS[s.type]}
                  </span>
                </div>
              ))}
              {/* Show all results button */}
              <div
                id={`suggestion-${suggestions.length}`}
                role="option"
                aria-selected={activeIndex === suggestions.length}
                onMouseEnter={() => setActiveIndex(suggestions.length)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  navigateToLibrary()
                }}
                className={`cursor-pointer text-center text-diligent-gray-5 transition-colors ${
                  activeIndex === suggestions.length
                    ? 'bg-diligent-gray-2'
                    : 'bg-diligent-gray-1 hover:bg-diligent-gray-2'
                }`}
                style={{ fontSize: '12px', padding: '10px 16px' }}
              >
                Show all {totalCount} results →
              </div>
            </div>
          )}
        </div>

        {/* Suggestion pills */}
        <div className="mx-auto mt-5 flex max-w-3xl flex-nowrap items-center justify-center gap-2 overflow-x-auto whitespace-nowrap px-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">
            Try:
          </span>
          {pills.map((term) => (
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

    {/* Compact partner logo scroller — outside grey hero, on white background */}
    {partners.length > 0 && (
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-2" style={{ height: '48px' }}>
        <span
          className="flex-shrink-0 uppercase text-diligent-gray-4"
          style={{ fontSize: '10px', letterSpacing: '0.08em' }}
        >
          In partnership with
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden partner-scroller-mask" style={{ height: '48px' }}>
          <div
            className="flex items-center gap-6 motion-safe:animate-[marquee_90s_linear_infinite]"
            style={{ width: 'max-content', height: '48px' }}
          >
            {[...partners, ...partners].map((p, i) => {
              if (!p.logoUrl) return null
              const img = (
                <div className="flex h-8 w-[90px] flex-shrink-0 items-center justify-center">
                  <Image
                    src={p.logoUrl}
                    alt={p.logoAlt ?? p.name ?? 'Partner logo'}
                    width={90}
                    height={32}
                    className="h-full w-full object-contain"
                  />
                </div>
              )
              return p.url ? (
                <a key={`${p._id}-${i}`} href={p.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 no-underline">
                  {img}
                </a>
              ) : (
                <span key={`${p._id}-${i}`} className="flex-shrink-0">{img}</span>
              )
            })}
          </div>
        </div>
      </div>
    )}
    </>
  )
}
