'use client'

import { useState, useEffect, useCallback } from 'react'

interface Revision {
  id: string
  changedBy: string | null
  createdAt: string
  data: Record<string, unknown>
}

interface RevisionHistoryProps {
  contentType: 'COURSE' | 'TEMPLATE' | 'VIDEO' | 'LEARNING_PATH'
  contentId: string
}

const INTERNAL_FIELDS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'courseId',
  'templateId',
  'videoId',
  'learningPathId',
])

const PAGE_SIZE = 10

function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string') {
    // Check if it's an ISO date string
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return formatDate(value)
    }
    return value || '(empty)'
  }
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '(none)'
    return JSON.stringify(value, null, 2)
  }
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RevisionHistory({ contentType, contentId }: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const fetchRevisions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/revisions?contentType=${contentType}&contentId=${contentId}`
      )
      if (!res.ok) {
        throw new Error('Failed to fetch revisions')
      }
      const json = (await res.json()) as { revisions: Revision[] }
      setRevisions(json.revisions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revisions')
    } finally {
      setLoading(false)
    }
  }, [contentType, contentId])

  useEffect(() => {
    fetchRevisions()
  }, [fetchRevisions])

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const visibleRevisions = revisions.slice(0, visibleCount)
  const hasMore = visibleCount < revisions.length

  return (
    <div className="mt-8 rounded-lg border border-diligent-gray-2 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-sharp text-[24px] text-diligent-gray-4">history</span>
        <h2 className="text-lg font-semibold text-diligent-gray-5">Revision history</h2>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4 text-sm text-diligent-gray-4">
          <span className="material-symbols-sharp animate-spin text-[18px]">progress_activity</span>
          Loading revisions...
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && revisions.length === 0 && (
        <p className="py-4 text-sm text-diligent-gray-4">
          No revision history yet. Changes will be recorded when this item is saved.
        </p>
      )}

      {!loading && !error && revisions.length > 0 && (
        <div className="space-y-0">
          {visibleRevisions.map((revision, index) => {
            const isExpanded = expandedIds.has(revision.id)
            const data = revision.data as Record<string, unknown>
            const displayFields = Object.entries(data).filter(
              ([key]) => !INTERNAL_FIELDS.has(key)
            )

            return (
              <div
                key={revision.id}
                className={
                  index < visibleRevisions.length - 1
                    ? 'border-b border-diligent-gray-2 pb-3 mb-3'
                    : ''
                }
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium text-diligent-gray-5">
                      {formatDate(revision.createdAt)}
                    </span>
                    <span className="ml-2 text-diligent-gray-4">
                      by {revision.changedBy || 'Unknown'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExpand(revision.id)}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-diligent-blue-3 hover:bg-diligent-gray-1 transition-colors"
                  >
                    <span className="material-symbols-sharp text-[16px]">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                    {isExpanded ? 'Hide' : 'View'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-2 rounded-md bg-diligent-gray-1 p-4">
                    <dl className="space-y-1.5 text-sm">
                      {displayFields.map(([key, value]) => (
                        <div key={key} className="grid grid-cols-[180px_1fr] gap-2">
                          <dt className="font-medium text-diligent-gray-4 truncate">
                            {formatFieldName(key)}
                          </dt>
                          <dd className="text-diligent-gray-5 break-words whitespace-pre-wrap">
                            {formatFieldValue(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            )
          })}

          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-3 inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium text-diligent-blue-3 hover:bg-diligent-gray-1 transition-colors"
            >
              <span className="material-symbols-sharp text-[16px]">expand_more</span>
              Load more ({revisions.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
