'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from './ImageUpload'
import TaxonomySelect from './TaxonomySelect'
import RelatedItemsPicker from './RelatedItemsPicker'
import type { RelatedItem } from './RelatedItemsPicker'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

interface VideoFormProps {
  video?: {
    id: string
    title: string
    slug: string
    description: string
    vidyardUrl: string | null
    duration: string | null
    thumbnailUrl: string | null
    thumbnailAlt: string | null
    ogImageUrl: string | null
    accessTier: 'FREE' | 'GATED' | 'PREMIUM'
    publishedAt: string | null
    scheduledPublishAt: string | null
    status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
    seoTitle: string | null
    seoDescription: string | null
    sku: string | null
    credlyBadgeId: string | null
    personaIds: string[]
    regionIds: string[]
    subjectIds: string[]
  }
  personas: { id: string; name: string }[]
  regions: { id: string; name: string }[]
  subjects: { id: string; name: string; group: { id: string; name: string } }[]
  learningPaths?: { id: string; title: string }[]
  relatedItems?: RelatedItem[]
}

function toDateTimeLocal(isoString: string | null): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function VideoForm({
  video,
  personas,
  regions,
  subjects,
  learningPaths,
  relatedItems: initialRelatedItems,
}: VideoFormProps) {
  const router = useRouter()
  const isEdit = !!video

  // Form state
  const [title, setTitle] = useState(video?.title ?? '')
  const [slug, setSlug] = useState(video?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit)
  const [description, setDescription] = useState(video?.description ?? '')
  const [vidyardUrl, setVidyardUrl] = useState(video?.vidyardUrl ?? '')
  const [duration, setDuration] = useState(video?.duration ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(video?.thumbnailUrl ?? '')
  const [thumbnailAlt, setThumbnailAlt] = useState(video?.thumbnailAlt ?? '')
  const [ogImageUrl, setOgImageUrl] = useState(video?.ogImageUrl ?? '')
  const [accessTier, setAccessTier] = useState(video?.accessTier ?? 'FREE')
  const [publishedAt, setPublishedAt] = useState(toDateTimeLocal(video?.publishedAt ?? null))
  const [scheduledPublishAt, setScheduledPublishAt] = useState(toDateTimeLocal(video?.scheduledPublishAt ?? null))
  const [status, setStatus] = useState(video?.status ?? 'DRAFT')
  const [seoTitle, setSeoTitle] = useState(video?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(video?.seoDescription ?? '')
  const [sku, setSku] = useState(video?.sku ?? '')
  const [credlyBadgeId, setCredlyBadgeId] = useState(video?.credlyBadgeId ?? '')
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(video?.personaIds ?? [])
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>(video?.regionIds ?? [])
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(video?.subjectIds ?? [])
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>(initialRelatedItems ?? [])

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value)
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value))
    }
  }, [slugManuallyEdited])

  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus as 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED')
    if (newStatus === 'PUBLISHED' && !publishedAt) {
      setPublishedAt(toDateTimeLocal(new Date().toISOString()))
    }
  }, [publishedAt])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const payload = {
      title,
      slug,
      description,
      vidyardUrl: vidyardUrl || null,
      duration: duration || null,
      thumbnailUrl: thumbnailUrl || null,
      thumbnailAlt: thumbnailAlt || null,
      ogImageUrl: ogImageUrl || null,
      accessTier,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
      scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt).toISOString() : null,
      status,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      sku: sku || null,
      credlyBadgeId: credlyBadgeId || null,
      personaIds: selectedPersonaIds,
      regionIds: selectedRegionIds,
      subjectIds: selectedSubjectIds,
      relatedItems: relatedItems.map((item) => ({ type: item.type, id: item.id })),
    }

    try {
      const url = isEdit ? `/api/admin/videos/${video.id}` : '/api/admin/videos'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save video' })
        return
      }

      if (isEdit) {
        setMessage({ type: 'success', text: 'Video saved successfully' })
        router.refresh()
      } else {
        const created = await res.json()
        router.push(`/admin/videos/${created.id}`)
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-diligent-gray-5">Basic information</h2>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Title <span className="text-diligent-red">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Slug <span className="text-diligent-red">*</span>
          </label>
          <div className="flex items-center">
            <span className="text-sm text-diligent-gray-4 mr-1">/videos/</span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugManuallyEdited(true)
              }}
              required
              className="flex-1 border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
            />
          </div>
        </div>

        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            SKU
          </label>
          <input
            id="sku"
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Description <span className="text-diligent-red">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
            className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>
      </div>

      {/* Vidyard */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-diligent-gray-5">Vidyard</h2>

        <div>
          <label htmlFor="vidyardUrl" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Vidyard URL/ID
          </label>
          <input
            id="vidyardUrl"
            type="text"
            value={vidyardUrl}
            onChange={(e) => setVidyardUrl(e.target.value)}
            className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
          <p className="mt-1 text-xs text-diligent-gray-3">
            Enter the Vidyard share URL or embed code for this video.
          </p>
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Duration
          </label>
          <input
            id="duration"
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 12:30"
            className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red md:w-1/2"
          />
        </div>
      </div>

      {/* Media */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-diligent-gray-5">Media</h2>

        <ImageUpload
          folder="thumbnails"
          currentUrl={thumbnailUrl || null}
          currentAlt={thumbnailAlt || null}
          onUpload={(url, alt) => {
            setThumbnailUrl(url)
            setThumbnailAlt(alt)
          }}
          onRemove={() => {
            setThumbnailUrl('')
            setThumbnailAlt('')
          }}
          label="Thumbnail image"
          hint="Recommended: 1200x675px (16:9)"
        />

        <div className="pt-4 border-t border-diligent-gray-1">
          <ImageUpload
            folder="og-images"
            currentUrl={ogImageUrl || null}
            currentAlt="Open Graph image"
            onUpload={(url) => {
              setOgImageUrl(url)
            }}
            onRemove={() => {
              setOgImageUrl('')
            }}
            label="Open Graph image"
            hint="Used when sharing on social media"
          />
        </div>
      </div>

      {/* Taxonomy */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-diligent-gray-5 mb-4">Taxonomy</h2>
        <TaxonomySelect
          personas={personas}
          regions={regions}
          subjects={subjects}
          selectedPersonaIds={selectedPersonaIds}
          selectedRegionIds={selectedRegionIds}
          selectedSubjectIds={selectedSubjectIds}
          onPersonasChange={setSelectedPersonaIds}
          onRegionsChange={setSelectedRegionIds}
          onSubjectsChange={setSelectedSubjectIds}
        />
      </div>

      {/* Access */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-diligent-gray-5">Access</h2>

        <div>
          <span className="block text-sm font-medium text-diligent-gray-5 mb-2">Access tier</span>
          <div className="flex gap-6">
            {(['FREE', 'GATED', 'PREMIUM'] as const).map((tier) => (
              <label key={tier} className="flex items-center gap-2 text-sm text-diligent-gray-5 cursor-pointer">
                <input
                  type="radio"
                  name="accessTier"
                  value={tier}
                  checked={accessTier === tier}
                  onChange={() => setAccessTier(tier)}
                  className="h-4 w-4 border-diligent-gray-2 text-diligent-red focus:ring-diligent-red"
                />
                {tier === 'FREE' ? 'Free' : tier === 'GATED' ? 'Gated' : 'Premium'}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Publishing */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-diligent-gray-5">Publishing</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-diligent-gray-5 mb-1">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
            >
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label htmlFor="publishedAt" className="block text-sm font-medium text-diligent-gray-5 mb-1">
              Published date
            </label>
            <input
              id="publishedAt"
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
            />
          </div>
        </div>

        {status === 'SCHEDULED' && (
          <div>
            <label htmlFor="scheduledPublishAt" className="block text-sm font-medium text-diligent-gray-5 mb-1">
              Scheduled publish date
            </label>
            <input
              id="scheduledPublishAt"
              type="datetime-local"
              value={scheduledPublishAt}
              onChange={(e) => setScheduledPublishAt(e.target.value)}
              className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red md:w-1/2"
            />
          </div>
        )}
      </div>

      {/* Credly Badge */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-diligent-gray-5">Credly badge</h2>

        <div>
          <label htmlFor="credlyBadgeId" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Credly badge template ID
          </label>
          <input
            id="credlyBadgeId"
            type="text"
            value={credlyBadgeId}
            onChange={(e) => setCredlyBadgeId(e.target.value)}
            className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red md:w-1/2"
          />
          <p className="mt-1 text-xs text-diligent-gray-3">
            Optional. If set, learners who complete this video will receive a Credly badge. Enter the badge template ID from the Credly dashboard.
          </p>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-diligent-gray-5">SEO</h2>

        <div>
          <label htmlFor="seoTitle" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Meta title
          </label>
          <input
            id="seoTitle"
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
          <p className="mt-1 text-xs text-diligent-gray-3">
            {seoTitle.length} characters. Recommended: 50-60 characters.
          </p>
        </div>

        <div>
          <label htmlFor="seoDescription" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Meta description
          </label>
          <textarea
            id="seoDescription"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={3}
            className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
          <p className="mt-1 text-xs text-diligent-gray-3">
            {seoDescription.length} characters. Recommended: 150-160 characters.
          </p>
        </div>
      </div>

      {/* Related Items */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-diligent-gray-5 mb-1">Related items</h2>
        <p className="text-sm text-diligent-gray-3 mb-4">
          Select up to 3 related content items to display on the public page.
        </p>
        <RelatedItemsPicker
          value={relatedItems}
          onChange={setRelatedItems}
          excludeType="VIDEO"
          excludeId={video?.id}
        />
      </div>

      {/* Content relationships (edit mode only) */}
      {isEdit && learningPaths && learningPaths.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-diligent-gray-5 mb-4">Content relationships</h2>
          <p className="text-sm text-diligent-gray-4 mb-2">This video appears in:</p>
          <ul className="space-y-1">
            {learningPaths.map((lp) => (
              <li key={lp.id}>
                <a
                  href={`/admin/learning-paths/${lp.id}`}
                  className="text-sm text-link hover:underline"
                >
                  {lp.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-diligent-red px-6 py-2.5 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save video'}
        </button>
      </div>
    </form>
  )
}
