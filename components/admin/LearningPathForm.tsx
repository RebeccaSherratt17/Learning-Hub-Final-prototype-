'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from './ImageUpload'
import TaxonomySelect from './TaxonomySelect'
import ContentTypeBadge from './ContentTypeBadge'
import RelatedItemsPicker from './RelatedItemsPicker'
import type { RelatedItem } from './RelatedItemsPicker'
import type { ContentType } from '@/lib/generated/prisma'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

interface PathItem {
  contentType: string | null
  contentId: string | null
  title: string
  milestoneTitle: string | null // non-null means this is a milestone
  isElective: boolean
}

interface SearchResult {
  contentType: string
  contentId: string
  title: string
  status: string
}

interface LearningPathFormProps {
  learningPath?: {
    id: string
    title: string
    slug: string
    description: string
    estimatedCompletionTime: string | null
    credlyBadgeId: string | null
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
    personaIds: string[]
    regionIds: string[]
    subjectIds: string[]
    items: { id: string; contentType: string | null; contentId: string | null; title: string; milestoneTitle: string | null; isElective: boolean }[]
  }
  personas: { id: string; name: string }[]
  regions: { id: string; name: string }[]
  subjects: { id: string; name: string; group: { id: string; name: string } }[]
  relatedItems?: RelatedItem[]
}

