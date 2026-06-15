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
        variant="rounded"
        name="search"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-diligent-gray-3"
      />
      <input
        type="search"
        placeholder="Search courses, templates, videos..."
        value={localValue}
        onChange={handleChange}
        className="w-full rounded-lg border-2 border-diligent-gray-5 bg-white py-4 pl-12 pr-4 text-base text-diligent-gray-5 shadow-sm outline-none placeholder:text-diligent-gray-3 focus-visible:outline-none focus:ring-2 focus:ring-diligent-red"
        aria-label="Search content by title"
      />
    </div>
  )
}
