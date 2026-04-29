'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from './ImageUpload'
import TaxonomySelect from './TaxonomySelect'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

interface CourseFormProps {
  course?: {
    id: string
    title: string
    slug: string
    description: string
    scormCourseId: string | null
    thumbnailUrl: string | null
    thumbnailAlt: string | null
    ogImageUrl: string | null
    accessTier: 'FREE' | 'GATED' | 'PREMIUM'
    author: string | null
    publishedAt: string | null
    scheduledPublishAt: string | null
    estimatedDuration: string | null
    status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
    restricted: boolean
    accessToken: string | null
    restrictedNote: string | null
    seoTitle: string | null
    seoDescription: string | null
    personaIds: string[]
    regionIds: string[]
    subjectIds: string[]
  }
  personas: { id: string; name: string }[]
  regions: { id: string; name: string }[]
  subjects: { id: string; name: string; group: { id: string; name: string } }[]
  learningPaths?: { id: string; title: string }[]
}

function toDateTimeLocal(isoString: string | null): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CourseForm({
  course,
  personas,
  regions,
  subjects,
  learningPaths,
}: CourseFormProps) {
  const router = useRouter()
  const isEdit = !!course

  // Form state
  const [title, setTitle] = useState(course?.title ?? '')
  const [slug, setSlug] = useState(course?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit)
  const [description, setDescription] = useState(course?.description ?? '')
  const [scormCourseId, setScormCourseId] = useState(course?.scormCourseId ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnailUrl ?? '')
  const [thumbnailAlt, setThumbnailAlt] = useState(course?.thumbnailAlt ?? '')
  const [ogImageUrl, setOgImageUrl] = useState(course?.ogImageUrl ?? '')
  const [accessTier, setAccessTier] = useState(course?.accessTier ?? 'FREE')
  const [author, setAuthor] = useState(course?.author ?? '')
  const [publishedAt, setPublishedAt] = useState(toDateTimeLocal(course?.publishedAt ?? null))
  const [scheduledPublishAt, setScheduledPublishAt] = useState(toDateTimeLocal(course?.scheduledPublishAt ?? null))
  const [estimatedDuration, setEstimatedDuration] = useState(course?.estimatedDuration ?? '')
  const [status, setStatus] = useState(course?.status ?? 'DRAFT')
  const [restricted, setRestricted] = useState(course?.restricted ?? false)
  const [accessToken, setAccessToken] = useState(course?.accessToken ?? null)
  const [restrictedNote, setRestrictedNote] = useState(course?.restrictedNote ?? '')
  const [seoTitle, setSeoTitle] = useState(course?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(course?.seoDescription ?? '')
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(course?.personaIds ?? [])
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>(course?.regionIds ?? [])
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(course?.subjectIds ?? [])

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [copied, setCopied] = useState(false)

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

  async function handleGenerateToken() {
    if (!course) return
    setTokenLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/token`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to generate token' })
        return
      }
      const data = await res.json()
      setAccessToken(data.token)
    } catch {
      setMessage({ type: 'error', text: 'Network error generating token' })
    } finally {
      setTokenLoading(false)
    }
  }

  async function handleRevokeToken() {
    if (!course) return
    if (!confirm('Are you sure you want to revoke this token? The existing URL will stop working.')) return
    setTokenLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/token`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to revoke token' })
        return
      }
      setAccessToken(null)
    } catch {
      setMessage({ type: 'error', text: 'Network error revoking token' })
    } finally {
      setTokenLoading(false)
    }
  }

  function handleCopyUrl() {
    if (!accessToken) return
    const url = `${window.location.origin}/courses/${slug}?token=${accessToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const payload = {
      title,
      slug,
      description,
      scormCourseId: scormCourseId || null,
      thumbnailUrl: thumbnailUrl || null,
      thumbnailAlt: thumbnailAlt || null,
      ogImageUrl: ogImageUrl || null,
      accessTier,
      author: author || null,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
      scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt).toISOString() : null,
      estimatedDuration: estimatedDuration || null,
      status,
      restricted,
      restrictedNote: restrictedNote || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      personaIds: selectedPersonaIds,
      regionIds: selectedRegionIds,
      subjectIds: selectedSubjectIds,
    }

    try {
      const url = isEdit ? `/api/admin/courses/${course.id}` : '/api/admin/courses'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save course' })
        return
      }

      if (isEdit) {
        setMessage({ type: 'success', text: 'Course saved successfully' })
      } else {
        const created = await res.json()
        router.push(`/admin/courses/${created.id}`)
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const tokenUrl = accessToken ? `/courses/${slug}?token=${accessToken}` : null

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
            <span className="text-sm text-diligent-gray-4 mr-1">/courses/</span>
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-diligent-gray-5 mb-1">
              Author
            </label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
            />
          </div>

          <div>
            <label htmlFor="estimatedDuration" className="block text-sm font-medium text-diligent-gray-5 mb-1">
              Estimated duration
            </label>
            <input
              id="estimatedDuration"
              type="text"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              placeholder="e.g. 45 minutes"
              className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
            />
          </div>
        </div>
      </div>

      {/* SCORM Integration */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-diligent-gray-5">SCORM integration</h2>

        <div>
          <label htmlFor="scormCourseId" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            SCORM Cloud course ID
          </label>
          <input
            id="scormCourseId"
            type="text"
            value={scormCourseId}
            onChange={(e) => setScormCourseId(e.target.value)}
            className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
          <p className="mt-1 text-xs text-diligent-gray-3">
            Enter the course ID from SCORM Cloud. This is used to generate launch URLs.
          </p>
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

      {/* Access & Restrictions */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-diligent-gray-5">Access & restrictions</h2>

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

        <div className="pt-4 border-t border-diligent-gray-1">
          <label className="flex items-center gap-2 text-sm text-diligent-gray-5 cursor-pointer">
            <input
              type="checkbox"
              checked={restricted}
              onChange={(e) => setRestricted(e.target.checked)}
              className="h-4 w-4 rounded border-diligent-gray-2 text-diligent-red focus:ring-diligent-red"
            />
            Restrict access to specific learners
          </label>

          {restricted && (
            <div className="mt-4 space-y-4 pl-6">
              <div>
                <label htmlFor="restrictedNote" className="block text-sm font-medium text-diligent-gray-5 mb-1">
                  Restricted access note (internal)
                </label>
                <textarea
                  id="restrictedNote"
                  value={restrictedNote}
                  onChange={(e) => setRestrictedNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Acme Corp board directors"
                  className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                />
              </div>

              {isEdit && (
                <div>
                  <span className="block text-sm font-medium text-diligent-gray-5 mb-2">Access token</span>
                  {accessToken ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 truncate rounded bg-diligent-gray-1 px-3 py-2 text-xs text-diligent-gray-4">
                          {accessToken.substring(0, 16)}...{accessToken.substring(accessToken.length - 8)}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 truncate rounded bg-diligent-gray-1 px-3 py-2 text-xs text-diligent-gray-4">
                          {tokenUrl}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyUrl}
                          className="flex items-center gap-1 rounded px-3 py-2 text-sm font-medium text-diligent-gray-5 border border-diligent-gray-2 hover:bg-diligent-gray-1"
                        >
                          <span className="material-symbols-sharp text-[18px]">
                            {copied ? 'check' : 'content_copy'}
                          </span>
                          {copied ? 'Copied' : 'Copy URL'}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleRevokeToken}
                        disabled={tokenLoading}
                        className="rounded px-3 py-1.5 text-sm font-medium text-diligent-red border border-diligent-red hover:bg-red-50 disabled:opacity-50"
                      >
                        {tokenLoading ? 'Revoking...' : 'Revoke token'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerateToken}
                      disabled={tokenLoading}
                      className="rounded bg-diligent-gray-5 px-4 py-2 text-sm font-medium text-white hover:bg-diligent-gray-4 disabled:opacity-50"
                    >
                      {tokenLoading ? 'Generating...' : 'Generate access token'}
                    </button>
                  )}
                </div>
              )}

              {!isEdit && (
                <p className="text-xs text-diligent-gray-3">
                  Save the course first to generate an access token.
                </p>
              )}
            </div>
          )}
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

      {/* Content relationships (edit mode only) */}
      {isEdit && learningPaths && learningPaths.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-diligent-gray-5 mb-4">Content relationships</h2>
          <p className="text-sm text-diligent-gray-4 mb-2">This course appears in:</p>
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
          {saving ? 'Saving...' : 'Save course'}
        </button>
      </div>
    </form>
  )
}
