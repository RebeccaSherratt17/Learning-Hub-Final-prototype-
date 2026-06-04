'use client'

import { useState, useEffect } from 'react'

interface Author {
  id: string
  name: string
}

interface AuthorSelectProps {
  value: string // authorId or empty string
  onChange: (authorId: string) => void
}

export default function AuthorSelect({ value, onChange }: AuthorSelectProps) {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAuthors() {
      try {
        const res = await fetch('/api/admin/authors')
        if (res.ok) {
          const data: Author[] = await res.json()
          setAuthors(data)
        }
      } catch {
        console.error('Failed to fetch authors')
      } finally {
        setLoading(false)
      }
    }
    fetchAuthors()
  }, [])

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    if (val === '__add_new__') {
      setShowModal(true)
      return
    }
    onChange(val)
  }

  async function handleSaveNew() {
    if (!newName.trim()) {
      setError('Name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create author')
        return
      }

      const created: Author = await res.json()
      setAuthors((prev) => [...prev, created])
      onChange(created.id)
      setShowModal(false)
      setNewName('')
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <select
        value={value}
        onChange={handleSelectChange}
        disabled={loading}
        className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
      >
        <option value="">— No author —</option>
        {authors.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
        <option value="__add_new__">+ Add new</option>
      </select>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-diligent-gray-5">Add new author</h3>

            {error && (
              <p className="mt-2 text-xs text-diligent-red">{error}</p>
            )}

            <div className="mt-4">
              <label htmlFor="new-author-name" className="block text-sm font-medium text-diligent-gray-5 mb-1">
                Name
              </label>
              <input
                id="new-author-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSaveNew()
                  }
                }}
                className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setNewName('')
                  setError(null)
                }}
                className="rounded px-4 py-2 text-sm font-medium text-diligent-gray-4 hover:text-diligent-gray-5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNew}
                disabled={saving}
                className="rounded bg-diligent-red px-4 py-2 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
