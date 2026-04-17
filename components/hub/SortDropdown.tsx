'use client'

export type SortOption = 'newest' | 'popular' | 'az'

const sortLabels: Record<SortOption, string> = {
  newest: 'Newest',
  popular: 'Most popular',
  az: 'A\u2013Z',
}

interface SortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort-select"
        className="whitespace-nowrap text-sm text-diligent-gray-4"
      >
        Sort by
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="rounded-sm border border-diligent-gray-2 bg-white px-3 py-2 text-sm text-diligent-gray-5 outline-none focus-visible:border-link"
      >
        {(Object.keys(sortLabels) as SortOption[]).map((key) => (
          <option key={key} value={key}>
            {sortLabels[key]}
          </option>
        ))}
      </select>
    </div>
  )
}
