'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import FileUpload from './FileUpload'
import ImageUpload from './ImageUpload'
import RichTextEditor from './RichTextEditor'
import TaxonomySelect from './TaxonomySelect'
import AuthorSelect from './AuthorSelect'
import RelatedItemsPicker from './RelatedItemsPicker'
import type { RelatedItem } from './RelatedItemsPicker'
import { validateTemplatePublish } from '@/lib/admin/metadataHealth'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

interface TemplateFormProps {
  template?: {
    id: string
    title: string
    slug: string
    description: string
    fileUrl: string | null
    fileName: string | null
    fileType: string | null
    fileSize: string | null
    pageCount: number | null
    thumbnailUrl: string | null
    thumbnailAlt: string | null
    ogImageUrl: string | null
    ogImageAlt: string | null
    accessTier: 'FREE' | 'GATED' | 'PREMIUM'
    publishedAt: string | null
    scheduledPublishAt: string | null
    status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
    restricted: boolean
    accessToken: string | null
    restrictedNote: string | null
    seoTitle: string | null
    seoDescription: string | null
    sku: string | null
    authorId: string | null
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
  previewButton?: React.ReactNode
}

function toDateTimeLocal(isoString: string | null): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function TemplateForm({
  template,
  personas,
  regions,
  subjects,
  learningPaths,
  relatedItems: initialRelatedItems,
  previewButton,
}: TemplateFormProps) {
  const router = useRouter()
  const isEdit = !!template

  // Form state
  const [title, setTitle] = useState(template?.title ?? '')
  const [slug, setSlug] = useState(template?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit)
  const [description, setDescription] = useState(template?.description ?? '')
  const [fileUrl, setFileUrl] = useState(template?.fileUrl ?? '')
  const [fileName, setFileName] = useState(template?.fileName ?? '')
  const [fileType, setFileType] = useState(template?.fileType ?? '')
  const [fileSize, setFileSize] = useState(template?.fileSize ?? '')
  const [pageCount, setPageCount] = useState<number | null>(template?.pageCount ?? null)
  const [thumbnailUrl, setThumbnailUrl] = useState(template?.thumbnailUrl ?? '')
  const [thumbnailAlt, setThumbnailAlt] = useState(template?.thumbnailAlt ?? '')
  const [ogImageUrl, setOgImageUrl] = useState(template?.ogImageUrl ?? '')
  const [ogImageAlt, setOgImageAlt] = useState(template?.ogImageAlt ?? '')
  const [accessTier, setAccessTier] = useState(template?.accessTier ?? 'GATED')
  const [publishedAt, setPublishedAt] = useState(toDateTimeLocal(template?.publishedAt ?? null))
  const [scheduledPublishAt, setScheduledPublishAt] = useState(toDateTimeLocal(template?.scheduledPublishAt ?? null))
  const [status, setStatus] = useState(template?.status ?? 'DRAFT')
  const [restricted, setRestricted] = useState(template?.restricted ?? false)
  const [accessToken, setAccessToken] = useState(template?.accessToken ?? null)
  const [restrictedNote, setRestrictedNote] = useState(template?.restrictedNote ?? '')
  const [seoTitle, setSeoTitle] = useState(template?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(template?.seoDescription ?? '')
  const [sku, setSku] = useState(template?.sku ?? '')
  const [authorId, setAuthorId] = useState(template?.authorId ?? '')
  const [credlyBadgeId, setCredlyBadgeId] = useState(template?.credlyBadgeId ?? '')
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(template?.personaIds ?? [])
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>(template?.regionIds ?? [])
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(template?.subjectIds ?? [])
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>(initialRelatedItems ?? [])

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; link?: string } | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPublishDropdown, setShowPublishDropdown] = useState(false)
  const [showSchedulePicker, setShowSchedulePicker] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Derive organization type subject IDs for validation
  const orgTypeSubjectIds = subjects.filter((s) => s.group.name === 'Organization Type').map((s) => s.id)
  const hasOrgTypeSelected = selectedSubjectIds.some((id) => orgTypeSubjectIds.includes(id))

  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value)
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value))
    }
  }, [slugManuallyEdited])

  async function handleGenerateToken() {
    if (!template) return
    setTokenLoading(true)
    try {
      const res = await fetch(`/api/admin/templates/${template.id}/token`, { method: 'POST' })
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
    if (!template) return
    if (!confirm('Are you sure you want to revoke this token? The existing URL will stop working.')) return
    setTokenLoading(true)
    try {
      const res = await fetch(`/api/admin/templates/${template.id}/token`, { method: 'DELETE' })
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
    const url = `${window.location.origin}/templates/${slug}?token=${accessToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function saveItem(targetStatus: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED') {
    if (!formRef.current?.reportValidity()) return

    if (targetStatus === 'PUBLISHED' || targetStatus === 'SCHEDULED') {
      const missing = validateTemplatePublish({
        title,
        slug,
        description,
        fileUrl: fileUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        ogImageUrl: ogImageUrl || null,
        hasOrgType: hasOrgTypeSelected,
      })
      if (missing.length > 0) {
        setPublishError(`Required to publish: ${missing.join(', ')}`)
        return
      }
    }
    setPublishError(null)

    const effectivePublishedAt = targetStatus === 'PUBLISHED' && !publishedAt
      ? new Date().toISOString()
      : publishedAt ? new Date(publishedAt).toISOString() : null

    setSaving(true)
    setMessage(null)

    const payload = {
      title,
      slug,
      description,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileType: fileType || null,
      fileSize: fileSize || null,
      pageCount: pageCount ?? null,
      thumbnailUrl: thumbnailUrl || null,
      thumbnailAlt: thumbnailAlt || null,
      ogImageUrl: ogImageUrl || null,
      ogImageAlt: ogImageAlt || null,
      accessTier,
      publishedAt: effectivePublishedAt,
      scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt).toISOString() : null,
      status: targetStatus,
      restricted,
      restrictedNote: restrictedNote || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      sku: sku || null,
      authorId: authorId || null,
      credlyBadgeId: credlyBadgeId || null,
      personaIds: selectedPersonaIds,
      regionIds: selectedRegionIds,
      subjectIds: selectedSubjectIds,
      relatedItems: relatedItems.map((item) => ({ type: item.type, id: item.id })),
    }

    try {
      const url = isEdit ? `/api/admin/templates/${template.id}` : '/api/admin/templates'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save template' })
        return
      }

      const previousStatus = status
      setStatus(targetStatus)
      if (targetStatus === 'PUBLISHED' && !publishedAt) {
        setPublishedAt(toDateTimeLocal(new Date().toISOString()))
      }

      if (isEdit) {
        const successMsg = targetStatus === 'PUBLISHED'
          ? { type: 'success' as const, text: 'Template published successfully', link: `/templates/${slug}` }
          : targetStatus === 'SCHEDULED'
          ? { type: 'success' as const, text: 'Template scheduled successfully' }
          : targetStatus === 'ARCHIVED'
          ? { type: 'success' as const, text: 'Template archived successfully' }
          : previousStatus === 'ARCHIVED'
          ? { type: 'success' as const, text: 'Template restored to draft' }
          : { type: 'success' as const, text: 'Template saved as draft' }
        setMessage(successMsg)
        router.refresh()
      } else {
        const created = await res.json()
        router.push(`/admin/templates/${created.id}`)
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {message && message.type === 'error' && (
        <div
          className="rounded px-4 py-3 text-sm font-medium bg-red-50 text-diligent-red border border-red-200"
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-diligent-gray-5 mb-1">
              Slug <span className="text-diligent-red">*</span>
            </label>
            <div className="flex items-center">
              <span className="text-sm text-diligent-gray-4 mr-1">/templates/</span>
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
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Author
          </label>
          <AuthorSelect value={authorId} onChange={setAuthorId} />
        </div>

        <div>
          <label className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Description <span className="text-diligent-red">*</span>
          </label>
          <RichTextEditor id="description" value={description} onChange={setDescription} />
        </div>
      </div>

      {/* Template File */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-diligent-gray-5">Template file</h2>

        <span className="block text-sm font-medium text-diligent-gray-5 mb-1">
          Template file <span className="text-diligent-red">*</span>
        </span>
        <FileUpload
          accept=".pdf,.docx,.xlsx"
          folder="templates"
          maxSizeMB={50}
          currentUrl={fileUrl || null}
          currentFileName={fileName || null}
          onUpload={(url, name, _assetId, meta) => {
            setFileUrl(url)
            setFileName(name)
            // Infer file type from extension
            const ext = name.split('.').pop()?.toLowerCase()
            if (ext === 'pdf') setFileType('application/pdf')
            else if (ext === 'docx') setFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            else if (ext === 'xlsx') setFileType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            else setFileType('')
            // Auto-populate file metadata
            if (meta?.fileSize) setFileSize(meta.fileSize)
            setPageCount(meta?.pageCount ?? null)
          }}
          onRemove={() => {
            setFileUrl('')
            setFileName('')
            setFileType('')
            setFileSize('')
            setPageCount(null)
          }}
          label=""
          hint="Accepted formats: PDF, Word (.docx), Excel (.xlsx). Max 50MB."
        />

      </div>

      {/* Media */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-diligent-gray-5">Media</h2>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <span className="block text-sm font-medium text-diligent-gray-5 mb-1">
              Thumbnail image <span className="text-diligent-red">*</span>
            </span>
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
              label=""
              hint="Recommended: 1200x675px (16:9)"
            />
            <div>
              <label htmlFor="thumbnailAlt" className="block text-sm font-medium text-diligent-gray-5 mb-1">
                Thumbnail alt text
              </label>
              <input
                id="thumbnailAlt"
                type="text"
                value={thumbnailAlt}
                onChange={(e) => setThumbnailAlt(e.target.value)}
                className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
              />
            </div>
          </div>

          <div className="space-y-3 border-l border-diligent-gray-2 pl-6">
            <span className="block text-sm font-medium text-diligent-gray-5 mb-1">
              Open Graph image <span className="text-diligent-red">*</span>
            </span>
            <ImageUpload
              folder="og-images"
              currentUrl={ogImageUrl || null}
              currentAlt={ogImageAlt || null}
              onUpload={(url, alt) => {
                setOgImageUrl(url)
                setOgImageAlt(alt)
              }}
              onRemove={() => {
                setOgImageUrl('')
                setOgImageAlt('')
              }}
              label=""
              hint="Used when sharing on social media"
            />
            <div>
              <label htmlFor="ogImageAlt" className="block text-sm font-medium text-diligent-gray-5 mb-1">
                OG image alt text
              </label>
              <input
                id="ogImageAlt"
                type="text"
                value={ogImageAlt}
                onChange={(e) => setOgImageAlt(e.target.value)}
                className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
              />
            </div>
          </div>
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

      {/* Related Items */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-diligent-gray-5 mb-1">Related items</h2>
        <p className="text-sm text-diligent-gray-3 mb-4">
          Select up to 3 related content items to display on the public page.
        </p>
        <RelatedItemsPicker
          value={relatedItems}
          onChange={setRelatedItems}
          excludeType="TEMPLATE"
          excludeId={template?.id}
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
          <p className="text-sm font-medium text-diligent-gray-5">Restricted access</p>
          <p className="mt-1 text-sm text-diligent-gray-4">
            Tick the checkbox to hide this item from the public library and generate a unique access link. Only people with the unique link can view this item. Use this for exclusive content only to be shared with specific cohorts. If restricted access is removed, the content will return to being publicly-accessible and the previous unique link will no longer function.
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm text-diligent-gray-5 cursor-pointer">
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
                          /templates/{slug}?token={accessToken}
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
                  Save the template first to generate an access token.
                </p>
              )}
            </div>
          )}
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
            Optional. If set, learners who complete this template will receive a Credly badge. Enter the badge template ID from the Credly dashboard.
          </p>
        </div>
      </div>

      {/* Content relationships (edit mode only) */}
      {isEdit && learningPaths && learningPaths.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-diligent-gray-5 mb-4">Content relationships</h2>
          <p className="text-sm text-diligent-gray-4 mb-2">This template appears in:</p>
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

      {/* Bottom error message */}
      {message && message.type === 'error' && (
        <div
          className="rounded px-4 py-3 text-sm font-medium bg-red-50 text-diligent-red border border-red-200"
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Action buttons */}
      {status === 'ARCHIVED' ? (
        <div className="flex items-center justify-end gap-3">
          {message && message.type === 'success' && (
            <span className="text-sm text-diligent-gray-5">{message.text}</span>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => saveItem('DRAFT')}
            className="rounded border border-diligent-gray-2 bg-white px-6 py-2.5 text-sm font-medium text-diligent-gray-5 hover:bg-diligent-gray-1 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Restore to draft'}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-end gap-3">
            {message && message.type === 'success' && (
              <span className="text-sm text-diligent-gray-5">
                {message.text}
                {message.link && (
                  <>
                    {' — '}
                    <a href={message.link} target="_blank" rel="noopener noreferrer" className="text-link">
                      View live page ↗
                    </a>
                  </>
                )}
              </span>
            )}
            {publishError && (
              <span className="text-xs font-medium text-diligent-red">{publishError}</span>
            )}
            {previewButton}
            <button
              type="button"
              disabled={saving}
              onClick={() => saveItem('DRAFT')}
              className="rounded border border-diligent-gray-2 bg-white px-6 py-2.5 text-sm font-medium text-diligent-gray-5 hover:bg-diligent-gray-1 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save as draft'}
            </button>
            <div className="relative">
              <div className="flex">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    if (showSchedulePicker && scheduledPublishAt) {
                      saveItem('SCHEDULED')
                    } else {
                      saveItem('PUBLISHED')
                    }
                  }}
                  className="rounded-l bg-diligent-red px-6 py-2.5 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : showSchedulePicker && scheduledPublishAt ? 'Schedule' : 'Publish'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPublishDropdown(!showPublishDropdown)}
                  className="rounded-r border-l border-white/30 bg-diligent-red px-2 py-2.5 text-white hover:bg-diligent-red-2"
                >
                  <span className="material-symbols-sharp text-[18px]">arrow_drop_down</span>
                </button>
              </div>
              {showPublishDropdown && (
                <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded border border-diligent-gray-2 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSchedulePicker(!showSchedulePicker)
                      setShowPublishDropdown(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-diligent-gray-5 hover:bg-diligent-gray-1"
                  >
                    {showSchedulePicker ? 'Publish immediately' : 'Schedule for later'}
                  </button>
                </div>
              )}
            </div>
          </div>
          {showSchedulePicker && (
            <div className="flex items-center justify-end gap-3">
              <label htmlFor="scheduledPublishAt" className="text-sm font-medium text-diligent-gray-5">
                Schedule date
              </label>
              <input
                id="scheduledPublishAt"
                type="datetime-local"
                value={scheduledPublishAt}
                onChange={(e) => setScheduledPublishAt(e.target.value)}
                className="border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
              />
            </div>
          )}
          {isEdit && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to archive this item? It will be hidden from the public hub.')) {
                    saveItem('ARCHIVED')
                  }
                }}
                className="text-sm text-diligent-gray-4 hover:text-diligent-red"
              >
                Archive this item
              </button>
            </div>
          )}
        </>
      )}
    </form>
  )
}
