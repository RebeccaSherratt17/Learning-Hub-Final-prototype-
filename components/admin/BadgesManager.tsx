'use client'

import { useState, useCallback, useRef } from 'react'
import ImageUpload from './ImageUpload'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Badge {
  id: string
  name: string
  imageUrl: string
  imageAlt: string | null
  linkUrl: string | null
  order: number
}

interface BadgesManagerProps {
  initialBadges: Badge[]
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
// Add Badge Form
// ---------------------------------------------------------------------------

function AddBadgeForm({
  onSave,
  onCancel,
}: {
  onSave: (badge: Badge) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!imageUrl) {
      setError('Badge image is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          imageUrl,
          imageAlt: imageAlt.trim() || null,
          linkUrl: linkUrl.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create badge')
        return
      }

      const created: Badge = await res.json()
      onSave(created)
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-diligent-gray-2 bg-white p-5">
      <h3 className="mb-4 text-sm font-bold text-diligent-gray-5">
        Add new badge
      </h3>

      {error && (
        <p className="mb-3 text-xs text-diligent-red">{error}</p>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="badge-name"
            className="mb-1 block text-sm font-medium text-diligent-gray-5"
          >
            Name <span className="text-diligent-red">*</span>
          </label>
          <input
            id="badge-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Certification badge name"
            autoFocus
            className="w-full rounded-md border border-diligent-gray-2 px-3 py-2 text-sm text-diligent-gray-5 placeholder:text-diligent-gray-3 focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        <div>
          <ImageUpload
            folder="badges"
            onUpload={(url, alt) => {
              setImageUrl(url)
              setImageAlt(alt)
            }}
            onRemove={() => {
              setImageUrl('')
              setImageAlt('')
            }}
            label="Badge image *"
            hint="Upload the certification badge image"
          />
        </div>

        <div>
          <label
            htmlFor="badge-link"
            className="mb-1 block text-sm font-medium text-diligent-gray-5"
          >
            Link URL
          </label>
          <input
            id="badge-link"
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border border-diligent-gray-2 px-3 py-2 text-sm text-diligent-gray-5 placeholder:text-diligent-gray-3 focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
          <p className="mt-1 text-xs text-diligent-gray-3">
            Destination URL when the badge is clicked (e.g. certification page
            on diligent.com)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-diligent-red px-4 py-2 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save badge'}
          </button>
          <button
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm font-medium text-diligent-gray-4 hover:text-diligent-gray-5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Badge Card
// ---------------------------------------------------------------------------

function BadgeCard({
  badge,
  isFirst,
  isLast,
  disabled,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  badge: Badge
  isFirst: boolean
  isLast: boolean
  disabled: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
      {/* Badge image preview */}
      <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded border border-diligent-gray-2 bg-diligent-gray-1 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={badge.imageUrl}
          alt={badge.imageAlt || badge.name}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-diligent-gray-5">
          {badge.name}
        </p>
        {badge.linkUrl ? (
          <p className="mt-0.5 truncate text-xs text-diligent-gray-3">
            {badge.linkUrl}
          </p>
        ) : (
          <p className="mt-0.5 text-xs italic text-diligent-gray-3">
            No link set
          </p>
        )}
      </div>

      {/* Reorder buttons */}
      <div className="flex shrink-0 flex-col gap-1">
        <button
          onClick={onMoveUp}
          disabled={isFirst || disabled}
          className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-30"
          title="Move up"
        >
          <span className="material-symbols-sharp text-[20px]">
            arrow_upward
          </span>
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast || disabled}
          className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-30"
          title="Move down"
        >
          <span className="material-symbols-sharp text-[20px]">
            arrow_downward
          </span>
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={onEdit}
          disabled={disabled}
          className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-50"
          title="Edit"
        >
          <span className="material-symbols-sharp text-[20px]">edit</span>
        </button>
        <button
          onClick={onDelete}
          disabled={disabled}
          className="rounded p-1 text-diligent-gray-4 hover:text-diligent-red disabled:opacity-50"
          title="Delete"
        >
          <span className="material-symbols-sharp text-[20px]">delete</span>
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Edit Badge Card
// ---------------------------------------------------------------------------

function EditBadgeCard({
  badge,
  onSave,
  onCancel,
}: {
  badge: Badge
  onSave: (updated: Badge) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(badge.name)
  const [imageUrl, setImageUrl] = useState(badge.imageUrl)
  const [imageAlt, setImageAlt] = useState(badge.imageAlt || '')
  const [linkUrl, setLinkUrl] = useState(badge.linkUrl || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!imageUrl) {
      setError('Badge image is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/badges/${badge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          imageUrl,
          imageAlt: imageAlt.trim() || null,
          linkUrl: linkUrl.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update badge')
        return
      }

      const updated: Badge = await res.json()
      onSave(updated)
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border-2 border-diligent-red/30 bg-white p-5 shadow-sm">
      {error && (
        <p className="mb-3 text-xs text-diligent-red">{error}</p>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor={`edit-name-${badge.id}`}
            className="mb-1 block text-sm font-medium text-diligent-gray-5"
          >
            Name <span className="text-diligent-red">*</span>
          </label>
          <input
            id={`edit-name-${badge.id}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full rounded-md border border-diligent-gray-2 px-3 py-2 text-sm text-diligent-gray-5 placeholder:text-diligent-gray-3 focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        <div>
          <ImageUpload
            folder="badges"
            currentUrl={imageUrl}
            currentAlt={imageAlt}
            onUpload={(url, alt) => {
              setImageUrl(url)
              setImageAlt(alt)
            }}
            onRemove={() => {
              setImageUrl('')
              setImageAlt('')
            }}
            label="Badge image *"
            hint="Upload a replacement badge image"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-link-${badge.id}`}
            className="mb-1 block text-sm font-medium text-diligent-gray-5"
          >
            Link URL
          </label>
          <input
            id={`edit-link-${badge.id}`}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border border-diligent-gray-2 px-3 py-2 text-sm text-diligent-gray-5 placeholder:text-diligent-gray-3 focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
          <p className="mt-1 text-xs text-diligent-gray-3">
            Destination URL when the badge is clicked (e.g. certification page
            on diligent.com)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-diligent-red px-4 py-2 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm font-medium text-diligent-gray-4 hover:text-diligent-gray-5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main BadgesManager
// ---------------------------------------------------------------------------

export default function BadgesManager({
  initialBadges,
}: BadgesManagerProps) {
  const [badges, setBadges] = useState<Badge[]>(initialBadges)
  const [addingNew, setAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Badge | null>(null)
  const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isEditing = addingNew || editingId !== null

  // ----- Reorder -----

  const persistOrder = useCallback((updatedBadges: Badge[]) => {
    if (reorderTimerRef.current) {
      clearTimeout(reorderTimerRef.current)
    }
    reorderTimerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/admin/badges/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: updatedBadges.map((b) => b.id) }),
        })
      } catch (err) {
        console.error('Failed to persist reorder:', err)
      }
    }, 500)
  }, [])

  function moveBadge(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= badges.length) return

    setBadges((prev) => {
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[newIndex]
      updated[newIndex] = temp
      // Update order fields locally
      const reordered = updated.map((b, i) => ({ ...b, order: i }))
      persistOrder(reordered)
      return reordered
    })
  }

  // ----- Add -----

  function handleAddSave(created: Badge) {
    setBadges((prev) => [...prev, created])
    setAddingNew(false)
  }

  // ----- Edit -----

  function handleEditSave(updated: Badge) {
    setBadges((prev) =>
      prev.map((b) => (b.id === updated.id ? { ...updated, order: b.order } : b))
    )
    setEditingId(null)
  }

  // ----- Delete -----

  async function handleDeleteConfirm() {
    if (!confirmDelete) return

    try {
      const res = await fetch(`/api/admin/badges/${confirmDelete.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setBadges((prev) => prev.filter((b) => b.id !== confirmDelete.id))
      }
    } catch (err) {
      console.error('Failed to delete badge:', err)
    } finally {
      setConfirmDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with add button */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => {
            setAddingNew(true)
            setEditingId(null)
          }}
          disabled={isEditing}
          className="rounded bg-diligent-red px-4 py-2 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
        >
          Add badge
        </button>
      </div>

      {/* Add form */}
      {addingNew && (
        <AddBadgeForm
          onSave={handleAddSave}
          onCancel={() => setAddingNew(false)}
        />
      )}

      {/* Badges list */}
      {badges.length === 0 && !addingNew ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <span className="material-symbols-sharp text-[40px] text-diligent-gray-3">
            verified
          </span>
          <p className="mt-2 text-sm text-diligent-gray-4">
            No certification badges yet. Add badges to display on the homepage.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {badges.map((badge, index) =>
            editingId === badge.id ? (
              <EditBadgeCard
                key={badge.id}
                badge={badge}
                onSave={handleEditSave}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <BadgeCard
                key={badge.id}
                badge={badge}
                isFirst={index === 0}
                isLast={index === badges.length - 1}
                disabled={isEditing}
                onMoveUp={() => moveBadge(index, -1)}
                onMoveDown={() => moveBadge(index, 1)}
                onEdit={() => {
                  setEditingId(badge.id)
                  setAddingNew(false)
                }}
                onDelete={() => setConfirmDelete(badge)}
              />
            )
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmModal
          title="Delete badge"
          message={`Delete badge '${confirmDelete.name}'? The image will also be removed.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
