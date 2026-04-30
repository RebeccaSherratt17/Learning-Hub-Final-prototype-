'use client'

import { contentTypeLabels } from '@/types/content'
import type { ContentType } from '@/types/content'
import { Icon } from '@/components/ui/Icon'

interface ContentTypeDropdownProps {
  value: string
  onChange: (value: string) => void
}

const options: { value: string; label: string }[] = [
  { value: '', label: 'Sort: Content type' },
  ...(Object.entries(contentTypeLabels) as [ContentType, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
]

export function ContentTypeDropdown({ value, onChange }: ContentTypeDropdownProps) {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? 'All types'

  return (
    <div className="relative inline-flex items-center">
      <Icon
        name="tune"
        className="pointer-events-none absolute left-3 text-[20px] text-diligent-gray-4"
      />
      <select
        id="content-type-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Content type"
        className="h-11 cursor-pointer appearance-none rounded-md border border-diligent-gray-2 bg-white py-3 pl-10 pr-9 text-sm font-medium text-diligent-gray-5 outline-none hover:border-diligent-gray-3 focus-visible:border-link"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
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
