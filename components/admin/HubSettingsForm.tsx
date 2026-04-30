'use client'

import { useState, useEffect, useCallback } from 'react'
import RichTextEditor from '@/components/admin/RichTextEditor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HubSettingsFormProps {
  initialSettings: {
    heroHeading: string | null
    heroSubheading: string | null
    heroOverview: string | null
    heroCTAText: string | null
    heroCTAUrl: string | null
    popularSectionHeading: string | null
    partnersSectionHeading: string | null
    librarySectionHeading: string | null
    librarySectionBody: string | null
    certificationsSectionHeading: string | null
    certificationsSectionBody: string | null
    footerHeading: string | null
    footerBody: string | null
    footerCTAText: string | null
    demoCTAUrl: string | null
  }
}

type SettingsData = {
  heroHeading: string
  heroSubheading: string
  heroOverview: string
  heroCTAText: string
  heroCTAUrl: string
  popularSectionHeading: string
  partnersSectionHeading: string
  librarySectionHeading: string
  librarySectionBody: string
  certificationsSectionHeading: string
  certificationsSectionBody: string
  footerHeading: string
  footerBody: string
  footerCTAText: string
  demoCTAUrl: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toFormData(settings: HubSettingsFormProps['initialSettings']): SettingsData {
  return {
    heroHeading: settings.heroHeading ?? '',
    heroSubheading: settings.heroSubheading ?? '',
    heroOverview: settings.heroOverview ?? '',
    heroCTAText: settings.heroCTAText ?? '',
    heroCTAUrl: settings.heroCTAUrl ?? '',
    popularSectionHeading: settings.popularSectionHeading ?? '',
    partnersSectionHeading: settings.partnersSectionHeading ?? '',
    librarySectionHeading: settings.librarySectionHeading ?? '',
    librarySectionBody: settings.librarySectionBody ?? '',
    certificationsSectionHeading: settings.certificationsSectionHeading ?? '',
    certificationsSectionBody: settings.certificationsSectionBody ?? '',
    footerHeading: settings.footerHeading ?? '',
    footerBody: settings.footerBody ?? '',
    footerCTAText: settings.footerCTAText ?? '',
    demoCTAUrl: settings.demoCTAUrl ?? '',
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

function TextArea({
  id,
  value,
  onChange,
  rows,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  rows: number
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
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

      {/* Section 1: Hero */}
      <SectionCard heading="Section 1: Hero">
        <div>
          <FieldLabel htmlFor="heroHeading">Heading</FieldLabel>
          <RichTextEditor
            id="heroHeading"
            value={formData.heroHeading}
            onChange={(v) => updateField('heroHeading', v)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="heroSubheading">Subheading</FieldLabel>
          <RichTextEditor
            id="heroSubheading"
            value={formData.heroSubheading}
            onChange={(v) => updateField('heroSubheading', v)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="heroOverview">Overview text</FieldLabel>
          <RichTextEditor
            id="heroOverview"
            value={formData.heroOverview}
            onChange={(v) => updateField('heroOverview', v)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="heroCTAText">CTA button label</FieldLabel>
          <TextInput
            id="heroCTAText"
            value={formData.heroCTAText}
            onChange={(v) => updateField('heroCTAText', v)}
          />
          <p className="mt-1 text-xs text-diligent-gray-3">
            Leave empty to hide the button
          </p>
        </div>
        <div>
          <FieldLabel htmlFor="heroCTAUrl">CTA button link</FieldLabel>
          <TextInput
            id="heroCTAUrl"
            value={formData.heroCTAUrl}
            onChange={(v) => updateField('heroCTAUrl', v)}
          />
          <p className="mt-1 text-xs text-diligent-gray-3">
            Use #resource-library to scroll to the resource library, or a full URL
          </p>
        </div>
      </SectionCard>

      {/* Section 2: Popular & Featured */}
      <SectionCard heading="Section 2: Popular & featured">
        <div>
          <FieldLabel htmlFor="popularSectionHeading">Section heading</FieldLabel>
          <TextInput
            id="popularSectionHeading"
            value={formData.popularSectionHeading}
            onChange={(v) => updateField('popularSectionHeading', v)}
          />
        </div>
      </SectionCard>

      {/* Section 3: Educational Partners */}
      <SectionCard heading="Section 3: Educational partners">
        <div>
          <FieldLabel htmlFor="partnersSectionHeading">Section heading</FieldLabel>
          <TextInput
            id="partnersSectionHeading"
            value={formData.partnersSectionHeading}
            onChange={(v) => updateField('partnersSectionHeading', v)}
          />
        </div>
      </SectionCard>

      {/* Section 4: Resource Library */}
      <SectionCard heading="Section 4: Resource library">
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

      {/* Section 5: Certifications */}
      <SectionCard heading="Section 6: Certifications">
        <div>
          <FieldLabel htmlFor="certificationsSectionHeading">Section heading</FieldLabel>
          <TextInput
            id="certificationsSectionHeading"
            value={formData.certificationsSectionHeading}
            onChange={(v) => updateField('certificationsSectionHeading', v)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="certificationsSectionBody">Body text</FieldLabel>
          <RichTextEditor
            id="certificationsSectionBody"
            value={formData.certificationsSectionBody}
            onChange={(v) => updateField('certificationsSectionBody', v)}
          />
        </div>
      </SectionCard>

      {/* Section 7: Footer CTA */}
      <SectionCard heading="Section 7: Footer CTA">
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

      {/* Global Settings */}
      <SectionCard heading="Global settings">
        <div>
          <FieldLabel htmlFor="demoCTAUrl">Demo request URL</FieldLabel>
          <TextInput
            id="demoCTAUrl"
            value={formData.demoCTAUrl}
            onChange={(v) => updateField('demoCTAUrl', v)}
            type="url"
          />
          <p className="mt-1 text-xs text-diligent-gray-3">
            The URL visitors are sent to when clicking &quot;Request a demo&quot;
          </p>
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
