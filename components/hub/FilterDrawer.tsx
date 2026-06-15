'use client'

import { useEffect, useRef, useCallback } from 'react'
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

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

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
  const triggerRef = useRef<HTMLElement | null>(null)

  // Capture the element that opened the drawer so we can restore focus
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null
    }
  }, [open])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [onClose],
  )

  // Focus management, keyboard handling, and scroll lock
  useEffect(() => {
    if (!open) return

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    // Move focus into the drawer
    requestAnimationFrame(() => {
      if (drawerRef.current) {
        const firstFocusable =
          drawerRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
        firstFocusable?.focus()
      }
    })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      // Return focus to the trigger element
      triggerRef.current?.focus()
    }
  }, [open, handleKeyDown])

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
