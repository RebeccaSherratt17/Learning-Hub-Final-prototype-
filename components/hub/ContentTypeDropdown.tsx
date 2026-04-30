'use client'

import { contentTypeLabels } from '@/types/content'
import type { ContentType } from '@/types/content'

interface ContentTypeDropdownProps {
  value: string
  onChange: (value: string) => void
}

const options: { value: string; label: string }[] = [
  { value: '', label: 'All types' },
  ...(Object.entries(contentTypeLabels) as [ContentType, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
]

export function ContentTypeDropdown({ value, onChange }: ContentTypeDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="content-type-select"
        className="whitespace-nowrap text-sm text-diligent-gray-4"
      >
        Type
      </label>
      <select
        id="content-type-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-sm border border-diligent-gray-2 bg-white px-3 py-2 text-sm text-diligent-gray-5 outline-none focus-visible:border-link"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
