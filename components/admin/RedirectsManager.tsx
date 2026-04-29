'use client'

import { useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RedirectItem {
  id: string
  sourcePath: string
  destinationPath: string
  createdAt: string
}

interface RedirectsManagerProps {
  initialRedirects: RedirectItem[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function validateSourcePath(value: string): string | null {
  if (!value.trim()) return 'Source path is required'
  if (!value.trim().startsWith('/')) return 'Source path must start with /'
  return null
}

function validateDestinationPath(value: string): string | null {
  if (!value.trim()) return 'Destination path is required'
  const trimmed = value.trim()
  if (!trimmed.startsWith('/') && !trimmed.startsWith('http')) {
    return 'Destination must start with / or http'
  }
  return null
}

// ---------------------------------------------------------------------------
// Confirmation Modal
// ---------------------------------------------------------------------------

function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
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
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline Error
// ---------------------------------------------------------------------------

function InlineError({ message }: { message: string }) {
  return <p className="mt-1 text-xs text-diligent-red">{message}</p>
}

// ---------------------------------------------------------------------------
// RedirectsManager
// ---------------------------------------------------------------------------

export default function RedirectsManager({
  initialRedirects,
}: RedirectsManagerProps) {
  const [items, setItems] = useState<RedirectItem[]>(initialRedirects)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [editSource, setEditSource] = useState('')
  const [editDest, setEditDest] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    source?: string
    dest?: string
  }>({})
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string
    sourcePath: string
  } | null>(null)

  const isEditing = addingNew || editingId !== null

  // Filter items by search query
  const filteredItems = searchQuery.trim()
    ? items.filter(
        (item) =>
          item.sourcePath
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.destinationPath
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : items

  function startAdd() {
    setAddingNew(true)
    setEditingId(null)
    setEditSource('')
    setEditDest('')
    setError(null)
    setFieldErrors({})
  }

  function startEdit(item: RedirectItem) {
    setEditingId(item.id)
    setEditSource(item.sourcePath)
    setEditDest(item.destinationPath)
    setAddingNew(false)
    setError(null)
    setFieldErrors({})
  }

  function cancelEdit() {
    setEditingId(null)
    setAddingNew(false)
    setEditSource('')
    setEditDest('')
    setError(null)
    setFieldErrors({})
  }

  function validate(): boolean {
    const sourceErr = validateSourcePath(editSource)
    const destErr = validateDestinationPath(editDest)
    const errors: { source?: string; dest?: string } = {}
    if (sourceErr) errors.source = sourceErr
    if (destErr) errors.dest = destErr
    setFieldErrors(errors)
    return !sourceErr && !destErr
  }

  async function saveNew() {
    if (!validate()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePath: editSource.trim(),
          destinationPath: editDest.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create redirect')
        return
      }
      const created: RedirectItem = await res.json()
      setItems((prev) => [created, ...prev])
      cancelEdit()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit() {
    if (!editingId) return
    if (!validate()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/redirects/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePath: editSource.trim(),
          destinationPath: editDest.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update redirect')
        return
      }
      const updated: RedirectItem = await res.json()
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      )
      cancelEdit()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  function requestDelete(item: RedirectItem) {
    setConfirmDelete({ id: item.id, sourcePath: item.sourcePath })
  }

  async function confirmDeleteAction() {
    if (!confirmDelete) return
    try {
      const res = await fetch(`/api/admin/redirects/${confirmDelete.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== confirmDelete.id))
      } else {
        setError('Failed to delete redirect')
      }
    } catch {
      setError('Failed to delete redirect')
    } finally {
      setConfirmDelete(null)
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <span className="material-symbols-sharp pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[20px] text-diligent-gray-3">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search redirects..."
            className="w-full rounded border border-diligent-gray-2 py-2 pl-9 pr-3 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        <button
          onClick={startAdd}
          disabled={isEditing}
          className="rounded bg-diligent-red px-4 py-2 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
        >
          Add redirect
        </button>
      </div>

      {error && (
        <div className="mt-3">
          <InlineError message={error} />
        </div>
      )}

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-diligent-gray-2 text-left text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">
            <th className="pb-2">Source path</th>
            <th className="pb-2">Destination path</th>
            <th className="pb-2">Created</th>
            <th className="pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {addingNew && (
            <tr className="border-b border-diligent-gray-2">
              <td className="py-2 pr-3">
                <input
                  type="text"
                  value={editSource}
                  onChange={(e) => {
                    setEditSource(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, source: undefined }))
                  }}
                  placeholder="/old-path"
                  autoFocus
                  className="w-full rounded border border-diligent-gray-2 px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                />
                {fieldErrors.source && (
                  <InlineError message={fieldErrors.source} />
                )}
              </td>
              <td className="py-2 pr-3">
                <input
                  type="text"
                  value={editDest}
                  onChange={(e) => {
                    setEditDest(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, dest: undefined }))
                  }}
                  placeholder="/new-path or https://..."
                  className="w-full rounded border border-diligent-gray-2 px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                />
                {fieldErrors.dest && (
                  <InlineError message={fieldErrors.dest} />
                )}
              </td>
              <td className="py-2 pr-3 text-diligent-gray-3">&mdash;</td>
              <td className="py-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={saveNew}
                    disabled={saving}
                    className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-50"
                    title="Save"
                  >
                    <span className="material-symbols-sharp text-[20px]">
                      check
                    </span>
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5"
                    title="Cancel"
                  >
                    <span className="material-symbols-sharp text-[20px]">
                      close
                    </span>
                  </button>
                </div>
              </td>
            </tr>
          )}

          {filteredItems.map((item) => (
            <tr key={item.id} className="border-b border-diligent-gray-2">
              {editingId === item.id ? (
                <>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={editSource}
                      onChange={(e) => {
                        setEditSource(e.target.value)
                        setFieldErrors((prev) => ({
                          ...prev,
                          source: undefined,
                        }))
                      }}
                      autoFocus
                      className="w-full rounded border border-diligent-gray-2 px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                    />
                    {fieldErrors.source && (
                      <InlineError message={fieldErrors.source} />
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={editDest}
                      onChange={(e) => {
                        setEditDest(e.target.value)
                        setFieldErrors((prev) => ({
                          ...prev,
                          dest: undefined,
                        }))
                      }}
                      className="w-full rounded border border-diligent-gray-2 px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                    />
                    {fieldErrors.dest && (
                      <InlineError message={fieldErrors.dest} />
                    )}
                  </td>
                  <td className="py-2 pr-3 text-diligent-gray-3">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-50"
                        title="Save"
                      >
                        <span className="material-symbols-sharp text-[20px]">
                          check
                        </span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5"
                        title="Cancel"
                      >
                        <span className="material-symbols-sharp text-[20px]">
                          close
                        </span>
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="py-2 pr-3 font-mono text-diligent-gray-5">
                    {item.sourcePath}
                  </td>
                  <td className="py-2 pr-3 font-mono text-diligent-gray-4">
                    {item.destinationPath}
                  </td>
                  <td className="py-2 pr-3 text-diligent-gray-3">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(item)}
                        disabled={isEditing}
                        className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-50"
                        title="Edit"
                      >
                        <span className="material-symbols-sharp text-[20px]">
                          edit
                        </span>
                      </button>
                      <button
                        onClick={() => requestDelete(item)}
                        disabled={isEditing}
                        className="rounded p-1 text-diligent-gray-4 hover:text-diligent-red disabled:opacity-50"
                        title="Delete"
                      >
                        <span className="material-symbols-sharp text-[20px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}

          {filteredItems.length === 0 && !addingNew && (
            <tr>
              <td
                colSpan={4}
                className="py-6 text-center text-sm text-diligent-gray-3"
              >
                {searchQuery.trim()
                  ? 'No redirects match your search.'
                  : 'No redirects configured.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {confirmDelete && (
        <ConfirmModal
          title="Delete redirect"
          message={`Delete redirect from '${confirmDelete.sourcePath}'?`}
          onConfirm={confirmDeleteAction}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