function toDateTimeLocal(isoString: string | null): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function LearningPathForm({
  learningPath,
  personas,
  regions,
  subjects,
  relatedItems: initialRelatedItems,
}: LearningPathFormProps) {
  const router = useRouter()
  const isEdit = !!learningPath

  // Form state
  const [title, setTitle] = useState(learningPath?.title ?? '')
  const [slug, setSlug] = useState(learningPath?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit)
  const [description, setDescription] = useState(learningPath?.description ?? '')
  const [estimatedCompletionTime, setEstimatedCompletionTime] = useState(learningPath?.estimatedCompletionTime ?? '')
  const [credlyBadgeId, setCredlyBadgeId] = useState(learningPath?.credlyBadgeId ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(learningPath?.thumbnailUrl ?? '')
  const [thumbnailAlt, setThumbnailAlt] = useState(learningPath?.thumbnailAlt ?? '')
  const [ogImageUrl, setOgImageUrl] = useState(learningPath?.ogImageUrl ?? '')
  const [accessTier, setAccessTier] = useState(learningPath?.accessTier ?? 'FREE')
  const [publishedAt, setPublishedAt] = useState(toDateTimeLocal(learningPath?.publishedAt ?? null))
  const [scheduledPublishAt, setScheduledPublishAt] = useState(toDateTimeLocal(learningPath?.scheduledPublishAt ?? null))
  const [status, setStatus] = useState(learningPath?.status ?? 'DRAFT')
  const [seoTitle, setSeoTitle] = useState(learningPath?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(learningPath?.seoDescription ?? '')
  const [sku, setSku] = useState(learningPath?.sku ?? '')
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(learningPath?.personaIds ?? [])
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>(learningPath?.regionIds ?? [])
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(learningPath?.subjectIds ?? [])
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>(initialRelatedItems ?? [])

  // Items state
  const [items, setItems] = useState<PathItem[]>(
    learningPath?.items.map((i) => ({
      contentType: i.contentType,
      contentId: i.contentId,
      title: i.title,
      milestoneTitle: i.milestoneTitle,
      isElective: i.isElective ?? false,
    })) ?? []
  )

  // Item search state
  const [itemSearchOpen, setItemSearchOpen] = useState(false)
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [itemSearchType, setItemSearchType] = useState('')
  const [itemSearchResults, setItemSearchResults] = useState<SearchResult[]>([])
  const [itemSearchLoading, setItemSearchLoading] = useState(false)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Item search with debounce
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)

    if (!itemSearchQuery.trim()) {
      setItemSearchResults([])
      setItemSearchLoading(false)
      return
    }

    setItemSearchLoading(true)
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: itemSearchQuery })
        if (itemSearchType) params.set('type', itemSearchType)
        const res = await fetch(`/api/admin/learning-paths/items/search?${params}`)
        if (res.ok) {
          const data = await res.json()
          setItemSearchResults(data.items)
        }
      } catch {
        console.error('Failed to search items')
      } finally {
        setItemSearchLoading(false)
      }
    }, 300)

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [itemSearchQuery, itemSearchType])

  function addItem(result: SearchResult) {
    // Don't add duplicates
    if (items.some((i) => i.contentType === result.contentType && i.contentId === result.contentId)) {
      return
    }
    setItems((prev) => [...prev, {
      contentType: result.contentType,
      contentId: result.contentId,
      title: result.title,
      milestoneTitle: null,
      isElective: false,
    }])
    setItemSearchQuery('')
    setItemSearchResults([])
    setItemSearchOpen(false)
  }

  function addMilestone() {
    setItems((prev) => [...prev, {
      contentType: null,
      contentId: null,
      title: 'New milestone',
      milestoneTitle: 'New milestone',
      isElective: false,
    }])
  }

  function updateMilestoneTitle(index: number, newTitle: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, title: newTitle, milestoneTitle: newTitle } : item
      )
    )
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return
    setItems((prev) => {
      const next = [...prev]
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const payload = {
      title,
      slug,
      description,
      estimatedCompletionTime: estimatedCompletionTime || null,
      credlyBadgeId: credlyBadgeId || null,
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
      personaIds: selectedPersonaIds,
      regionIds: selectedRegionIds,
      subjectIds: selectedSubjectIds,
      items: items.map((item) => {
        if (item.milestoneTitle !== null) {
          return { milestoneTitle: item.milestoneTitle, isElective: item.isElective }
        }
        return { contentType: item.contentType, contentId: item.contentId, isElective: item.isElective }
      }),
      relatedItems: relatedItems.map((item) => ({ type: item.type, id: item.id })),
    }

    try {
      const url = isEdit ? `/api/admin/learning-paths/${learningPath.id}` : '/api/admin/learning-paths'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save learning path' })
        return
      }

      if (isEdit) {
        setMessage({ type: 'success', text: 'Learning path saved successfully' })
        router.refresh()
      } else {
        const created = await res.json()
        router.push(`/admin/learning-paths/${created.id}`)
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
            <span className="text-sm text-diligent-gray-4 mr-1">/learning-paths/</span>
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

        <div>
          <label htmlFor="estimatedCompletionTime" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Estimated completion time
          </label>
          <input
            id="estimatedCompletionTime"
            type="text"
            value={estimatedCompletionTime}
            onChange={(e) => setEstimatedCompletionTime(e.target.value)}
            placeholder="e.g. 2 hours"
            className="w-full border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red md:w-1/2"
          />
        </div>
      </div>

      {/* Content Items */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-diligent-gray-5">Content items</h2>

        {items.length === 0 ? (
          <p className="text-sm text-diligent-gray-3 py-4">
            No items added yet. Use the search below to add courses, templates, and videos.
          </p>
        ) : (
          <div className="space-y-1">
            {items.map((item, index) => (
              <div
                key={item.milestoneTitle !== null ? `milestone-${index}` : `${item.contentType}-${item.contentId}`}
                className={`flex items-center gap-2 rounded border px-3 py-2 ${
                  item.milestoneTitle !== null
                    ? 'border-amber-200 bg-amber-50 border-l-4 border-l-amber-400'
                    : 'border-diligent-gray-2'
                }`}
              >
                <span className="material-symbols-sharp text-[20px] text-diligent-gray-3">
                  drag_indicator
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="rounded p-0.5 text-diligent-gray-3 hover:text-diligent-gray-5 disabled:opacity-30"
                    title="Move up"
                  >
                    <span className="material-symbols-sharp text-[18px]">arrow_upward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                    className="rounded p-0.5 text-diligent-gray-3 hover:text-diligent-gray-5 disabled:opacity-30"
                    title="Move down"
                  >
                    <span className="material-symbols-sharp text-[18px]">arrow_downward</span>
                  </button>
                </div>
                {item.milestoneTitle !== null ? (
                  <>
                    <span className="material-symbols-sharp text-[20px] text-amber-600">bookmark</span>
                    <input
                      type="text"
                      value={item.milestoneTitle}
                      onChange={(e) => updateMilestoneTitle(index, e.target.value)}
                      className="flex-1 bg-transparent text-sm font-semibold text-diligent-gray-5 border-none outline-none focus:ring-0 p-0"
                      aria-label="Milestone title"
                    />
                  </>
                ) : (
                  <>
                    <span className="text-xs text-diligent-gray-3 w-5 text-center">{index + 1}.</span>
                    <ContentTypeBadge type={item.contentType as ContentType} />
                    <span className="flex-1 text-sm text-diligent-gray-5 truncate">{item.title}</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setItems((prev) =>
                      prev.map((it, i) =>
                        i === index ? { ...it, isElective: !it.isElective } : it
                      )
                    )
                  }}
                  className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium transition ${
                    item.isElective
                      ? 'bg-diligent-gray-2 text-diligent-gray-4'
                      : 'bg-green-100 text-green-700'
                  }`}
                  title={item.isElective ? 'Click to make mandatory' : 'Click to make elective'}
                >
                  {item.isElective ? 'Elective' : 'Mandatory'}
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded p-0.5 text-diligent-gray-3 hover:text-diligent-red"
                  title="Remove"
                >
                  <span className="material-symbols-sharp text-[18px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add item section */}
        {!itemSearchOpen ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setItemSearchOpen(true)}
              className="flex items-center gap-2 rounded border border-dashed border-diligent-gray-2 px-4 py-2.5 text-sm text-diligent-gray-4 hover:border-diligent-gray-3 hover:text-diligent-gray-5"
            >
              <span className="material-symbols-sharp text-[20px]">add</span>
              Add item
            </button>
            <button
              type="button"
              onClick={addMilestone}
              className="flex items-center gap-2 rounded border border-dashed border-diligent-gray-2 px-4 py-2.5 text-sm text-diligent-gray-4 hover:border-diligent-gray-3 hover:text-diligent-gray-5"
            >
              <span className="material-symbols-sharp text-[20px]">bookmark</span>
              Add milestone
            </button>
          </div>
        ) : (
          <div className="rounded border border-diligent-gray-2 p-4 space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-sharp absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-diligent-gray-3">
                  search
                </span>
                <input
                  type="text"
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  placeholder="Search content by title..."
                  autoFocus
                  className="w-full border border-diligent-gray-2 rounded pl-10 pr-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
                />
              </div>
              <select
                value={itemSearchType}
                onChange={(e) => setItemSearchType(e.target.value)}
                className="border border-diligent-gray-2 rounded px-3 py-2 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
              >
                <option value="">All types</option>
                <option value="COURSE">Courses</option>
                <option value="TEMPLATE">Templates</option>
                <option value="VIDEO">Videos</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setItemSearchOpen(false)
                  setItemSearchQuery('')
                  setItemSearchResults([])
                }}
                className="rounded p-2 text-diligent-gray-3 hover:text-diligent-gray-5"
                title="Close"
              >
                <span className="material-symbols-sharp text-[20px]">close</span>
              </button>
            </div>

            {/* Search results */}
            {itemSearchLoading && (
              <p className="text-xs text-diligent-gray-3">Searching...</p>
            )}
            {!itemSearchLoading && itemSearchQuery.trim() && itemSearchResults.length === 0 && (
              <p className="text-xs text-diligent-gray-3">No content found matching &quot;{itemSearchQuery}&quot;</p>
            )}
            {itemSearchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded border border-diligent-gray-1">
                {itemSearchResults.map((result) => {
                  const alreadyAdded = items.some(
                    (i) => i.contentType === result.contentType && i.contentId === result.contentId
                  )
                  return (
                    <button
                      key={`${result.contentType}-${result.contentId}`}
                      type="button"
                      onClick={() => addItem(result)}
                      disabled={alreadyAdded}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-diligent-gray-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ContentTypeBadge type={result.contentType as ContentType} />
                      <span className="flex-1 truncate text-diligent-gray-5">{result.title}</span>
                      {alreadyAdded && (
                        <span className="text-xs text-diligent-gray-3">Added</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
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
            Optional. If set, learners who complete all items in this path will receive a Credly badge. Enter the badge template ID from the Credly dashboard.
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
          excludeType="LEARNING_PATH"
          excludeId={learningPath?.id}
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-diligent-red px-6 py-2.5 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save learning path'}
        </button>
      </div>
    </form>
  )
}
