'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface RelatedItem {
  type: string
  id: string
  title: string
}

interface RelatedItemsPickerProps {
  value: RelatedItem[]
  onChange: (items: RelatedItem[]) => void
  excludeType?: string
  excludeId?: string
  max?: number
}

const typeLabels: Record<string, string> = {
  COURSE: 'Course',
  TEMPLATE: 'Template',
  VIDEO: 'Video',
  LEARNING_PATH: 'Learning path',
}

export default function RelatedItemsPicker({
  value,
  onChange,
  excludeType,
  excludeId,
  max = 3,
}: RelatedItemsPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<RelatedItem[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setSearching(true)
    try {
      const params = new URLSearchParams({ q })
      if (excludeType) params.set('excludeType', excludeType)
      if (excludeId) params.set('excludeId', excludeId)

      const res = await fetch(`/api/admin/content/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        // Filter out items already selected
        const selectedIds = new Set(value.map((v) => `${v.type}:${v.id}`))
        const filtered = data.results.filter(
          (r: RelatedItem) => !selectedIds.has(`${r.type}:${r.id}`)
        )
        setResults(filtered)
        setShowDropdown(true)
      }
    } catch {
      // Silently fail
    } finally {
      setSearching(false)
    }
  }, [excludeType, excludeId, value])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

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

  function handleSelect(item: RelatedItem) {
    if (value.length >= max) return
    onChange([...value, item])
    setQuery('')
    setResults([])
    setShowDropdown(false)
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div ref={containerRef}>
      {/* Selected items as pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((item, index) => (
            <span
              key={`${item.type}:${item.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-diligent-gray-1 pl-2 pr-1 py-1 text-sm text-diligent-gray-5"
            >
              <span className="inline-block rounded-full bg-white px-1.5 py-0 text-[10px] font-medium text-diligent-gray-4">
                {typeLabels[item.type] || item.type}
              </span>
              <span className="max-w-[200px] truncate">{item.title}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full hover:bg-diligent-gray-2 text-diligent-gray-4 hover:text-diligent-gray-5"
                aria-label={`Remove ${item.title}`}
              >
                <span className="material-symbols-sharp text-[14px]">close</span>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      {value.length < max && (
        <div className="relative">
          <div className="relative">
            <span className="material-symbols-sharp absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-diligent-gray-3">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
              placeholder="Search for content to add..."
              className="w-full border border-diligent-gray-2 rounded px-3 py-2 pl-9 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-diligent-gray-3">
                Searching...
              </span>
            )}
          </div>

          {/* Results dropdown */}
          {showDropdown && results.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded border border-diligent-gray-2 bg-white shadow-lg max-h-60 overflow-auto">
              {results.map((item) => (
                <li key={`${item.type}:${item.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-diligent-gray-1"
                  >
                    <span className="inline-block rounded-full bg-diligent-gray-1 px-2 py-0.5 text-[10px] font-medium text-diligent-gray-4 shrink-0">
                      {typeLabels[item.type] || item.type}
                    </span>
                    <span className="truncate text-diligent-gray-5">{item.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showDropdown && query.length >= 2 && !searching && results.length === 0 && (
            <div className="absolute z-10 mt-1 w-full rounded border border-diligent-gray-2 bg-white shadow-lg px-3 py-2 text-sm text-diligent-gray-3">
              No results found
            </div>
          )}
        </div>
      )}

      {value.length >= max && (
        <p className="text-xs text-diligent-gray-3">
          Maximum of {max} related items reached.
        </p>
      )}
    </div>
  )
}
