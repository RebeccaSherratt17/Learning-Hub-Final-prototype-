'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ContentCard } from '@/components/hub/ContentCard'
import { SearchBar } from '@/components/hub/SearchBar'
import { SortDropdown, type SortOption } from '@/components/hub/SortDropdown'
import { type FilterState } from '@/components/hub/FilterBar'
import { FilterSidebar } from '@/components/hub/FilterSidebar'
import { FilterDrawer } from '@/components/hub/FilterDrawer'
import { Pagination } from '@/components/hub/Pagination'
import { SafeHtml } from '@/components/hub/SafeHtml'
import { Icon } from '@/components/ui/Icon'
import Image from 'next/image'
import type { ContentItem } from '@/types/content'
import { SEARCH_SUGGESTION_POOL } from '@/lib/searchSuggestions'

const ITEMS_PER_PAGE = 15

// Map URL type params (e.g. COURSE, LEARNING_PATH) to internal ContentType keys
const typeParamMap: Record<string, string> = {
  COURSE: 'course',
  TEMPLATE: 'template',
  VIDEO: 'video',
  LEARNING_PATH: 'learningPath',
}

interface TaxonomyItem {
  _id: string
  title: string | null
}

interface SubjectItem extends TaxonomyItem {
  group: string | null
}

interface Partner {
  _id: string
  name: string | null
  logoUrl: string | null
  logoAlt: string | null
  url: string | null
}

interface ResourceLibraryProps {
  heading: string | null
  body: string | null
  items: ContentItem[]
  personas: TaxonomyItem[]
  regions: TaxonomyItem[]
  subjects: SubjectItem[]
  filterCounts: Record<string, number>
  partners?: Partner[]
}

