'use client'

import { useState, useEffect, useCallback } from 'react'
import RichTextEditor from '@/components/admin/RichTextEditor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HubSettingsFormProps {
  initialSettings: {
    librarySectionHeading: string | null
    librarySectionBody: string | null
    footerHeading: string | null
    footerBody: string | null
    footerCTAText: string | null
  }
}

type SettingsData = {
  librarySectionHeading: string
  librarySectionBody: string
  footerHeading: string
  footerBody: string
  footerCTAText: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toFormData(settings: HubSettingsFormProps['initialSettings']): SettingsData {
  return {
    librarySectionHeading: settings.librarySectionHeading ?? '',
    librarySectionBody: settings.librarySectionBody ?? '',
    footerHeading: settings.footerHeading ?? '',
    footerBody: settings.footerBody ?? '',
    footerCTAText: settings.footerCTAText ?? '',
  }
}

// ---------------------------------------------------------------------------
// Reusable form field components
// ---------------------------------------------------------------------------

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-diligent-gray-5 mb-1">
      {children}
    </label>
  )
}

function TextInput({
  id,
  value,
  onChange,
  type = 'text',
}: {
  id: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
    />
  )
}


function SectionCard({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <h2 className="text-heading-3 font-bold text-diligent-gray-5">{heading}</h2>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export default function HubSettingsForm({ initialSettings }: HubSettingsFormProps) {
  const [formData, setFormData] = useState<SettingsData>(() => toFormData(initialSettings))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const initialFormData = toFormData(initialSettings)
  const hasChanges = Object.keys(formData).some(
    (key) => formData[key as keyof SettingsData] !== initialFormData[key as keyof SettingsData]
  )

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const updateField = useCallback((field: keyof SettingsData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
        return
      }

      setMessage({ type: 'success', text: 'Settings saved successfully' })
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status message */}
      {message && (
        <div
          className={`rounded px-4 py-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-diligent-red border border-red-200'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Resource Library */}
      <SectionCard heading="Resource library">
        <div>
          <FieldLabel htmlFor="librarySectionHeading">Section heading</FieldLabel>
          <TextInput
            id="librarySectionHeading"
            value={formData.librarySectionHeading}
            onChange={(v) => updateField('librarySectionHeading', v)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="librarySectionBody">Body text</FieldLabel>
          <RichTextEditor
            id="librarySectionBody"
            value={formData.librarySectionBody}
            onChange={(v) => updateField('librarySectionBody', v)}
          />
        </div>
      </SectionCard>

      {/* Footer CTA */}
      <SectionCard heading="Footer CTA">
        <div>
          <FieldLabel htmlFor="footerHeading">Heading</FieldLabel>
          <TextInput
            id="footerHeading"
            value={formData.footerHeading}
            onChange={(v) => updateField('footerHeading', v)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="footerBody">Body text</FieldLabel>
          <RichTextEditor
            id="footerBody"
            value={formData.footerBody}
            onChange={(v) => updateField('footerBody', v)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="footerCTAText">CTA button text</FieldLabel>
          <TextInput
            id="footerCTAText"
            value={formData.footerCTAText}
            onChange={(v) => updateField('footerCTAText', v)}
          />
        </div>
      </SectionCard>

      {/* Submit */}
      <div className="flex items-center justify-end gap-4">
        {hasChanges && (
          <span className="text-xs text-diligent-gray-4">Unsaved changes</span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-diligent-red px-6 py-2.5 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
