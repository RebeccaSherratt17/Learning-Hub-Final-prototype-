'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Sync from parent when value changes externally (e.g. pill click)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setLocalValue(val)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onChange(val), 300)
    },
    [onChange],
  )

  return (
    <div className="relative w-full">
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-diligent-gray-3"
      />
      <input
        type="search"
        placeholder="Search courses, templates, videos..."
        value={localValue}
        onChange={handleChange}
        className="w-full rounded-sm border-2 border-diligent-gray-5 bg-white py-2.5 pl-10 pr-4 text-sm text-diligent-gray-5 outline-none placeholder:text-diligent-gray-3 focus-visible:border-link focus-visible:ring-0"
        aria-label="Search content by title"
      />
    </div>
  )
}
