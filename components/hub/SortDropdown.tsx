'use client'

import { Icon } from '@/components/ui/Icon'

export type SortOption = 'newest' | 'popular' | 'az'

const sortLabels: Record<SortOption, string> = {
  newest: 'Sort: Newest',
  popular: 'Sort: Most popular',
  az: 'Sort: A\u2013Z',
}

interface SortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="relative inline-flex items-center">
      <Icon
        name="sort"
        className="pointer-events-none absolute left-3 text-[20px] text-diligent-gray-4"
      />
      <select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        aria-label="Sort by"
        className="h-11 cursor-pointer appearance-none rounded-md border border-diligent-gray-2 bg-white py-3 pl-10 pr-9 text-sm font-medium text-diligent-gray-5 outline-none hover:border-diligent-gray-3 focus-visible:border-link"
      >
        {(Object.keys(sortLabels) as SortOption[]).map((key) => (
          <option key={key} value={key}>
            {sortLabels[key]}
          </option>
        ))}
      </select>
      <Icon
        name="expand_more"
        className="pointer-events-none absolute right-2 text-[18px] text-diligent-gray-4"
      />
    </div>
  )
}
