'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FallbackThumbnail } from '@/components/hub/FallbackThumbnail'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import {
  type ContentType,
  contentTypeLabels,
} from '@/types/content'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface LearningPathItemData {
  id: string
  contentType: ContentType | null
  contentId: string | null
  contentTitle: string | null
  contentSlug: string | null
  contentThumbnailUrl: string | null
  contentThumbnailAlt: string | null
  order: number
  milestoneTitle: string | null
  isElective: boolean
}

interface LearnerInfo {
  firstName: string
  lastName: string
  email: string
}

interface ProgressEntry {
  learningPathItemId: string
  completedAt: string
}

interface LearningPathProgressProps {
  learningPathId: string
  learningPathSlug: string
  items: LearningPathItemData[]
  accessTier: string
  credlyBadgeId?: string | null
}

const routePrefix: Record<ContentType, string> = {
  course: '/courses',
  template: '/templates',
  video: '/videos',
  learningPath: '/learning-paths',
}

const contentTypeIcon: Record<ContentType, string> = {
  course: 'school',
  template: 'description',
  video: 'play_circle',
  learningPath: 'route',
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function LearningPathProgress({
  learningPathId,
  learningPathSlug,
  items,
  accessTier,
  credlyBadgeId,
}: LearningPathProgressProps) {
  const [identified, setIdentified] = useState(false)
  const [learner, setLearner] = useState<LearnerInfo | null>(null)
  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(new Set())
  const [allMandatoryComplete, setAllMandatoryComplete] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch existing progress on mount
  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/learner/progress/${learningPathId}`)
      if (!res.ok) return

      const data = await res.json()
      if (data.identified) {
        setIdentified(true)
        setLearner(data.learner)
        setCompletedItemIds(
          new Set(data.progress.map((p: ProgressEntry) => p.learningPathItemId)),
        )
      }
    } catch {
      // Silently fail — learner just won't see progress
    } finally {
      setLoading(false)
    }
  }, [learningPathId])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  // Recalculate allMandatoryComplete whenever completedItemIds changes
  useEffect(() => {
    const mandatoryItems = items.filter(
      (item) => !item.milestoneTitle && !item.isElective,
    )
    const allDone = mandatoryItems.every((item) => completedItemIds.has(item.id))
    setAllMandatoryComplete(mandatoryItems.length > 0 && allDone)
  }, [completedItemIds, items])

  // Calculate progress stats
  const contentItems = items.filter((item) => !item.milestoneTitle)
  const mandatoryItems = contentItems.filter((item) => !item.isElective)
  const completedMandatory = mandatoryItems.filter((item) =>
    completedItemIds.has(item.id),
  ).length
  const completedTotal = contentItems.filter((item) =>
    completedItemIds.has(item.id),
  ).length
  const progressPercent =
    mandatoryItems.length > 0
      ? Math.round((completedMandatory / mandatoryItems.length) * 100)
      : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-diligent-gray-2 border-t-diligent-red" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Learner identification or progress bar */}
      {!identified ? (
        <LearnerIdentifyForm
          learningPathId={learningPathId}
          onIdentified={(info) => {
            setIdentified(true)
            setLearner(info)
          }}
        />
      ) : (
        <ProgressHeader
          learner={learner!}
          completedMandatory={completedMandatory}
          totalMandatory={mandatoryItems.length}
          completedTotal={completedTotal}
          totalItems={contentItems.length}
          progressPercent={progressPercent}
          allMandatoryComplete={allMandatoryComplete}
          credlyBadgeId={credlyBadgeId}
        />
      )}

      {/* Item list */}
      <ol className="space-y-0">
        {items.map((item) => {
          if (item.milestoneTitle) {
            return (
              <MilestoneRow
                key={item.id}
                title={item.milestoneTitle}
              />
            )
          }

          return (
            <ContentItemRow
              key={item.id}
              item={item}
              completed={completedItemIds.has(item.id)}
              identified={identified}
              learningPathSlug={learningPathSlug}
              accessTier={accessTier}
            />
          )
        })}
      </ol>
    </div>
  )
}

// ─────────────────────────────────────────────
// Learner Identify Form
// ─────────────────────────────────────────────

function LearnerIdentifyForm({
  learningPathId,
  onIdentified,
}: {
  learningPathId: string
  onIdentified: (learner: LearnerInfo) => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/learner/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          learningPathId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }

      onIdentified({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClassName =
    'w-full rounded border border-diligent-gray-2 bg-white px-4 py-3 text-sm text-diligent-gray-5 placeholder:text-diligent-gray-3 focus:border-diligent-gray-4 focus:outline-none'
  const labelClassName = 'mb-1 block text-sm font-medium text-diligent-gray-5'

  return (
    <div className="rounded-lg border border-diligent-gray-2 bg-diligent-gray-1 p-6 sm:p-8">
      <div className="mb-1 flex items-center gap-2">
        <Icon name="person" className="text-[20px] text-diligent-gray-4" />
        <h3 className="text-lg font-semibold text-diligent-gray-5">
          Start this learning path
        </h3>
      </div>
      <p className="mb-6 text-sm text-diligent-gray-4">
        Enter your details to track your progress. No account needed.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lp-firstName" className={labelClassName}>
              First name
            </label>
            <input
              id="lp-firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="lp-lastName" className={labelClassName}>
              Last name
            </label>
            <input
              id="lp-lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className={inputClassName}
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="lp-email" className={labelClassName}>
            Email
          </label>
          <input
            id="lp-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Work email address"
            className={inputClassName}
          />
        </div>

        {error && (
          <p className="mb-4 text-sm text-diligent-red" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-diligent-red px-6 py-3 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-60"
        >
          {submitting ? 'Starting...' : 'Start learning path'}
        </button>

        <p className="mt-4 text-xs text-diligent-gray-4">
          Your progress will be saved and linked to your email address. No
          account or password required.
        </p>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────
// Progress Header
// ─────────────────────────────────────────────

function ProgressHeader({
  learner,
  completedMandatory,
  totalMandatory,
  completedTotal,
  totalItems,
  progressPercent,
  allMandatoryComplete,
  credlyBadgeId,
}: {
  learner: LearnerInfo
  completedMandatory: number
  totalMandatory: number
  completedTotal: number
  totalItems: number
  progressPercent: number
  allMandatoryComplete: boolean
  credlyBadgeId?: string | null
}) {
  return (
    <div className="rounded-lg border border-diligent-gray-2 bg-diligent-gray-1 p-6 sm:p-8">
      {allMandatoryComplete ? (
        <div className="text-center">
          <Icon
            name="verified"
            className="text-[48px] text-diligent-red"
            label="Completed"
          />
          <h3 className="mt-2 text-lg font-semibold text-diligent-gray-5">
            Learning path complete
          </h3>
          <p className="mt-1 text-sm text-diligent-gray-4">
            Well done, {learner.firstName}! You have completed all mandatory
            items in this learning path.
          </p>
          {credlyBadgeId && (
            <p className="mt-3 text-sm text-diligent-gray-4">
              <Icon name="workspace_premium" className="mr-1 align-middle text-[18px] text-diligent-red" />
              A digital badge has been sent to {learner.email}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="person" className="text-[20px] text-diligent-gray-4" />
              <span className="text-sm font-medium text-diligent-gray-5">
                {learner.firstName} {learner.lastName}
              </span>
            </div>
            <span className="text-sm text-diligent-gray-4">
              {completedTotal} of {totalItems} items complete
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-diligent-gray-2">
            <div
              className="h-full rounded-full bg-diligent-red transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progressPercent}% complete`}
            />
          </div>

          <p className="text-xs text-diligent-gray-4">
            {completedMandatory} of {totalMandatory} mandatory items complete
            ({progressPercent}%)
          </p>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Milestone Row
// ─────────────────────────────────────────────

function MilestoneRow({ title }: { title: string }) {
  return (
    <li className="list-none border-b border-diligent-gray-2 px-2 pb-2 pt-8 first:pt-0">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-diligent-gray-4">
        {title}
      </h4>
    </li>
  )
}

// ─────────────────────────────────────────────
// Content Item Row
// ─────────────────────────────────────────────

function ContentItemRow({
  item,
  completed,
  identified,
  learningPathSlug,
  accessTier,
}: {
  item: LearningPathItemData
  completed: boolean
  identified: boolean
  learningPathSlug: string
  accessTier: string
}) {
  if (!item.contentType || !item.contentSlug) return null

  const href =
    item.contentType === 'template'
      ? `${routePrefix[item.contentType]}/${item.contentSlug}?from=${learningPathSlug}`
      : `${routePrefix[item.contentType]}/${item.contentSlug}`

  return (
    <li className="list-none border-b border-diligent-gray-2 last:border-b-0">
      <Link
        href={href}
        className="group/item flex items-center gap-4 px-2 py-4 no-underline transition-colors hover:bg-diligent-gray-1 hover:no-underline sm:gap-5"
      >
        {/* Completion checkbox */}
        <div className="flex-shrink-0">
          {completed ? (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-diligent-red">
              <Icon
                name="check"
                className="text-[16px] text-white"
                label="Completed"
              />
            </div>
          ) : (
            <div
              className={cn(
                'h-6 w-6 rounded-full border-2',
                identified
                  ? 'border-diligent-gray-3'
                  : 'border-diligent-gray-2',
              )}
            />
          )}
        </div>

        {/* Thumbnail */}
        <div className="hidden flex-shrink-0 sm:block">
          <div className="relative h-12 w-20 overflow-hidden rounded bg-diligent-gray-1">
            {item.contentThumbnailUrl ? (
              <Image
                src={item.contentThumbnailUrl}
                alt={item.contentThumbnailAlt ?? item.contentTitle ?? ''}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <FallbackThumbnail alt={item.contentTitle ?? ''} />
            )}
          </div>
        </div>

        {/* Content info */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Icon
              name={contentTypeIcon[item.contentType]}
              className="text-[16px] text-diligent-gray-3"
            />
            <Badge variant={item.contentType}>
              {contentTypeLabels[item.contentType]}
            </Badge>
            {item.isElective && (
              <span className="text-xs text-diligent-gray-4">Elective</span>
            )}
          </div>
          <p
            className={cn(
              'truncate text-sm font-medium',
              completed
                ? 'text-diligent-gray-4 line-through'
                : 'text-diligent-gray-5 group-hover/item:text-diligent-red',
            )}
          >
            {item.contentTitle}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          <Icon
            name="chevron_right"
            className="text-[20px] text-diligent-gray-3 transition-colors group-hover/item:text-diligent-gray-5"
          />
        </div>
      </Link>
    </li>
  )
}
