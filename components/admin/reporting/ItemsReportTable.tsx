'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ContentStatus, ContentType } from '@/lib/generated/prisma'
import StatusBadge from '@/components/admin/StatusBadge'
import ContentTypeBadge from '@/components/admin/ContentTypeBadge'

interface ItemRow {
  id: string
  type: ContentType
  title: string
  status: ContentStatus
  views: number
  visitors: number
  allTimeViews: number
  leads: number
  downloads: number | null
  starts: number | null
  completions: number | null
  badges: number | null
}

interface ItemsReportTableProps {
  items: ItemRow[]
  /** Query string for the current date range, e.g. "range=30d" */
  rangeQuery: string
}

type SortField = 'title' | 'views' | 'visitors' | 'allTimeViews' | 'leads' | 'downloads' | 'starts' | 'completions' | 'completionRate'
type SortDir = 'asc' | 'desc'

const ADMIN_PATHS: Record<ContentType, string> = {
  COURSE: 'courses',
  TEMPLATE: 'templates',
  VIDEO: 'videos',
  LEARNING_PATH: 'learning-paths',
}

const PAGE_SIZE = 25

function completionRate(row: ItemRow): number | null {
  if (row.starts === null || row.completions === null || row.starts === 0) return null
  return row.completions / row.starts
}

function sortValue(row: ItemRow, field: SortField): number | string {
  if (field === 'title') return row.title.toLowerCase()
  if (field === 'completionRate') return completionRate(row) ?? -1
  return row[field] ?? -1
}

function formatCount(value: number | null): string {
  return value === null ? '—' : value.toLocaleString('en-GB')
}

export default function ItemsReportTable({ items, rangeQuery }: ItemsReportTableProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ContentType | ''>('')
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('PUBLISHED')
  const [sortField, setSortField] = useState<SortField>('views')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showAll, setShowAll] = useState(false)

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = items.filter(
      (i) =>
        (!typeFilter || i.type === typeFilter) &&
        (!statusFilter || i.status === statusFilter) &&
        (!term || i.title.toLowerCase().includes(term)),
    )
    return filtered.sort((a, b) => {
      const av = sortValue(a, sortField)
      const bv = sortValue(b, sortField)
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [items, search, typeFilter, statusFilter, sortField, sortDir])

  const visibleRows = showAll ? rows : rows.slice(0, PAGE_SIZE)

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'title' ? 'asc' : 'desc')
    }
  }

  function SortHeader({ field, label, align = 'right' }: { field: SortField; label: string; align?: 'left' | 'right' }) {
    const isActive = sortField === field
    return (
      <th
        className={`px-4 py-3 ${align === 'right' ? 'text-right' : 'text-left'}`}
        aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <button
          type="button"
          onClick={() => handleSort(field)}
          className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:text-diligent-gray-5 ${
            isActive ? 'text-diligent-gray-5' : 'text-diligent-gray-3'
          }`}
        >
          {label}
          {isActive && (
            <span className="material-symbols-sharp text-[14px]">
              {sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}
            </span>
          )}
        </button>
      </th>
    )
  }

  const selectClass =
    'border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red'

  return (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-6 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-heading-3 font-bold text-diligent-gray-5">Content performance</h2>
          <p className="mt-1 text-xs text-diligent-gray-4">
            Activity per item in the selected period. All-time views include visits from before tracking began.
          </p>
        </div>
        <a
          href={`/api/admin/reporting/export?report=items&${rangeQuery}`}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded border border-diligent-gray-2 px-3 py-2 text-sm font-medium text-diligent-gray-5 hover:bg-diligent-gray-1 lg:self-auto"
        >
          <span className="material-symbols-sharp text-[18px]">download</span>
          Download CSV
        </a>
      </div>

      <div className="flex flex-wrap gap-3 px-6 pb-4">
        <div className="relative min-w-[180px] max-w-sm flex-1">
          <span className="material-symbols-sharp absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-diligent-gray-3">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search content..."
            aria-label="Search content"
            className="w-full rounded border border-diligent-gray-2 py-2 pl-10 pr-3 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ContentType | '')}
          aria-label="Filter by content type"
          className={selectClass}
        >
          <option value="">All content types</option>
          <option value="COURSE">Courses</option>
          <option value="TEMPLATE">Templates</option>
          <option value="VIDEO">Videos</option>
          <option value="LEARNING_PATH">Learning paths</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContentStatus | '')}
          aria-label="Filter by status"
          className={selectClass}
        >
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-diligent-gray-2">
              <SortHeader field="title" label="Title" align="left" />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">Status</th>
              <SortHeader field="views" label="Views" />
              <SortHeader field="visitors" label="Visitors" />
              <SortHeader field="allTimeViews" label="All-time views" />
              <SortHeader field="leads" label="Leads" />
              <SortHeader field="downloads" label="Downloads" />
              <SortHeader field="starts" label="Starts" />
              <SortHeader field="completions" label="Completions" />
              <SortHeader field="completionRate" label="Completion rate" />
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-sm text-diligent-gray-4">
                  No content matches your filters.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => {
                const rate = completionRate(row)
                return (
                  <tr key={row.id} className="border-b border-diligent-gray-1 hover:bg-diligent-gray-1/50">
                    <td className="max-w-[320px] px-4 py-3">
                      <Link
                        href={`/admin/${ADMIN_PATHS[row.type]}/${row.id}`}
                        className="block truncate font-medium text-diligent-gray-5 hover:text-link"
                        title={row.title}
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3"><ContentTypeBadge type={row.type} /></td>
                    <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3 text-right text-diligent-gray-5">{formatCount(row.views)}</td>
                    <td className="px-4 py-3 text-right text-diligent-gray-5">{formatCount(row.visitors)}</td>
                    <td className="px-4 py-3 text-right text-diligent-gray-4">{formatCount(row.allTimeViews)}</td>
                    <td className="px-4 py-3 text-right text-diligent-gray-5">{formatCount(row.leads)}</td>
                    <td className="px-4 py-3 text-right text-diligent-gray-5">{formatCount(row.downloads)}</td>
                    <td className="px-4 py-3 text-right text-diligent-gray-5">{formatCount(row.starts)}</td>
                    <td className="px-4 py-3 text-right text-diligent-gray-5">{formatCount(row.completions)}</td>
                    <td className="px-4 py-3 text-right text-diligent-gray-5">
                      {rate === null ? '—' : `${Math.round(rate * 100)}%`}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-4 text-xs text-diligent-gray-4">
        <span>
          Showing {visibleRows.length.toLocaleString('en-GB')} of {rows.length.toLocaleString('en-GB')} items
        </span>
        {rows.length > PAGE_SIZE && (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="font-medium text-link hover:underline"
          >
            {showAll ? 'Show fewer' : 'Show all'}
          </button>
        )}
      </div>
    </div>
  )
}
