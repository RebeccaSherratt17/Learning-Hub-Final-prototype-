'use client'

import { useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/Icon'
import { type FilterState } from '@/components/hub/FilterBar'
import { FilterSidebar } from '@/components/hub/FilterSidebar'

interface TaxonomyItem {
  _id: string
  title: string | null
}

interface SubjectItem extends TaxonomyItem {
  group: string | null
}

interface FilterDrawerProps {
  open: boolean
  onClose: () => void
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  personas: TaxonomyItem[]
  regions: TaxonomyItem[]
  subjects: SubjectItem[]
  filterCounts: Record<string, number>
}

export function FilterDrawer({
  open,
  onClose,
  filters,
  onFilterChange,
  personas,
  regions,
  subjects,
  filterCounts,
}: FilterDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Trap focus and handle Escape
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-diligent-gray-2 px-6 py-4">
          <h2 className="text-heading-3 font-semibold text-diligent-gray-5">
            Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 hover:bg-diligent-gray-1"
            aria-label="Close filters"
          >
            <Icon name="close" className="text-[24px]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <FilterSidebar
            filters={filters}
            onFilterChange={onFilterChange}
            personas={personas}
            regions={regions}
            subjects={subjects}
            filterCounts={filterCounts}
          />
        </div>
      </div>
    </div>
  )
}
