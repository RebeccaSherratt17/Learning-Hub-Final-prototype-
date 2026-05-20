# Feedback System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a feedback popup (star rating + comment) after a learner completes a content item, store submissions in PostgreSQL, and email a monthly digest to certifications@diligent.com via a Vercel Cron job.

**Architecture:** A single `FeedbackPopup` client component is rendered on each content page and triggered when a completion event fires. It posts to `/api/feedback` which writes to the existing `Feedback` table. A `/api/cron/feedback-digest` endpoint compiles the previous month's feedback into an email via Nodemailer, triggered by Vercel Cron on the 1st of each month. The popup is session-gated (sessionStorage) so it only shows once per content item per browser session.

**Tech Stack:** React client component, Prisma, Nodemailer (already installed), Vercel Cron

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/hub/FeedbackPopup.tsx` | Star rating + comment popup, dismissible, posts to API |
| Create | `app/api/feedback/route.ts` | POST endpoint — validates and stores feedback |
| Create | `app/api/cron/feedback-digest/route.ts` | GET endpoint — compiles and emails monthly digest |
| Create | `vercel.json` | Cron schedule for monthly digest |
| Modify | `components/hub/CourseRightColumn.tsx` | Render FeedbackPopup on course completion |
| Modify | `components/hub/TemplateDownloadSection.tsx` | Render FeedbackPopup on template download click |
| Modify | `components/hub/VideoRightColumn.tsx` | Render FeedbackPopup on video end |
| Modify | `components/hub/LearningPathProgress.tsx` | Render FeedbackPopup on learning path completion |

---

### Task 1: Create the FeedbackPopup component

**Files:**
- Create: `components/hub/FeedbackPopup.tsx`

A client component that:
- Accepts `contentType`, `contentId`, and `show` (boolean) props
- When `show` transitions to `true`, checks sessionStorage — if feedback was already submitted for this content item in this session, does not render
- Renders a floating card (bottom-right, above cookie banner z-index) with:
  - 5 clickable star icons (Material Symbols `star` filled/unfilled)
  - A textarea for optional comments
  - Submit and close/dismiss buttons
- On submit, POSTs to `/api/feedback` and writes to sessionStorage to prevent re-showing
- On dismiss, writes to sessionStorage and hides — learner can close without submitting
- Does not block access to the rest of the page (not a modal — no backdrop overlay)

- [ ] **Step 1: Create the component**

```tsx
// components/hub/FeedbackPopup.tsx
'use client'

import { useState, useEffect } from 'react'

interface FeedbackPopupProps {
  contentType: 'COURSE' | 'TEMPLATE' | 'VIDEO' | 'LEARNING_PATH'
  contentId: string
  show: boolean
}

function getStorageKey(contentType: string, contentId: string) {
  return `feedback_shown_${contentType}_${contentId}`
}

