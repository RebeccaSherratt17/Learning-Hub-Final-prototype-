'use client'

import { useState, useCallback, useRef } from 'react'
import ImageUpload from './ImageUpload'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Partner {
  id: string
  name: string
  logoUrl: string
  logoAlt: string | null
  linkUrl: string | null
  order: number
}

interface PartnersManagerProps {
  initialPartners: Partner[]
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
// Add Partner Form
// ---------------------------------------------------------------------------

function AddPartnerForm({
  onSave,
  onCancel,
}: {
  onSave: (partner: Partner) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoAlt, setLogoAlt] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!logoUrl) {
      setError('Logo image is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          logoUrl,
          logoAlt: logoAlt.trim() || null,
          linkUrl: linkUrl.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create partner')
        return
      }

      const created: Partner = await res.json()
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
        Add new partner
      </h3>

      {error && (
        <p className="mb-3 text-xs text-diligent-red">{error}</p>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="partner-name"
            className="mb-1 block text-sm font-medium text-diligent-gray-5"
          >
            Name <span className="text-diligent-red">*</span>
          </label>
          <input
            id="partner-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Partner organisation name"
            autoFocus
            className="w-full rounded-md border border-diligent-gray-2 px-3 py-2 text-sm text-diligent-gray-5 placeholder:text-diligent-gray-3 focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        <div>
          <ImageUpload
            folder="partners"
            onUpload={(url, alt) => {
              setLogoUrl(url)
              setLogoAlt(alt)
            }}
            onRemove={() => {
              setLogoUrl('')
              setLogoAlt('')
            }}
            label="Logo *"
            hint="Upload the partner logo image"
          />
        </div>

        <div>
          <label
            htmlFor="partner-link"
            className="mb-1 block text-sm font-medium text-diligent-gray-5"
          >
            Link URL
          </label>
          <input
            id="partner-link"
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border border-diligent-gray-2 px-3 py-2 text-sm text-diligent-gray-5 placeholder:text-diligent-gray-3 focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-diligent-red px-4 py-2 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save partner'}
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
// Partner Card
// ---------------------------------------------------------------------------

function PartnerCard({
  partner,
  isFirst,
  isLast,
  disabled,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  partner: Partner
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
      {/* Logo preview */}
      <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded border border-diligent-gray-2 bg-diligent-gray-1 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={partner.logoUrl}
          alt={partner.logoAlt || partner.name}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-diligent-gray-5">
          {partner.name}
        </p>
        {partner.linkUrl && (
          <p className="mt-0.5 truncate text-xs text-diligent-gray-3">
            {partner.linkUrl}
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
// Edit Partner Card
// ---------------------------------------------------------------------------

function EditPartnerCard({
  partner,
  onSave,
  onCancel,
}: {
  partner: Partner
  onSave: (updated: Partner) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(partner.name)
  const [logoUrl, setLogoUrl] = useState(partner.logoUrl)
  const [logoAlt, setLogoAlt] = useState(partner.logoAlt || '')
  const [linkUrl, setLinkUrl] = useState(partner.linkUrl || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!logoUrl) {
      setError('Logo image is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          logoUrl,
          logoAlt: logoAlt.trim() || null,
          linkUrl: linkUrl.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update partner')
        return
      }

      const updated: Partner = await res.json()
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
            htmlFor={`edit-name-${partner.id}`}
            className="mb-1 block text-sm font-medium text-diligent-gray-5"
          >
            Name <span className="text-diligent-red">*</span>
          </label>
          <input
            id={`edit-name-${partner.id}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full rounded-md border border-diligent-gray-2 px-3 py-2 text-sm text-diligent-gray-5 placeholder:text-diligent-gray-3 focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        <div>
          <ImageUpload
            folder="partners"
            currentUrl={logoUrl}
            currentAlt={logoAlt}
            onUpload={(url, alt) => {
              setLogoUrl(url)
              setLogoAlt(alt)
            }}
            onRemove={() => {
              setLogoUrl('')
              setLogoAlt('')
            }}
            label="Logo *"
            hint="Upload a replacement logo image"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-link-${partner.id}`}
            className="mb-1 block text-sm font-medium text-diligent-gray-5"
          >
            Link URL
          </label>
          <input
            id={`edit-link-${partner.id}`}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border border-diligent-gray-2 px-3 py-2 text-sm text-diligent-gray-5 placeholder:text-diligent-gray-3 focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
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
// Main PartnersManager
// ---------------------------------------------------------------------------

export default function PartnersManager({
  initialPartners,
}: PartnersManagerProps) {
  const [partners, setPartners] = useState<Partner[]>(initialPartners)
  const [addingNew, setAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Partner | null>(null)
  const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isEditing = addingNew || editingId !== null

  // ----- Reorder -----

  const persistOrder = useCallback((updatedPartners: Partner[]) => {
    if (reorderTimerRef.current) {
      clearTimeout(reorderTimerRef.current)
    }
    reorderTimerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/admin/partners/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: updatedPartners.map((p) => p.id) }),
        })
      } catch (err) {
        console.error('Failed to persist reorder:', err)
      }
    }, 500)
  }, [])

  function movePartner(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= partners.length) return

    setPartners((prev) => {
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[newIndex]
      updated[newIndex] = temp
      // Update order fields locally
      const reordered = updated.map((p, i) => ({ ...p, order: i }))
      persistOrder(reordered)
      return reordered
    })
  }

  // ----- Add -----

  function handleAddSave(created: Partner) {
    setPartners((prev) => [...prev, created])
    setAddingNew(false)
  }

  // ----- Edit -----

  function handleEditSave(updated: Partner) {
    setPartners((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...updated, order: p.order } : p))
    )
    setEditingId(null)
  }

  // ----- Delete -----

  async function handleDeleteConfirm() {
    if (!confirmDelete) return

    try {
      const res = await fetch(`/api/admin/partners/${confirmDelete.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setPartners((prev) => prev.filter((p) => p.id !== confirmDelete.id))
      }
    } catch (err) {
      console.error('Failed to delete partner:', err)
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
          Add partner
        </button>
      </div>

      {/* Add form */}
      {addingNew && (
        <AddPartnerForm
          onSave={handleAddSave}
          onCancel={() => setAddingNew(false)}
        />
      )}

      {/* Partners list */}
      {partners.length === 0 && !addingNew ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <span className="material-symbols-sharp text-[40px] text-diligent-gray-3">
            handshake
          </span>
          <p className="mt-2 text-sm text-diligent-gray-4">
            No educational partners yet. Add your first partner to display
            logos on the homepage.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {partners.map((partner, index) =>
            editingId === partner.id ? (
              <EditPartnerCard
                key={partner.id}
                partner={partner}
                onSave={handleEditSave}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <PartnerCard
                key={partner.id}
                partner={partner}
                isFirst={index === 0}
                isLast={index === partners.length - 1}
                disabled={isEditing}
                onMoveUp={() => movePartner(index, -1)}
                onMoveDown={() => movePartner(index, 1)}
                onEdit={() => {
                  setEditingId(partner.id)
                  setAddingNew(false)
                }}
                onDelete={() => setConfirmDelete(partner)}
              />
            )
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmModal
          title="Delete partner"
          message={`Delete partner '${confirmDelete.name}'? The logo will also be removed.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
