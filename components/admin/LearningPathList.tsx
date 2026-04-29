'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import StatusBadge from './StatusBadge'
import type { ContentStatus, AccessTier } from '@/lib/generated/prisma'

interface LearningPathListItem {
  id: string
  title: string
  slug: string
  status: ContentStatus
  accessTier: AccessTier
  publishedAt: string | null
  createdAt: string
  _count: { items: number }
}

interface LearningPathsResponse {
  learningPaths: LearningPathListItem[]
  total: number
  page: number
  totalPages: number
}

type SortField = 'title' | 'status' | 'publishedAt'
type SortDir = 'asc' | 'desc'

const tierLabels: Record<AccessTier, string> = {
  FREE: 'Free',
  GATED: 'Gated',
  PREMIUM: 'Premium',
}

const tierStyles: Record<AccessTier, string> = {
  FREE: 'bg-emerald-100 text-emerald-800',
  GATED: 'bg-amber-100 text-amber-800',
  PREMIUM: 'bg-purple-100 text-purple-800',
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-diligent-gray-5">{title}</h3>
        <p className="mt-2 text-sm text-diligent-gray-4">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm font-medium text-diligent-gray-4 hover:text-diligent-gray-5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-diligent-red px-4 py-2 text-sm font-medium text-white hover:bg-diligent-red-2"
          >
            {confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LearningPathList() {
  const [learningPaths, setLearningPaths] = useState<LearningPathListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('')
  const [sortField, setSortField] = useState<SortField>('publishedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [bulkTier, setBulkTier] = useState<AccessTier>('FREE')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string
    title: string
    progressCount?: number
  } | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  const fetchLearningPaths = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/admin/learning-paths?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data: LearningPathsResponse = await res.json()
      setLearningPaths(data.learningPaths)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      console.error('Failed to fetch learning paths')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter])

  useEffect(() => {
    fetchLearningPaths()
  }, [fetchLearningPaths])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedPaths = [...learningPaths].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortField) {
      case 'title':
        return a.title.localeCompare(b.title) * dir
      case 'status':
        return a.status.localeCompare(b.status) * dir
      case 'publishedAt': {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
        return (aDate - bDate) * dir
      }
      default:
        return 0
    }
  })

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === learningPaths.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(learningPaths.map((lp) => lp.id)))
    }
  }

  async function handleDelete(id: string, title: string) {
    try {
      const res = await fetch(`/api/admin/learning-paths/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (res.status === 409 && data.requiresConfirmation) {
        setDeleteConfirm({ id, title, progressCount: data.progressCount })
        return
      }

      if (res.ok) {
        fetchLearningPaths()
      }
    } catch {
      console.error('Failed to delete')
    }
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    try {
      const res = await fetch(`/api/admin/learning-paths/${deleteConfirm.id}?confirm=true`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteConfirm(null)
        fetchLearningPaths()
      }
    } catch {
      console.error('Failed to delete')
    }
  }

  async function handleBulkAction() {
    if (!bulkAction || selectedIds.size === 0) return
    setBulkLoading(true)

    try {
      const payload: Record<string, unknown> = {
        ids: Array.from(selectedIds),
        action: bulkAction,
      }
      if (bulkAction === 'changeTier') {
        payload.accessTier = bulkTier
      }

      const res = await fetch('/api/admin/learning-paths/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setSelectedIds(new Set())
        setBulkAction('')
        fetchLearningPaths()
      }
    } catch {
      console.error('Failed to perform bulk action')
    } finally {
      setBulkLoading(false)
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function SortHeader({ field, label }: { field: SortField; label: string }) {
    const isActive = sortField === field
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-diligent-gray-3 hover:text-diligent-gray-5"
      >
        {label}
        {isActive && (
          <span className="material-symbols-sharp text-[14px]">
            {sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}
          </span>
        )}
      </button>
    )
  }

  const startItem = (page - 1) * 20 + 1
  const endItem = Math.min(page * 20, total)

  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-sharp absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-diligent-gray-3">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search learning paths..."
              className="w-full border border-diligent-gray-2 rounded pl-10 pr-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ContentStatus | '')
              setPage(1)
            }}
            className="border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-diligent-gray-1 px-4 py-3">
          <span className="text-sm font-medium text-diligent-gray-5">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border border-diligent-gray-2 rounded px-3 py-1.5 text-sm"
            >
              <option value="">Action...</option>
              <option value="publish">Publish</option>
              <option value="draft">Set to draft</option>
              <option value="archive">Archive</option>
              <option value="changeTier">Change tier</option>
            </select>
            {bulkAction === 'changeTier' && (
              <select
                value={bulkTier}
                onChange={(e) => setBulkTier(e.target.value as AccessTier)}
                className="border border-diligent-gray-2 rounded px-3 py-1.5 text-sm"
              >
                <option value="FREE">Free</option>
                <option value="GATED">Gated</option>
                <option value="PREMIUM">Premium</option>
              </select>
            )}
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || bulkLoading}
              className="rounded bg-diligent-red px-3 py-1.5 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
            >
              {bulkLoading ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-diligent-gray-2 text-left">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={learningPaths.length > 0 && selectedIds.size === learningPaths.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-diligent-gray-2 text-diligent-red focus:ring-diligent-red"
                />
              </th>
              <th className="px-4 py-3">
                <SortHeader field="title" label="Title" />
              </th>
              <th className="px-4 py-3">
                <SortHeader field="status" label="Status" />
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">
                Tier
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">
                Items
              </th>
              <th className="px-4 py-3">
                <SortHeader field="publishedAt" label="Published" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-diligent-gray-3">
                  <span className="material-symbols-sharp animate-pulse text-[32px]">hourglass_empty</span>
                  <p className="mt-2 text-sm">Loading learning paths...</p>
                </td>
              </tr>
            ) : sortedPaths.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <span className="material-symbols-sharp text-[40px] text-diligent-gray-3">route</span>
                  <p className="mt-2 text-sm text-diligent-gray-4">
                    {debouncedSearch || statusFilter
                      ? 'No learning paths match your filters.'
                      : 'No learning paths yet. Create your first learning path to get started.'}
                  </p>
                </td>
              </tr>
            ) : (
              sortedPaths.map((lp) => (
                <tr key={lp.id} className="border-b border-diligent-gray-1 hover:bg-diligent-gray-1/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(lp.id)}
                      onChange={() => toggleSelect(lp.id)}
                      className="h-4 w-4 rounded border-diligent-gray-2 text-diligent-red focus:ring-diligent-red"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/learning-paths/${lp.id}`}
                      className="font-medium text-diligent-gray-5 hover:text-link"
                    >
                      {lp.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lp.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tierStyles[lp.accessTier]}`}>
                      {tierLabels[lp.accessTier]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-diligent-gray-4">
                    {lp._count.items}
                  </td>
                  <td className="px-4 py-3 text-diligent-gray-4">
                    {formatDate(lp.publishedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/learning-paths/${lp.id}`}
                        className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5"
                        title="Edit"
                      >
                        <span className="material-symbols-sharp text-[20px]">edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(lp.id, lp.title)}
                        className="rounded p-1 text-diligent-gray-4 hover:text-diligent-red"
                        title="Delete"
                      >
                        <span className="material-symbols-sharp text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-diligent-gray-4">
          <span>
            Showing {startItem}-{endItem} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-diligent-gray-2 px-3 py-1.5 text-sm hover:bg-diligent-gray-1 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded border border-diligent-gray-2 px-3 py-1.5 text-sm hover:bg-diligent-gray-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete learning path"
          message={
            deleteConfirm.progressCount
              ? `This learning path has ${deleteConfirm.progressCount} learner progress record(s). Deleting it will remove all learner progress data. Are you sure you want to delete "${deleteConfirm.title}"?`
              : `Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`
          }
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