export function FeedbackPopup({ contentType, contentId, show }: FeedbackPopupProps) {
  const [visible, setVisible] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!show) return
    const key = getStorageKey(contentType, contentId)
    if (sessionStorage.getItem(key)) return
    setVisible(true)
  }, [show, contentType, contentId])

  function dismiss() {
    sessionStorage.setItem(getStorageKey(contentType, contentId), '1')
    setVisible(false)
  }

  async function handleSubmit() {
    if (rating === 0) return
    setSubmitting(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentId, rating, comment: comment.trim() || null }),
      })
      setSubmitted(true)
      sessionStorage.setItem(getStorageKey(contentType, contentId), '1')
      setTimeout(() => setVisible(false), 2000)
    } catch {
      // Fail silently — feedback is non-critical
    } finally {
      setSubmitting(false)
    }
  }

  if (!visible) return null

  return (
    <div
      role="complementary"
      aria-label="Feedback"
      className="fixed bottom-20 right-6 z-30 w-[340px] rounded-xl border border-diligent-gray-2 bg-white p-6 shadow-lg motion-safe:animate-[slideUp_0.3s_ease-out]"
    >
      {submitted ? (
        <div className="text-center">
          <span className="material-symbols-sharp text-[32px] text-diligent-red" aria-hidden="true">
            check_circle
          </span>
          <p className="mt-2 text-sm font-medium text-diligent-gray-5">Thank you for your feedback!</p>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-bold text-diligent-gray-5">How was this content?</h3>
            <button
              type="button"
              onClick={dismiss}
              className="ml-4 text-diligent-gray-3 transition-colors hover:text-diligent-gray-5"
              aria-label="Close feedback"
            >
              <span className="material-symbols-sharp text-[20px]">close</span>
            </button>
          </div>
          <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-0.5 transition-colors"
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                role="radio"
                aria-checked={rating === star}
              >
                <span
                  className={`material-symbols-sharp text-[28px] ${
                    star <= (hoveredStar || rating)
                      ? 'text-diligent-red'
                      : 'text-diligent-gray-2'
                  }`}
                  style={{ fontVariationSettings: star <= (hoveredStar || rating) ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any additional comments? (optional)"
            rows={3}
            className="mt-3 w-full resize-none rounded-lg border border-diligent-gray-2 px-3 py-2 text-sm text-diligent-gray-5 placeholder:text-diligent-gray-3 focus:border-diligent-gray-3 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="mt-3 w-full rounded-lg bg-diligent-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit feedback'}
          </button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/hub/FeedbackPopup.tsx
git commit -m "feat: feedback popup component with star rating and comment"
```

---

### Task 2: Create the feedback API endpoint

**Files:**
- Create: `app/api/feedback/route.ts`

Validates the payload (rating 1–5, valid content type, content ID present) and creates a `Feedback` record.

- [ ] **Step 1: Create the endpoint**

```typescript
// app/api/feedback/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const VALID_TYPES = ['COURSE', 'TEMPLATE', 'VIDEO', 'LEARNING_PATH'] as const

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { contentType, contentId, rating, comment } = body

    if (!VALID_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }
    if (!contentId || typeof contentId !== 'string') {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
    }

    const feedback = await prisma.feedback.create({
      data: {
        contentType,
        contentId,
        rating,
        comment: comment || null,
      },
    })

    return NextResponse.json({ id: feedback.id }, { status: 201 })
  } catch (error) {
    console.error('Failed to save feedback:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/feedback/route.ts
git commit -m "feat: feedback submission API endpoint"
```

---

### Task 3: Wire the popup into content pages

**Files:**
- Modify: `components/hub/CourseRightColumn.tsx`
- Modify: `components/hub/TemplateDownloadSection.tsx`
- Modify: `components/hub/VideoRightColumn.tsx`
- Modify: `components/hub/LearningPathProgress.tsx`

Each component already tracks a completion state. We add `<FeedbackPopup>` with `show` bound to that state.

- [ ] **Step 1: Add to CourseRightColumn**

CourseRightColumn already has a `completed` state (`useState(false)`, set to `true` in `handleScormComplete`). Import FeedbackPopup and render it alongside the completion message, passing `show={completed}`.

Add at the top:
```tsx
import { FeedbackPopup } from './FeedbackPopup'
```

Then render the popup next to the completion UI (inside the `if (completed)` block, after the existing completion card). The component needs a `contentId` prop — it already receives the course data. Pass `courseId` (the prop that holds the course ID) to FeedbackPopup.

The component needs to know the course ID. Check the existing props — it receives `courseId` or similar. Add the popup:

```tsx
<FeedbackPopup contentType="COURSE" contentId={courseId} show={completed} />
```

- [ ] **Step 2: Add to TemplateDownloadSection**

Templates don't have a completion state — "completion" is the download click itself. Add a `downloaded` state that becomes `true` when the download link is clicked, and show the popup.

Add at the top:
```tsx
import { useState } from 'react'
import { FeedbackPopup } from './FeedbackPopup'
```

Add state:
```tsx
const [downloaded, setDownloaded] = useState(false)
```

The component needs a `contentId` prop — add it to the interface:
```tsx
interface TemplateDownloadSectionProps {
  accessTier: string
  fileUrl?: string
  contentId: string
}
```

On the download `<a>` tag, add `onClick={() => setDownloaded(true)}`.

Render the popup after the download button:
```tsx
<FeedbackPopup contentType="TEMPLATE" contentId={contentId} show={downloaded} />
```

Update the parent (template page) to pass `contentId={template.id}`.

- [ ] **Step 3: Add to VideoRightColumn**

VideoRightColumn accepts an `onVideoEnd` prop but doesn't currently use it for internal state. Add a `completed` state set to `true` when `onVideoEnd` fires, and show the popup.

Add at the top:
```tsx
import { useState } from 'react'
import { FeedbackPopup } from './FeedbackPopup'
```

Add state and wire the callback:
```tsx
const [videoCompleted, setVideoCompleted] = useState(false)
```

Pass `onVideoEnd={() => setVideoCompleted(true)}` to the VidyardEmbed (already has this prop wired through).

Render the popup:
```tsx
<FeedbackPopup contentType="VIDEO" contentId={contentId} show={videoCompleted} />
```

- [ ] **Step 4: Add to LearningPathProgress**

LearningPathProgress already tracks `allMandatoryComplete` state. Import FeedbackPopup and render it when `allMandatoryComplete` is `true`.

Add at the top:
```tsx
import { FeedbackPopup } from './FeedbackPopup'
```

The component already has `learningPathId` in scope. Render the popup:
```tsx
<FeedbackPopup contentType="LEARNING_PATH" contentId={learningPathId} show={allMandatoryComplete} />
```

- [ ] **Step 5: Commit**

```bash
git add components/hub/CourseRightColumn.tsx components/hub/TemplateDownloadSection.tsx components/hub/VideoRightColumn.tsx components/hub/LearningPathProgress.tsx
git commit -m "feat: wire feedback popup into all content completion flows"
```

---

### Task 4: Monthly feedback digest email via Vercel Cron

**Files:**
- Create: `app/api/cron/feedback-digest/route.ts`
- Create: `vercel.json`

A cron endpoint that runs on the 1st of each month. It queries all feedback from the previous calendar month, groups by content item, calculates average ratings, and sends a formatted email to certifications@diligent.com using the existing Nodemailer SMTP config.

The endpoint is protected by checking the `Authorization` header against `CRON_SECRET` (a Vercel-provided environment variable for cron security).

- [ ] **Step 1: Create the cron endpoint**

```typescript
// app/api/cron/feedback-digest/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import nodemailer from 'nodemailer'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Previous calendar month range
    const now = new Date()
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    const feedback = await prisma.feedback.findMany({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (feedback.length === 0) {
      return NextResponse.json({ message: 'No feedback to send' })
    }

    // Group by content item
    const grouped = new Map<string, typeof feedback>()
    for (const item of feedback) {
      const key = `${item.contentType}:${item.contentId}`
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(item)
    }

    // Build email body
    const monthLabel = startOfLastMonth.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    })

    let html = `<h2>Learning Hub Feedback Digest — ${monthLabel}</h2>`
    html += `<p>${feedback.length} feedback submission${feedback.length !== 1 ? 's' : ''} received.</p>`

    for (const [key, items] of grouped) {
      const [type, id] = key.split(':')
      const avgRating = (items.reduce((sum, f) => sum + f.rating, 0) / items.length).toFixed(1)

      html += `<h3>${type} (${id})</h3>`
      html += `<p><strong>Average rating:</strong> ${avgRating}/5 (${items.length} response${items.length !== 1 ? 's' : ''})</p>`
      html += '<ul>'
      for (const f of items) {
        const stars = '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating)
        html += `<li>${stars}`
        if (f.comment) html += ` — "${f.comment}"`
        if (f.learnerEmail) html += ` <em>(${f.learnerEmail})</em>`
        html += `</li>`
      }
      html += '</ul>'
    }

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'certifications@diligent.com',
      subject: `Learning Hub Feedback Digest — ${monthLabel}`,
      html,
    })

    return NextResponse.json({ sent: feedback.length })
  } catch (error) {
    console.error('Feedback digest failed:', error)
    return NextResponse.json({ error: 'Digest failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create vercel.json with cron schedule**

```json
{
  "crons": [
    {
      "path": "/api/cron/feedback-digest",
      "schedule": "0 8 1 * *"
    }
  ]
}
```

This runs at 08:00 UTC on the 1st of every month.

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/feedback-digest/route.ts vercel.json
git commit -m "feat: monthly feedback digest email via Vercel Cron"
```
