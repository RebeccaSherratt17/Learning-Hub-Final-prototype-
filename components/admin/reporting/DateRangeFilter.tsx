'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { REPORT_RANGES, type ReportRange } from '@/lib/admin/reportingRanges'

interface DateRangeFilterProps {
  range: ReportRange
  /** YYYY-MM-DD of the current window, used to prefill the custom inputs */
  from: string
  to: string
  today: string
}

const pillBase = 'rounded-full px-4 py-1.5 text-sm font-medium transition-colors'
const pillActive = 'bg-diligent-gray-5 text-white'
const pillIdle = 'bg-white text-diligent-gray-4 shadow-sm hover:text-diligent-gray-5'

export default function DateRangeFilter({ range, from, to, today }: DateRangeFilterProps) {
  const router = useRouter()
  const [showCustom, setShowCustom] = useState(range === 'custom')
  // "All time" has no meaningful start date to prefill
  const [customFrom, setCustomFrom] = useState(range === 'all' ? '' : from)
  const [customTo, setCustomTo] = useState(to)
  const [error, setError] = useState<string | null>(null)

  function applyCustom(e: React.FormEvent) {
    e.preventDefault()
    if (!customFrom || !customTo) {
      setError('Choose a start and end date.')
      return
    }
    if (customFrom > customTo) {
      setError('The start date must be before the end date.')
      return
    }
    setError(null)
    router.push(`/admin/reporting?range=custom&from=${customFrom}&to=${customTo}`)
  }

  const inputClass =
    'rounded border border-diligent-gray-2 bg-white px-3 py-1.5 text-sm text-diligent-gray-5 focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red'

  return (
    <div className="space-y-3">
      <nav aria-label="Date range" className="flex flex-wrap gap-2">
        {REPORT_RANGES.map((r) => {
          const isActive = r.value === range
          return (
            <Link
              key={r.value}
              href={`/admin/reporting?range=${r.value}`}
              aria-current={isActive ? 'page' : undefined}
              className={`${pillBase} ${isActive ? pillActive : pillIdle}`}
              onClick={() => setShowCustom(false)}
            >
              {r.label}
            </Link>
          )
        })}
        <button
          type="button"
          aria-expanded={showCustom}
          aria-controls="custom-range-form"
          onClick={() => setShowCustom((s) => !s)}
          className={`${pillBase} inline-flex items-center gap-1 ${range === 'custom' ? pillActive : pillIdle}`}
        >
          <span className="material-symbols-sharp text-[16px]">date_range</span>
          Custom range
        </button>
      </nav>

      {showCustom && (
        <form
          id="custom-range-form"
          onSubmit={applyCustom}
          className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm"
        >
          <div>
            <label htmlFor="report-from" className="mb-1 block text-xs font-medium text-diligent-gray-4">
              From
            </label>
            <input
              id="report-from"
              type="date"
              required
              max={customTo || today}
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="report-to" className="mb-1 block text-xs font-medium text-diligent-gray-4">
              To
            </label>
            <input
              id="report-to"
              type="date"
              required
              min={customFrom || undefined}
              max={today}
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="rounded bg-diligent-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
          >
            Apply
          </button>
          {error && (
            <p className="w-full text-sm text-diligent-red" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
