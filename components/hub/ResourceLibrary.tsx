'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ContentCard } from '@/components/hub/ContentCard'
import { SearchBar } from '@/components/hub/SearchBar'
import { SortDropdown, type SortOption } from '@/components/hub/SortDropdown'
import { type FilterState } from '@/components/hub/FilterBar'
import { FilterSidebar } from '@/components/hub/FilterSidebar'
import { FilterDrawer } from '@/components/hub/FilterDrawer'
import { ContentTypeDropdown } from '@/components/hub/ContentTypeDropdown'
import { Pagination } from '@/components/hub/Pagination'
import { SafeHtml } from '@/components/hub/SafeHtml'
import { Icon } from '@/components/ui/Icon'
import type { ContentItem } from '@/types/content'

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

interface ResourceLibraryProps {
  heading: string | null
  body: string | null
  items: ContentItem[]
  personas: TaxonomyItem[]
  regions: TaxonomyItem[]
  subjects: SubjectItem[]
  filterCounts: Record<string, number>
}

/** Filter items by search term and multi-select filters. Exported for testing. */
export function filterItems(
  items: ContentItem[],
  search: string,
  filters: FilterState,
): ContentItem[] {
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
    // Region filter (OR within)
    if (filters.regions.length > 0) {
      const itemWithRegions = item as ContentItem & { regions?: { _id: string }[] | null }
      const itemRegionIds = itemWithRegions.regions?.map((r) => r._id) ?? []
      if (!filters.regions.some((id) => itemRegionIds.includes(id))) {
        return false
      }
    }
    // Subject filter (OR within)
    if (filters.subjects.length > 0) {
      const itemSubjectIds = item.subjects?.map((s) => s._id) ?? []
      if (!filters.subjects.some((id) => itemSubjectIds.includes(id))) {
        return false
      }
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
}: ResourceLibraryProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'newest',
  )
  const [filters, setFilters] = useState<FilterState>(() => ({
    types: searchParams
      .getAll('type')
      .map((t) => typeParamMap[t] ?? t),
    personas: searchParams.getAll('persona'),
    regions: searchParams.getAll('region'),
    subjects: searchParams.getAll('subject'),
  }))
  const [page, setPage] = useState(
    Number(searchParams.get('page')) || 1,
  )
  const [drawerOpen, setDrawerOpen] = useState(false)

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
      if (p > 1) params.set('page', String(p))

      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}#resource-library`, {
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

  const handleContentTypeChange = useCallback(
    (value: string) => {
      const newTypes = value ? [value] : []
      const newFilters = { ...filters, types: newTypes }
      setFilters(newFilters)
      setPage(1)
      syncUrl({ filters: newFilters, page: 1 })
    },
    [filters, syncUrl],
  )

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage)
      syncUrl({ page: newPage })
    },
    [syncUrl],
  )

  // Compute filtered, sorted, paginated items
  const filtered = useMemo(
    () => filterItems(items, search, filters),
    [items, search, filters],
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
        <h2 className="mb-4 text-heading-1 font-bold text-diligent-gray-5">
          {heading ?? 'Full resource library'}
        </h2>
        {body && (
          <SafeHtml
            html={body}
            className="mb-8 text-base text-diligent-gray-4 prose"
          />
        )}

        {/* Controls row */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <SearchBar value={search} onChange={handleSearchChange} />
          </div>
          <ContentTypeDropdown
            value={filters.types.length === 1 ? filters.types[0] : ''}
            onChange={handleContentTypeChange}
          />
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
          <div className="min-w-0">
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
                    })
                    setPage(1)
                    syncUrl({
                      search: '',
                      filters: {
                        types: [],
                        personas: [],
                        regions: [],
                        subjects: [],
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