/** Filter items by search term and multi-select filters. Exported for testing. */
export function filterItems(
  items: ContentItem[],
  search: string,
  filters: FilterState,
  globalRegionId?: string,
  orgTypeSubjectIds?: Set<string>,
): ContentItem[] {
  // Split selected subjects into org-type IDs and topic IDs so they apply as AND
  const selectedOrgTypes = orgTypeSubjectIds
    ? filters.subjects.filter((id) => orgTypeSubjectIds.has(id))
    : []
  const selectedTopics = orgTypeSubjectIds
    ? filters.subjects.filter((id) => !orgTypeSubjectIds.has(id))
    : filters.subjects

  return items.filter((item) => {
    // Search term (case-insensitive substring match on title)
    if (search && !item.title?.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    // Content type filter
    if (filters.types.length > 0 && !filters.types.includes(item._type)) {
      return false
    }
    // Persona filter (OR within — item matches if it has ANY selected persona)
    if (filters.personas.length > 0) {
      const itemWithPersonas = item as ContentItem & { personas?: { _id: string }[] | null }
      const itemPersonaIds = itemWithPersonas.personas?.map((p) => p._id) ?? []
      if (!filters.personas.some((id) => itemPersonaIds.includes(id))) {
        return false
      }
    }
    // Region filter (OR within) — always include "Global" content alongside specific regions
    if (filters.regions.length > 0) {
      const itemWithRegions = item as ContentItem & { regions?: { _id: string }[] | null }
      const itemRegionIds = itemWithRegions.regions?.map((r) => r._id) ?? []
      const matchesSelected = filters.regions.some((id) => itemRegionIds.includes(id))
      const matchesGlobal = globalRegionId ? itemRegionIds.includes(globalRegionId) : false
      if (!matchesSelected && !matchesGlobal) {
        return false
      }
    }
    // Organization type filter (OR within org types, AND with topic subjects)
    if (selectedOrgTypes.length > 0) {
      const itemSubjectIds = item.subjects?.map((s) => s._id) ?? []
      if (!selectedOrgTypes.some((id) => itemSubjectIds.includes(id))) {
        return false
      }
    }
    // Subject/topic filter (OR within topics, AND with org types)
    if (selectedTopics.length > 0) {
      const itemSubjectIds = item.subjects?.map((s) => s._id) ?? []
      if (!selectedTopics.some((id) => itemSubjectIds.includes(id))) {
        return false
      }
    }
    // Level filter (single-select)
    if (filters.level && item.level !== filters.level) {
      return false
    }
    return true
  })
}

/** Sort items by selected sort option. Exported for testing. */
export function sortItems(
  items: ContentItem[],
  sort: SortOption,
): ContentItem[] {
  const sorted = [...items]
  switch (sort) {
    case 'newest':
      return sorted.sort(
        (a, b) =>
          new Date(b.publishedAt ?? 0).getTime() -
          new Date(a.publishedAt ?? 0).getTime(),
      )
    case 'popular':
      return sorted.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    case 'az':
      return sorted.sort((a, b) =>
        (a.title ?? '').localeCompare(b.title ?? ''),
      )
  }
}

export function ResourceLibrary({
  heading,
  body,
  items,
  personas,
  regions,
  subjects,
  filterCounts,
  partners = [],
}: ResourceLibraryProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'newest',
  )
  const [filters, setFilters] = useState<FilterState>(() => {
    const urlSubjects = searchParams.getAll('subject')
    const orgType = searchParams.get('orgType')
    // Merge orgType into subjects array — filterItems splits them back out using orgTypeSubjectIds
    const allSubjects = orgType && !urlSubjects.includes(orgType)
      ? [...urlSubjects, orgType]
      : urlSubjects
    return {
      types: searchParams
        .getAll('type')
        .map((t) => typeParamMap[t] ?? t),
      personas: searchParams.getAll('persona'),
      regions: searchParams.getAll('region'),
      subjects: allSubjects,
      level: searchParams.get('level') ?? '',
    }
  })
  const [page, setPage] = useState(
    Number(searchParams.get('page')) || 1,
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchPills, setSearchPills] = useState<string[]>([])

  useEffect(() => {
    const shuffled = [...SEARCH_SUGGESTION_POOL].sort(() => Math.random() - 0.5)
    setSearchPills(shuffled.slice(0, 4))
  }, [])

  // Scroll to this section when the URL hash is #resource-library
  useEffect(() => {
    if (window.location.hash === '#resource-library') {
      // Allow the page to finish rendering before scrolling
      requestAnimationFrame(() => {
        document.getElementById('resource-library')?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  }, [])

  // React to external URL changes (e.g. signpost links updating ?type=)
  useEffect(() => {
    const urlTypes = searchParams
      .getAll('type')
      .map((t) => typeParamMap[t] ?? t)
    const currentTypes = filters.types
    const changed =
      urlTypes.length !== currentTypes.length ||
      urlTypes.some((t, i) => t !== currentTypes[i])
    if (changed) {
      setFilters((prev) => ({ ...prev, types: urlTypes }))
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // React to external URL changes for taxonomy filters (e.g. tag links from content pages)
  useEffect(() => {
    const urlPersonas = searchParams.getAll('persona')
    const urlRegions = searchParams.getAll('region')
    const urlSubjects = searchParams.getAll('subject')
    const orgType = searchParams.get('orgType')
    const combinedSubjects = orgType && !urlSubjects.includes(orgType)
      ? [...urlSubjects, orgType]
      : urlSubjects
    const changed =
      urlPersonas.length !== filters.personas.length ||
      urlPersonas.some((v, i) => v !== filters.personas[i]) ||
      urlRegions.length !== filters.regions.length ||
      urlRegions.some((v, i) => v !== filters.regions[i]) ||
      combinedSubjects.length !== filters.subjects.length ||
      combinedSubjects.some((v, i) => v !== filters.subjects[i])
    if (changed) {
      setFilters((prev) => ({ ...prev, personas: urlPersonas, regions: urlRegions, subjects: combinedSubjects }))
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // React to external URL changes for sort param (e.g. "See all" links)
  useEffect(() => {
    const urlSort = (searchParams.get('sort') as SortOption) || 'newest'
    if (urlSort !== sort) {
      setSort(urlSort)
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Sync state to URL
  const syncUrl = useCallback(
    (newState: {
      search?: string
      sort?: SortOption
      filters?: FilterState
      page?: number
    }) => {
      const params = new URLSearchParams()
      const s = newState.search ?? search
      const so = newState.sort ?? sort
      const f = newState.filters ?? filters
      const p = newState.page ?? page

      if (s) params.set('q', s)
      if (so !== 'newest') params.set('sort', so)
      f.types.forEach((v) => params.append('type', v))
      f.personas.forEach((v) => params.append('persona', v))
      f.regions.forEach((v) => params.append('region', v))
      f.subjects.forEach((v) => params.append('subject', v))
      if (f.level) params.set('level', f.level)
      if (p > 1) params.set('page', String(p))

      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, {
        scroll: false,
      })
    },
    [search, sort, filters, page, pathname, router],
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      setPage(1)
      syncUrl({ search: value, page: 1 })
    },
    [syncUrl],
  )

  const handleSortChange = useCallback(
    (value: SortOption) => {
      setSort(value)
      setPage(1)
      syncUrl({ sort: value, page: 1 })
    },
    [syncUrl],
  )

  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters)
      setPage(1)
      syncUrl({ filters: newFilters, page: 1 })
    },
    [syncUrl],
  )

  const contentAreaRef = useRef<HTMLDivElement>(null)

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage)
      syncUrl({ page: newPage })
      requestAnimationFrame(() => {
        contentAreaRef.current?.scrollIntoView({ behavior: 'smooth' })
      })
    },
    [syncUrl],
  )

  // Look up the "Global" region ID by title so it persists across reseeds
  const globalRegionId = useMemo(
    () => regions.find((r) => r.title === 'Global')?._id,
    [regions],
  )

  // Collect org-type subject IDs so filterItems can apply them as AND with topic subjects
  const orgTypeSubjectIds = useMemo(
    () => new Set(subjects.filter((s) => s.group === 'organization-type').map((s) => s._id)),
    [subjects],
  )

  // Compute filtered, sorted, paginated items
  const filtered = useMemo(
    () => filterItems(items, search, filters, globalRegionId, orgTypeSubjectIds),
    [items, search, filters, globalRegionId, orgTypeSubjectIds],
  )
  const sorted = useMemo(() => sortItems(filtered, sort), [filtered, sort])
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE)
  const safePage = Math.min(page, Math.max(totalPages, 1))
  const paginatedItems = sorted.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  )

  return (
    <section id="resource-library" className="border-b border-diligent-gray-2 py-16">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <h2 className="mb-4 text-3xl font-semibold text-diligent-gray-5 md:text-4xl lg:text-display-1">
          Resource <span style={{ color: '#EE312E' }}>library</span>
        </h2>
        {body && (
          <SafeHtml
            html={body}
            className="mb-6 text-base text-diligent-gray-4 prose"
          />
        )}

        {/* Compact partner logo scroller */}
        {partners.length > 0 && (
          <div className="mb-6 flex items-center gap-4" style={{ height: '48px' }}>
            <span
              className="flex-shrink-0 text-[11px] uppercase tracking-[0.08em] font-medium text-diligent-gray-4"
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
                  <div key={`${p._id}-${i}`} className="flex h-8 w-[90px] flex-shrink-0 items-center justify-center">
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
                  img
                )
              })}
            </div>
            </div>
          </div>
        )}

        {/* Search bar — full width */}
        <div className="mb-4">
          <SearchBar value={search} onChange={handleSearchChange} />
        </div>

        {/* Popular searches */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span
            className="flex-shrink-0 uppercase text-diligent-gray-4"
            style={{ fontSize: '10px', letterSpacing: '0.08em' }}
          >
            Popular searches
          </span>
          {searchPills.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleSearchChange(term)}
              className="rounded-full border border-diligent-gray-2 bg-white text-diligent-gray-5 transition-colors hover:border-diligent-gray-3"
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              {term}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[280px_1fr]">
          {/* Desktop sidebar filters */}
          <aside className="hidden lg:block">
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              personas={personas}
              regions={regions}
              subjects={subjects}
              filterCounts={filterCounts}
            />
          </aside>

          {/* Content grid */}
          <div ref={contentAreaRef} className="min-w-0">
            {/* Resource count + sort + mobile filter toggle */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-lg font-semibold text-diligent-gray-5">
                {filtered.length} resources
              </p>
              <div className="flex items-center gap-4">
                <SortDropdown value={sort} onChange={handleSortChange} />
                {/* Mobile filter toggle */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="flex items-center gap-1.5 rounded-sm border border-diligent-gray-2 px-3 py-2 text-sm text-diligent-gray-4 hover:border-diligent-gray-3 lg:hidden"
                >
                  <Icon name="filter_list" className="text-[18px]" />
                  Filters
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="mb-4 border-b border-diligent-gray-2" />

            {/* Active filter tags */}
            {(() => {
              const typeLabels: Record<string, string> = {
                course: 'Course',
                template: 'Template',
                video: 'Video',
                learningPath: 'Learning path',
              }
              const levelLabels: Record<string, string> = {
                BEGINNER: 'Beginner-friendly',
                INTERMEDIATE: 'Intermediate',
                ADVANCED: 'Advanced',
              }
              const tags: { label: string; onRemove: () => void }[] = []
              filters.types.forEach((t) => {
                tags.push({
                  label: typeLabels[t] ?? t,
                  onRemove: () => handleFilterChange({ ...filters, types: filters.types.filter((v) => v !== t) }),
                })
              })
              filters.subjects.forEach((id) => {
                const s = subjects.find((s) => s._id === id)
                if (s) tags.push({
                  label: s.title ?? id,
                  onRemove: () => handleFilterChange({ ...filters, subjects: filters.subjects.filter((v) => v !== id) }),
                })
              })
              if (filters.level) {
                tags.push({
                  label: levelLabels[filters.level] ?? filters.level,
                  onRemove: () => handleFilterChange({ ...filters, level: '' }),
                })
              }
              filters.regions.forEach((id) => {
                const r = regions.find((r) => r._id === id)
                if (r) tags.push({
                  label: r.title ?? id,
                  onRemove: () => handleFilterChange({ ...filters, regions: filters.regions.filter((v) => v !== id) }),
                })
              })
              filters.personas.forEach((id) => {
                const p = personas.find((p) => p._id === id)
                if (p) tags.push({
                  label: p.title ?? id,
                  onRemove: () => handleFilterChange({ ...filters, personas: filters.personas.filter((v) => v !== id) }),
                })
              })
              if (tags.length === 0) return null
              return (
                <div className="mb-6 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={tag.onRemove}
                      className="flex items-center gap-1.5 rounded bg-white border border-diligent-gray-2 text-diligent-gray-5 transition-colors hover:border-diligent-gray-3"
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    >
                      <span>{tag.label}</span>
                      <span className="text-diligent-gray-4" style={{ fontSize: '12px' }}>×</span>
                    </button>
                  ))}
                </div>
              )
            })()}

            {paginatedItems.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-diligent-gray-4">
                  {search
                    ? `No results found for \u201c${search}\u201d`
                    : 'No content matches the current filters.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setFilters({
                      types: [],
                      personas: [],
                      regions: [],
                      subjects: [],
                      level: '',
                    })
                    setPage(1)
                    syncUrl({
                      search: '',
                      filters: {
                        types: [],
                        personas: [],
                        regions: [],
                        subjects: [],
                        level: '',
                      },
                      page: 1,
                    })
                  }}
                  className="mt-2 text-sm font-medium text-link hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedItems.map((item) => (
                    <li key={item._id}>
                      <ContentCard item={item} />
                    </li>
                  ))}
                </ul>
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        personas={personas}
        regions={regions}
        subjects={subjects}
        filterCounts={filterCounts}
      />
    </section>
  )
}
