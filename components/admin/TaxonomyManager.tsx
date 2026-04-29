'use client'

import { useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaxonomyItem {
  id: string
  name: string
  slug: string
}

interface SubjectItem extends TaxonomyItem {
  groupId: string
  group: { id: string; name: string; slug: string }
}

interface SubjectGroupItem extends TaxonomyItem {
  subjects: SubjectItem[]
}

interface TaxonomyManagerProps {
  initialPersonas: TaxonomyItem[]
  initialRegions: TaxonomyItem[]
  initialSubjectGroups: SubjectGroupItem[]
}

type TabKey = 'personas' | 'regions' | 'subjects'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
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
  return (
    <p className="mt-1 text-xs text-diligent-red">{message}</p>
  )
}

// ---------------------------------------------------------------------------
// TaxonomyTable (Personas / Regions)
// ---------------------------------------------------------------------------

function TaxonomyTable({
  type,
  items: initialItems,
  apiPath,
}: {
  type: 'persona' | 'region'
  items: TaxonomyItem[]
  apiPath: string
}) {
  const [items, setItems] = useState<TaxonomyItem[]>(initialItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string
    name: string
    usageCount: number
  } | null>(null)

  const label = type === 'persona' ? 'Persona' : 'Region'

  function startEdit(item: TaxonomyItem) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditSlug(item.slug)
    setSlugManuallyEdited(true)
    setAddingNew(false)
    setError(null)
  }

  function startAdd() {
    setAddingNew(true)
    setEditingId(null)
    setEditName('')
    setEditSlug('')
    setSlugManuallyEdited(false)
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setAddingNew(false)
    setEditName('')
    setEditSlug('')
    setError(null)
  }

  function handleNameChange(value: string) {
    setEditName(value)
    if (!slugManuallyEdited) {
      setEditSlug(generateSlug(value))
    }
  }

  function handleSlugChange(value: string) {
    setEditSlug(value)
    setSlugManuallyEdited(true)
  }

  async function saveNew() {
    if (!editName.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/taxonomy/${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim() || generateSlug(editName),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create')
        return
      }
      const created: TaxonomyItem = await res.json()
      setItems((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      )
      cancelEdit()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit() {
    if (!editingId) return
    if (!editName.trim()) {
      setError('Name is required')
      return
    }
    if (!editSlug.trim()) {
      setError('Slug is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/taxonomy/${apiPath}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), slug: editSlug.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update')
        return
      }
      const updated: TaxonomyItem = await res.json()
      setItems((prev) =>
        prev
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      cancelEdit()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item: TaxonomyItem) {
    try {
      const res = await fetch(`/api/admin/taxonomy/${apiPath}/${item.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.requiresConfirmation) {
        setConfirmDelete({
          id: item.id,
          name: item.name,
          usageCount: data.usageCount,
        })
        return
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id))
    } catch {
      setError('Failed to delete')
    }
  }

  async function confirmDeleteAction() {
    if (!confirmDelete) return
    try {
      const res = await fetch(
        `/api/admin/taxonomy/${apiPath}/${confirmDelete.id}?confirm=true`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== confirmDelete.id))
      }
    } catch {
      setError('Failed to delete')
    } finally {
      setConfirmDelete(null)
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-diligent-gray-5">
          {label}s ({items.length})
        </h3>
        <button
          onClick={startAdd}
          disabled={addingNew || editingId !== null}
          className="rounded bg-diligent-red px-4 py-2 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
        >
          Add {label.toLowerCase()}
        </button>
      </div>

      {error && <InlineError message={error} />}

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-diligent-gray-2 text-left text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">
            <th className="pb-2">Name</th>
            <th className="pb-2">Slug</th>
            <th className="pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {addingNew && (
            <tr className="border-b border-diligent-gray-2">
              <td className="py-2 pr-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Name"
                  autoFocus
                  className="w-full border border-diligent-gray-2 rounded px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                />
              </td>
              <td className="py-2 pr-3">
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="slug"
                  className="w-full border border-diligent-gray-2 rounded px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                />
              </td>
              <td className="py-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={saveNew}
                    disabled={saving}
                    className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-50"
                    title="Save"
                  >
                    <span className="material-symbols-sharp text-[20px]">check</span>
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5"
                    title="Cancel"
                  >
                    <span className="material-symbols-sharp text-[20px]">close</span>
                  </button>
                </div>
              </td>
            </tr>
          )}
          {items.map((item) => (
            <tr key={item.id} className="border-b border-diligent-gray-2">
              {editingId === item.id ? (
                <>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      autoFocus
                      className="w-full border border-diligent-gray-2 rounded px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={editSlug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="w-full border border-diligent-gray-2 rounded px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-50"
                        title="Save"
                      >
                        <span className="material-symbols-sharp text-[20px]">check</span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5"
                        title="Cancel"
                      >
                        <span className="material-symbols-sharp text-[20px]">close</span>
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="py-2 pr-3 text-diligent-gray-5">{item.name}</td>
                  <td className="py-2 pr-3 text-diligent-gray-4">{item.slug}</td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(item)}
                        disabled={addingNew || editingId !== null}
                        className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-50"
                        title="Edit"
                      >
                        <span className="material-symbols-sharp text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={addingNew || editingId !== null}
                        className="rounded p-1 text-diligent-gray-4 hover:text-diligent-red disabled:opacity-50"
                        title="Delete"
                      >
                        <span className="material-symbols-sharp text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
          {items.length === 0 && !addingNew && (
            <tr>
              <td colSpan={3} className="py-6 text-center text-sm text-diligent-gray-3">
                No {label.toLowerCase()}s yet. Click &quot;Add {label.toLowerCase()}&quot; to create one.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${label.toLowerCase()}`}
          message={`This ${label.toLowerCase()} is used by ${confirmDelete.usageCount} content item(s). Deleting it will remove it from all tagged content. Continue?`}
          onConfirm={confirmDeleteAction}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SubjectGroupSection
// ---------------------------------------------------------------------------

function SubjectGroupSection({
  group: initialGroup,
  onDelete,
  onUpdate,
}: {
  group: SubjectGroupItem
  onDelete: (id: string) => void
  onUpdate: (group: SubjectGroupItem) => void
}) {
  const [group, setGroup] = useState(initialGroup)
  const [collapsed, setCollapsed] = useState(false)
  const [editingGroup, setEditingGroup] = useState(false)
  const [editName, setEditName] = useState(group.name)
  const [editSlug, setEditSlug] = useState(group.slug)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Subject editing state
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [addingSubject, setAddingSubject] = useState(false)
  const [subEditName, setSubEditName] = useState('')
  const [subEditSlug, setSubEditSlug] = useState('')
  const [subSlugManual, setSubSlugManual] = useState(false)
  const [subError, setSubError] = useState<string | null>(null)
  const [subSaving, setSubSaving] = useState(false)
  const [confirmDeleteSubject, setConfirmDeleteSubject] = useState<{
    id: string
    name: string
    usageCount: number
  } | null>(null)

  const isEditing = editingGroup || editingSubjectId !== null || addingSubject

  // Group editing
  function startGroupEdit() {
    setEditingGroup(true)
    setEditName(group.name)
    setEditSlug(group.slug)
    setSlugManuallyEdited(true)
    setError(null)
  }

  function cancelGroupEdit() {
    setEditingGroup(false)
    setError(null)
  }

  function handleGroupNameChange(value: string) {
    setEditName(value)
    if (!slugManuallyEdited) {
      setEditSlug(generateSlug(value))
    }
  }

  async function saveGroupEdit() {
    if (!editName.trim()) {
      setError('Name is required')
      return
    }
    if (!editSlug.trim()) {
      setError('Slug is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/taxonomy/subject-groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), slug: editSlug.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update')
        return
      }
      const updated: SubjectGroupItem = await res.json()
      setGroup((prev) => ({ ...prev, name: updated.name, slug: updated.slug }))
      onUpdate({ ...group, name: updated.name, slug: updated.slug })
      setEditingGroup(false)
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  // Subject editing
  function startSubjectEdit(subject: SubjectItem) {
    setEditingSubjectId(subject.id)
    setSubEditName(subject.name)
    setSubEditSlug(subject.slug)
    setSubSlugManual(true)
    setAddingSubject(false)
    setSubError(null)
  }

  function startSubjectAdd() {
    setAddingSubject(true)
    setEditingSubjectId(null)
    setSubEditName('')
    setSubEditSlug('')
    setSubSlugManual(false)
    setSubError(null)
  }

  function cancelSubjectEdit() {
    setEditingSubjectId(null)
    setAddingSubject(false)
    setSubEditName('')
    setSubEditSlug('')
    setSubError(null)
  }

  function handleSubNameChange(value: string) {
    setSubEditName(value)
    if (!subSlugManual) {
      setSubEditSlug(generateSlug(value))
    }
  }

  function handleSubSlugChange(value: string) {
    setSubEditSlug(value)
    setSubSlugManual(true)
  }

  async function saveNewSubject() {
    if (!subEditName.trim()) {
      setSubError('Name is required')
      return
    }
    setSubSaving(true)
    setSubError(null)
    try {
      const res = await fetch('/api/admin/taxonomy/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subEditName.trim(),
          slug: subEditSlug.trim() || generateSlug(subEditName),
          groupId: group.id,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setSubError(data.error || 'Failed to create')
        return
      }
      const created: SubjectItem = await res.json()
      setGroup((prev) => ({
        ...prev,
        subjects: [...prev.subjects, created].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      }))
      cancelSubjectEdit()
    } catch {
      setSubError('Network error')
    } finally {
      setSubSaving(false)
    }
  }

  async function saveSubjectEdit() {
    if (!editingSubjectId) return
    if (!subEditName.trim()) {
      setSubError('Name is required')
      return
    }
    if (!subEditSlug.trim()) {
      setSubError('Slug is required')
      return
    }
    setSubSaving(true)
    setSubError(null)
    try {
      const res = await fetch(`/api/admin/taxonomy/subjects/${editingSubjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subEditName.trim(),
          slug: subEditSlug.trim(),
          groupId: group.id,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setSubError(data.error || 'Failed to update')
        return
      }
      const updated: SubjectItem = await res.json()
      setGroup((prev) => ({
        ...prev,
        subjects: prev.subjects
          .map((s) => (s.id === updated.id ? updated : s))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      cancelSubjectEdit()
    } catch {
      setSubError('Network error')
    } finally {
      setSubSaving(false)
    }
  }

  async function handleSubjectDelete(subject: SubjectItem) {
    try {
      const res = await fetch(`/api/admin/taxonomy/subjects/${subject.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.requiresConfirmation) {
        setConfirmDeleteSubject({
          id: subject.id,
          name: subject.name,
          usageCount: data.usageCount,
        })
        return
      }
      setGroup((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => s.id !== subject.id),
      }))
    } catch {
      setSubError('Failed to delete')
    }
  }

  async function confirmSubjectDeleteAction() {
    if (!confirmDeleteSubject) return
    try {
      const res = await fetch(
        `/api/admin/taxonomy/subjects/${confirmDeleteSubject.id}?confirm=true`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setGroup((prev) => ({
          ...prev,
          subjects: prev.subjects.filter((s) => s.id !== confirmDeleteSubject.id),
        }))
      }
    } catch {
      setSubError('Failed to delete')
    } finally {
      setConfirmDeleteSubject(null)
    }
  }

  return (
    <div className="rounded-lg border border-diligent-gray-2 bg-white">
      {/* Group header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <span className="material-symbols-sharp text-[20px]">
            {collapsed ? 'expand_more' : 'expand_less'}
          </span>
        </button>

        {editingGroup ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => handleGroupNameChange(e.target.value)}
              autoFocus
              className="border border-diligent-gray-2 rounded px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
            />
            <input
              type="text"
              value={editSlug}
              onChange={(e) => {
                setEditSlug(e.target.value)
                setSlugManuallyEdited(true)
              }}
              className="border border-diligent-gray-2 rounded px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
            />
            <button
              onClick={saveGroupEdit}
              disabled={saving}
              className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-50"
              title="Save"
            >
              <span className="material-symbols-sharp text-[20px]">check</span>
            </button>
            <button
              onClick={cancelGroupEdit}
              className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5"
              title="Cancel"
            >
              <span className="material-symbols-sharp text-[20px]">close</span>
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 font-bold text-diligent-gray-5">
              {group.name}
            </span>
            <span className="rounded-full bg-diligent-gray-1 px-2 py-0.5 text-xs font-medium text-diligent-gray-4">
              {group.subjects.length} subject{group.subjects.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={startGroupEdit}
              disabled={isEditing}
              className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-50"
              title="Edit group"
            >
              <span className="material-symbols-sharp text-[20px]">edit</span>
            </button>
            <button
              onClick={() => onDelete(group.id)}
              disabled={isEditing}
              className="rounded p-1 text-diligent-gray-4 hover:text-diligent-red disabled:opacity-50"
              title="Delete group"
            >
              <span className="material-symbols-sharp text-[20px]">delete</span>
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="px-4">
          <InlineError message={error} />
        </div>
      )}

      {/* Subjects */}
      {!collapsed && (
        <div className="border-t border-diligent-gray-2 px-4 py-3">
          {subError && <InlineError message={subError} />}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-diligent-gray-2 text-left text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">
                <th className="pb-2">Name</th>
                <th className="pb-2">Slug</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {addingSubject && (
                <tr className="border-b border-diligent-gray-2">
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={subEditName}
                      onChange={(e) => handleSubNameChange(e.target.value)}
                      placeholder="Name"
                      autoFocus
                      className="w-full border border-diligent-gray-2 rounded px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={subEditSlug}
                      onChange={(e) => handleSubSlugChange(e.target.value)}
                      placeholder="slug"
                      className="w-full border border-diligent-gray-2 rounded px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={saveNewSubject}
                        disabled={subSaving}
                        className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-50"
                        title="Save"
                      >
                        <span className="material-symbols-sharp text-[20px]">check</span>
                      </button>
                      <button
                        onClick={cancelSubjectEdit}
                        className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5"
                        title="Cancel"
                      >
                        <span className="material-symbols-sharp text-[20px]">close</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {group.subjects.map((subject) => (
                <tr key={subject.id} className="border-b border-diligent-gray-2">
                  {editingSubjectId === subject.id ? (
                    <>
                      <td className="py-2 pr-3">
                        <input
                          type="text"
                          value={subEditName}
                          onChange={(e) => handleSubNameChange(e.target.value)}
                          autoFocus
                          className="w-full border border-diligent-gray-2 rounded px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="text"
                          value={subEditSlug}
                          onChange={(e) => handleSubSlugChange(e.target.value)}
                          className="w-full border border-diligent-gray-2 rounded px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                        />
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={saveSubjectEdit}
                            disabled={subSaving}
                            className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-50"
                            title="Save"
                          >
                            <span className="material-symbols-sharp text-[20px]">check</span>
                          </button>
                          <button
                            onClick={cancelSubjectEdit}
                            className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5"
                            title="Cancel"
                          >
                            <span className="material-symbols-sharp text-[20px]">close</span>
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 pr-3 text-diligent-gray-5">{subject.name}</td>
                      <td className="py-2 pr-3 text-diligent-gray-4">{subject.slug}</td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startSubjectEdit(subject)}
                            disabled={isEditing}
                            className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-50"
                            title="Edit"
                          >
                            <span className="material-symbols-sharp text-[20px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleSubjectDelete(subject)}
                            disabled={isEditing}
                            className="rounded p-1 text-diligent-gray-4 hover:text-diligent-red disabled:opacity-50"
                            title="Delete"
                          >
                            <span className="material-symbols-sharp text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {group.subjects.length === 0 && !addingSubject && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-sm text-diligent-gray-3">
                    No subjects in this group yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-3">
            <button
              onClick={startSubjectAdd}
              disabled={isEditing}
              className="rounded bg-diligent-red px-3 py-1.5 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
            >
              Add subject
            </button>
          </div>
        </div>
      )}

      {confirmDeleteSubject && (
        <ConfirmModal
          title="Delete subject"
          message={`This subject is used by ${confirmDeleteSubject.usageCount} content item(s). Deleting it will remove it from all tagged content. Continue?`}
          onConfirm={confirmSubjectDeleteAction}
          onCancel={() => setConfirmDeleteSubject(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SubjectsTab
// ---------------------------------------------------------------------------

function SubjectsTab({
  initialGroups,
}: {
  initialGroups: SubjectGroupItem[]
}) {
  const [groups, setGroups] = useState<SubjectGroupItem[]>(initialGroups)
  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupSlug, setNewGroupSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<{
    id: string
    name: string
    subjectCount: number
  } | null>(null)

  function handleNameChange(value: string) {
    setNewGroupName(value)
    if (!slugManual) {
      setNewGroupSlug(generateSlug(value))
    }
  }

  async function saveNewGroup() {
    if (!newGroupName.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/taxonomy/subject-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          slug: newGroupSlug.trim() || generateSlug(newGroupName),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create')
        return
      }
      const created: SubjectGroupItem = await res.json()
      setGroups((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      )
      setAddingGroup(false)
      setNewGroupName('')
      setNewGroupSlug('')
      setSlugManual(false)
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    try {
      const res = await fetch(`/api/admin/taxonomy/subject-groups/${groupId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.requiresConfirmation) {
        const groupItem = groups.find((g) => g.id === groupId)
        setConfirmDeleteGroup({
          id: groupId,
          name: groupItem?.name ?? 'this group',
          subjectCount: data.subjectCount,
        })
        return
      }
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
    } catch {
      setError('Failed to delete group')
    }
  }, [groups])

  async function confirmGroupDeleteAction() {
    if (!confirmDeleteGroup) return
    try {
      const res = await fetch(
        `/api/admin/taxonomy/subject-groups/${confirmDeleteGroup.id}?confirm=true`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== confirmDeleteGroup.id))
      }
    } catch {
      setError('Failed to delete group')
    } finally {
      setConfirmDeleteGroup(null)
    }
  }

  const handleUpdateGroup = useCallback((updated: SubjectGroupItem) => {
    setGroups((prev) =>
      prev
        .map((g) => (g.id === updated.id ? { ...g, name: updated.name, slug: updated.slug } : g))
        .sort((a, b) => a.name.localeCompare(b.name))
    )
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-diligent-gray-5">
          Subject groups ({groups.length})
        </h3>
        <button
          onClick={() => {
            setAddingGroup(true)
            setError(null)
          }}
          disabled={addingGroup}
          className="rounded bg-diligent-red px-4 py-2 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
        >
          Add group
        </button>
      </div>

      {error && <InlineError message={error} />}

      {addingGroup && (
        <div className="flex items-center gap-2 rounded-lg border border-diligent-gray-2 bg-white px-4 py-3">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Group name"
            autoFocus
            className="border border-diligent-gray-2 rounded px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
          <input
            type="text"
            value={newGroupSlug}
            onChange={(e) => {
              setNewGroupSlug(e.target.value)
              setSlugManual(true)
            }}
            placeholder="slug"
            className="border border-diligent-gray-2 rounded px-2 py-1 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
          <button
            onClick={saveNewGroup}
            disabled={saving}
            className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5 disabled:opacity-50"
            title="Save"
          >
            <span className="material-symbols-sharp text-[20px]">check</span>
          </button>
          <button
            onClick={() => {
              setAddingGroup(false)
              setNewGroupName('')
              setNewGroupSlug('')
              setError(null)
            }}
            className="rounded p-1 text-diligent-gray-4 hover:text-diligent-gray-5"
            title="Cancel"
          >
            <span className="material-symbols-sharp text-[20px]">close</span>
          </button>
        </div>
      )}

      {groups.map((group) => (
        <SubjectGroupSection
          key={group.id}
          group={group}
          onDelete={handleDeleteGroup}
          onUpdate={handleUpdateGroup}
        />
      ))}

      {groups.length === 0 && !addingGroup && (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <span className="material-symbols-sharp text-[40px] text-diligent-gray-3">
            folder_open
          </span>
          <p className="mt-2 text-sm text-diligent-gray-4">
            No subject groups yet. Click &quot;Add group&quot; to create one.
          </p>
        </div>
      )}

      {confirmDeleteGroup && (
        <ConfirmModal
          title="Delete subject group"
          message={`This group contains ${confirmDeleteGroup.subjectCount} subject(s). Deleting it will also delete all subjects within it and remove them from all tagged content. Continue?`}
          onConfirm={confirmGroupDeleteAction}
          onCancel={() => setConfirmDeleteGroup(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main TaxonomyManager
// ---------------------------------------------------------------------------

const TABS: { key: TabKey; label: string }[] = [
  { key: 'personas', label: 'Personas' },
  { key: 'regions', label: 'Regions' },
  { key: 'subjects', label: 'Subjects' },
]

export default function TaxonomyManager({
  initialPersonas,
  initialRegions,
  initialSubjectGroups,
}: TaxonomyManagerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('personas')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-diligent-gray-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-diligent-red text-diligent-gray-5'
                : 'text-diligent-gray-4 hover:text-diligent-gray-5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'personas' && (
          <TaxonomyTable
            type="persona"
            items={initialPersonas}
            apiPath="personas"
          />
        )}
        {activeTab === 'regions' && (
          <TaxonomyTable
            type="region"
            items={initialRegions}
            apiPath="regions"
          />
        )}
        {activeTab === 'subjects' && (
          <SubjectsTab initialGroups={initialSubjectGroups} />
        )}
      </div>
    </div>
  )
}
