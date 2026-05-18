'use client'

import { useState } from 'react'

interface PreviewButtonProps {
  contentType: 'COURSE' | 'TEMPLATE' | 'VIDEO' | 'LEARNING_PATH'
  contentId?: string
  disabled?: boolean
}

export default function PreviewButton({ contentType, contentId, disabled }: PreviewButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isDisabled = disabled || !contentId

  async function handlePreview() {
    if (isDisabled || !contentId) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate preview')
        return
      }

      // Open preview in a new tab
      window.open(data.url, '_blank')
    } catch {
      setError('Failed to generate preview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex items-center gap-3">
      <button
        type="button"
        onClick={handlePreview}
        disabled={isDisabled || loading}
        title={isDisabled ? 'Save as draft first to preview' : undefined}
        className="group inline-flex items-center gap-1.5 rounded bg-[#0B4CCE] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0941b0] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="material-symbols-sharp text-[18px]">visibility</span>
        {loading ? 'Generating...' : 'Preview'}
      </button>
      {isDisabled && (
        <span className="text-xs text-diligent-gray-4">Save as draft first to preview</span>
      )}
      {error && (
        <span className="text-sm text-diligent-red">{error}</span>
      )}
    </div>
  )
}
