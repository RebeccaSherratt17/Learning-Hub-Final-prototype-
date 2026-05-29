# Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Learning Hub homepage with a search-first hero, organization type selector, most popular widget, and 6 subject group content widgets that all respond to the selected org type.

**Architecture:** Server component page fetches all initial data (defaulting to "Public company" org type). A client wrapper (`HomepageContent`) manages org type state and re-fetches content via `/api/hub/content` when the user switches org type. Sections 1 (hero), 5 (partners), and 6 (footer CTA) are independent of org type and render directly from the server. Sections 2-4 (org selector, popular widget, subject group widgets) live inside the client wrapper.

**Tech Stack:** Next.js 14 App Router, Prisma, TypeScript, Tailwind CSS, Material Symbols Sharp icons.

---

## File Structure

### New files

| File | Responsibility |
|------|----------------|
| `app/api/hub/content/route.ts` | Public GET endpoint — returns `ContentItem[]` filtered by org type, subject, sort, content type, limit |
| `lib/content.ts` | Shared content mapping functions (extracted from page.tsx to avoid duplication between page and API route) |
| `components/hub/HomepageHero.tsx` | Section 1 — hero with search bar and suggestion pills |
| `components/hub/HomepageContent.tsx` | Client wrapper for sections 2-4 — manages org type state, fetches content on org type change |
| `components/hub/OrgTypeSelector.tsx` | Section 2 — three-column org type bar with active state |
| `components/hub/PopularWidget.tsx` | Section 3 — horizontally scrollable most popular content with type filter tabs |
| `components/hub/SubjectGroupWidget.tsx` | Section 4 — left info panel + right card scroller for a single subject group |
| `components/hub/HorizontalCardScroller.tsx` | Shared horizontal snap-scroll card row with scroll arrows and "See all" card |
| `components/hub/subjectGroupConfig.ts` | Config mapping group slugs to icons and descriptions |

### Modified files

| File | Change |
|------|--------|
| `app/(hub)/page.tsx` | Complete rewrite — new data fetching, new section composition |

### Unchanged files (reused as-is)

- `components/hub/PartnerLogoScroller.tsx`
- `components/hub/FooterCTASection.tsx`
- `components/hub/ContentCard.tsx`
- `components/ui/Badge.tsx`
- `components/ui/Icon.tsx`
- `types/content.ts`
- `lib/db.ts`

---

## Task 1: Extract shared content mapping functions into `lib/content.ts`

**Files:**
- Create: `lib/content.ts`

The four `toXxxItem()` mapping functions and `mapAccessTier()` are currently duplicated in `app/(hub)/page.tsx` and `app/(hub)/library/page.tsx`. Extract them into a shared module so the new homepage and API route can reuse them.

- [ ] **Step 1: Create `lib/content.ts`**

```typescript
import type { ContentItem, AccessTier } from '@/types/content'
import { AccessTier as PrismaAccessTier, ContentStatus } from '@/lib/generated/prisma'

export function mapAccessTier(tier: PrismaAccessTier): AccessTier {
  const mapping: Record<PrismaAccessTier, AccessTier> = {
    FREE: 'free',
    GATED: 'gated',
    PREMIUM: 'premium',
  }
  return mapping[tier]
}

/** Prisma include clause for taxonomy relations — reusable across queries */
export const taxonomyInclude = {
  subjects: { include: { subject: { include: { group: true } } } },
  personas: { include: { persona: true } },
  regions: { include: { region: true } },
} as const

export const publishedFilter = { status: ContentStatus.PUBLISHED } as const

// ─── Mapper types ───
// These use a loose shape so any Prisma result with matching fields works.

interface SubjectJoin {
  subject: { id: string; name: string; group?: { slug: string } | null }
}
interface PersonaJoin {
  persona: { id: string; name: string }
}
interface RegionJoin {
  region: { id: string; name: string }
}
interface BaseRow {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  thumbnailAlt: string | null
  accessTier: PrismaAccessTier
  publishedAt: Date | null
  viewCount: number
  subjects: SubjectJoin[]
  personas: PersonaJoin[]
  regions: RegionJoin[]
}

function mapRow(row: BaseRow, type: ContentItem['_type']): ContentItem {
  return {
    _id: row.id,
    _type: type,
    title: row.title,
    slug: row.slug,
    description: row.description,
    thumbnailUrl: row.thumbnailUrl,
    thumbnailAlt: row.thumbnailAlt,
    accessTier: mapAccessTier(row.accessTier),
    subjects: row.subjects.map((s) => ({
      _id: s.subject.id,
      title: s.subject.name,
      group: s.subject.group?.slug ?? null,
    })),
    personas: row.personas.map((p) => ({
      _id: p.persona.id,
      title: p.persona.name,
    })),
    regions: row.regions.map((r) => ({
      _id: r.region.id,
      title: r.region.name,
    })),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    viewCount: row.viewCount,
  }
}

export function toCourseItem(c: BaseRow): ContentItem {
  return mapRow(c, 'course')
}

export function toTemplateItem(t: BaseRow): ContentItem {
  return mapRow(t, 'template')
}

export function toVideoItem(v: BaseRow): ContentItem {
  return mapRow(v, 'video')
}

export function toLearningPathItem(lp: BaseRow): ContentItem {
  return mapRow(lp, 'learningPath')
}
```

- [ ] **Step 2: Verify the build still passes**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds (the new file is not imported yet, so no change in output).

- [ ] **Step 3: Commit**

```bash
git add lib/content.ts
git commit -m "refactor: extract shared content mapping functions into lib/content.ts"
```

---

## Task 2: Create the `/api/hub/content` API route

**Files:**
- Create: `app/api/hub/content/route.ts`

Public GET endpoint for client-side content fetching when the org type changes. No authentication required — only returns published, non-restricted content.

- [ ] **Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  toCourseItem,
  toTemplateItem,
  toVideoItem,
  toLearningPathItem,
  taxonomyInclude,
  publishedFilter,
} from '@/lib/content'
import type { ContentItem } from '@/types/content'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const orgType = params.get('orgType')
  const subjectIds = params.getAll('subject')
  const sort = params.get('sort') ?? 'popular'
  const type = params.get('type')
  const limit = Math.min(Number(params.get('limit')) || 12, 50)

  // Build the subject filter: org type + optional subject IDs
  const subjectFilter: string[] = []
  if (orgType) subjectFilter.push(orgType)
  subjectFilter.push(...subjectIds)

  const subjectWhere =
    subjectFilter.length > 0
      ? { some: { subjectId: { in: subjectFilter } } }
      : undefined

  // If both orgType and subjectIds are provided, we need items that match BOTH.
  // Use separate `some` clauses so Prisma ANDs them.
  const buildSubjectsWhere = () => {
    if (orgType && subjectIds.length > 0) {
      return {
        AND: [
          { subjects: { some: { subjectId: orgType } } },
          { subjects: { some: { subjectId: { in: subjectIds } } } },
        ],
      }
    }
    if (subjectFilter.length > 0) {
      return { subjects: { some: { subjectId: { in: subjectFilter } } } }
    }
    return {}
  }

  const subjectsWhere = buildSubjectsWhere()

  const orderBy =
    sort === 'newest'
      ? { publishedAt: 'desc' as const }
      : { viewCount: 'desc' as const }

  const typeMap: Record<string, string> = {
    COURSE: 'course',
    TEMPLATE: 'template',
    VIDEO: 'video',
    LEARNING_PATH: 'learningPath',
  }

  const requestedType = type ? typeMap[type] : null
  const items: ContentItem[] = []

  // Fetch each content type (unless a specific type is requested)
  if (!requestedType || requestedType === 'course') {
    const courses = await prisma.course.findMany({
      where: {
        ...publishedFilter,
        restricted: false,
        ...subjectsWhere,
      },
      include: taxonomyInclude,
      orderBy,
      take: limit,
    })
    items.push(...courses.map(toCourseItem))
  }

  if (!requestedType || requestedType === 'template') {
    const templates = await prisma.template.findMany({
      where: {
        ...publishedFilter,
        ...subjectsWhere,
      },
      include: taxonomyInclude,
      orderBy,
      take: limit,
    })
    items.push(...templates.map(toTemplateItem))
  }

  if (!requestedType || requestedType === 'video') {
    const videos = await prisma.video.findMany({
      where: {
        ...publishedFilter,
        ...subjectsWhere,
      },
      include: taxonomyInclude,
      orderBy,
      take: limit,
    })
    items.push(...videos.map(toVideoItem))
  }

  if (!requestedType || requestedType === 'learningPath') {
    const learningPaths = await prisma.learningPath.findMany({
      where: {
        ...publishedFilter,
        ...subjectsWhere,
      },
      include: taxonomyInclude,
      orderBy,
      take: limit,
    })
    items.push(...learningPaths.map(toLearningPathItem))
  }

  // Re-sort the combined results
  if (sort === 'newest') {
    items.sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() -
        new Date(a.publishedAt ?? 0).getTime(),
    )
  } else {
    items.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
  }

  return NextResponse.json(items.slice(0, limit))
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npx next build 2>&1 | tail -10`
Expected: Build succeeds and the route `ƒ /api/hub/content` appears in the output.

- [ ] **Step 3: Commit**

```bash
git add app/api/hub/content/route.ts
git commit -m "feat: add public /api/hub/content endpoint for homepage content fetching"
```

---

## Task 3: Create subject group config

**Files:**
- Create: `components/hub/subjectGroupConfig.ts`

Static config mapping each subject group slug to its icon and description. Used by SubjectGroupWidget.

- [ ] **Step 1: Create the config file**

```typescript
interface SubjectGroupMeta {
  icon: string
  description: string
}

/**
 * Maps subject group slugs to Material Symbols Sharp icon names and one-line descriptions.
 * Order in this object is the display order on the homepage.
 */
export const subjectGroupConfig: Record<string, SubjectGroupMeta> = {
  'board-governance': {
    icon: 'gavel',
    description: 'Everything boards and their teams need to govern effectively',
  },
  'board-meetings-committees': {
    icon: 'groups',
    description: 'Tools and guidance for running board meetings and committees',
  },
  'ai-technology': {
    icon: 'smart_toy',
    description:
      'Navigate the governance, ethics and risk dimensions of AI and cybersecurity',
  },
  'risk-management': {
    icon: 'shield',
    description: 'Build robust risk management practices across your organization',
  },
  'compliance-policy': {
    icon: 'policy',
    description: 'Stay ahead of regulatory obligations',
  },
  'governance-professionals': {
    icon: 'person',
    description: 'Resources designed for the people who make governance work',
  },
}

/** Ordered list of subject group slugs for homepage display */
export const subjectGroupOrder = Object.keys(subjectGroupConfig)

/** Config for organization type cards */
export const orgTypeConfig: Record<
  string,
  { icon: string; subtitle: string }
> = {
  'public-company': {
    icon: 'domain',
    subtitle: 'LISTED \u00B7 PUBLIC MARKETS',
  },
  'private-company': {
    icon: 'apartment',
    subtitle: 'PE-BACKED \u00B7 PRE-IPO',
  },
  nonprofit: {
    icon: 'volunteer_activism',
    subtitle: 'CHARITY / MISSION-LED',
  },
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/hub/subjectGroupConfig.ts
git commit -m "feat: add subject group and org type config for homepage widgets"
```

---

## Task 4: Create `HorizontalCardScroller` component

**Files:**
- Create: `components/hub/HorizontalCardScroller.tsx`

Reusable horizontal snap-scroll row of ContentCards with left/right scroll arrows and a "See all" card at the end.

- [ ] **Step 1: Create the component**

```typescript
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ContentCard } from '@/components/hub/ContentCard'
import { Icon } from '@/components/ui/Icon'
import type { ContentItem } from '@/types/content'

interface HorizontalCardScrollerProps {
  items: ContentItem[]
  seeAllHref: string
  seeAllLabel?: string
}

export function HorizontalCardScroller({
  items,
  seeAllHref,
  seeAllLabel = 'See all',
}: HorizontalCardScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      ro.disconnect()
    }
  }, [checkScroll, items])

  function scroll(direction: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector(':scope > *')?.clientWidth ?? 300
    const distance = cardWidth + 24 // card width + gap
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    })
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-sm text-diligent-gray-3">
        No content available for this selection.
      </p>
    )
  }

  return (
    <div className="group/scroller relative">
      {/* Scroll arrows */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute -left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-diligent-gray-2 bg-white shadow-md transition-opacity hover:bg-diligent-gray-1"
          aria-label="Scroll left"
        >
          <Icon name="chevron_left" className="text-[20px] text-diligent-gray-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute -right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-diligent-gray-2 bg-white shadow-md transition-opacity hover:bg-diligent-gray-1"
          aria-label="Scroll right"
        >
          <Icon name="chevron_right" className="text-[20px] text-diligent-gray-5" />
        </button>
      )}

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={item._id} className="w-[280px] flex-shrink-0">
            <ContentCard item={item} />
          </div>
        ))}

        {/* "See all" card */}
        <Link
          href={seeAllHref}
          className="flex w-[280px] flex-shrink-0 items-center justify-center rounded-md border border-dashed border-diligent-gray-2 bg-diligent-gray-1 no-underline transition-colors hover:border-diligent-gray-3 hover:bg-white hover:no-underline"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-diligent-gray-4">
            {seeAllLabel}
            <Icon name="arrow_forward" className="text-[16px]" />
          </span>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/hub/HorizontalCardScroller.tsx
git commit -m "feat: add HorizontalCardScroller component for homepage widgets"
```

---

## Task 5: Create `HomepageHero` component

**Files:**
- Create: `components/hub/HomepageHero.tsx`

Section 1: light gray hero with centered heading, subheading, search bar, and suggestion pills. The search bar navigates to `/library?q=[term]` on submit.

- [ ] **Step 1: Create the component**

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'

const suggestions = [
  'CSRD reporting',
  'AGM minutes',
  'Cybersecurity oversight',
  'Subsidiary governance',
  'AI policy',
]

export function HomepageHero() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Detect Mac vs Windows for keyboard shortcut hint
  const [isMac, setIsMac] = useState(false)
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'))
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/library?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/library')
    }
  }

  function handleSuggestionClick(term: string) {
    router.push(`/library?q=${encodeURIComponent(term)}`)
  }

  return (
    <section className="bg-diligent-gray-1 py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        {/* Heading */}
        <h1 className="text-display-1 font-semibold text-diligent-gray-5">
          Search the hub. Or scan the{' '}
          <span className="text-diligent-red">shelves.</span>
        </h1>

        {/* Subheading */}
        <p className="mx-auto mt-4 max-w-2xl text-lg text-diligent-gray-4">
          Browse a category, search a keyword, or click a subtopic to jump
          straight to what you need.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="mt-10">
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[24px] text-diligent-gray-3"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, templates, videos..."
              className="w-full rounded-lg border border-diligent-gray-2 bg-white py-4 pl-12 pr-20 text-base text-diligent-gray-5 shadow-sm outline-none placeholder:text-diligent-gray-3 focus-visible:border-link focus-visible:ring-0"
              aria-label="Search the Learning Hub"
            />
            <span
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded border border-diligent-gray-2 bg-diligent-gray-1 px-2 py-0.5 text-xs text-diligent-gray-3"
              aria-hidden="true"
            >
              {isMac ? '⌘ K' : 'Ctrl K'}
            </span>
          </div>
        </form>

        {/* Suggestion pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">
            Try:
          </span>
          {suggestions.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleSuggestionClick(term)}
              className="rounded-full border border-diligent-gray-2 bg-white px-3.5 py-1.5 text-sm text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/hub/HomepageHero.tsx
git commit -m "feat: add HomepageHero component with search bar and suggestion pills"
```

---

## Task 6: Create `OrgTypeSelector` component

**Files:**
- Create: `components/hub/OrgTypeSelector.tsx`

Section 2: dark bar with 3 org type columns. Active selection highlighted in red with checkmark badge.

- [ ] **Step 1: Create the component**

```typescript
'use client'

import { Icon } from '@/components/ui/Icon'
import { orgTypeConfig } from '@/components/hub/subjectGroupConfig'
import { cn } from '@/lib/cn'

export interface OrgType {
  id: string
  name: string
  slug: string
  count: number
}

interface OrgTypeSelectorProps {
  orgTypes: OrgType[]
  activeOrgTypeId: string
  onOrgTypeChange: (id: string) => void
}

export function OrgTypeSelector({
  orgTypes,
  activeOrgTypeId,
  onOrgTypeChange,
}: OrgTypeSelectorProps) {
  return (
    <section className="border-b border-diligent-gray-2">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <p className="pb-3 pt-12 text-[11px] font-semibold uppercase tracking-[0.1em] text-diligent-gray-3">
          I work for a...
        </p>
      </div>
      <div className="mx-auto max-w-[var(--max-content-width)] px-6 pb-12">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-diligent-gray-4 sm:grid-cols-3">
          {orgTypes.map((org) => {
            const isActive = org.id === activeOrgTypeId
            const config = orgTypeConfig[org.slug]
            if (!config) return null

            return (
              <button
                key={org.id}
                type="button"
                onClick={() => onOrgTypeChange(org.id)}
                className={cn(
                  'relative flex flex-col gap-1 px-6 py-5 text-left transition-colors',
                  isActive
                    ? 'bg-diligent-red text-white'
                    : 'bg-diligent-gray-5 text-white hover:bg-[#343a44]',
                )}
                aria-pressed={isActive}
              >
                {/* Active badge */}
                {isActive && (
                  <span className="absolute right-4 top-4 flex items-center gap-1 rounded-sm bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    <Icon name="check" className="text-[14px]" />
                    Viewing
                  </span>
                )}

                <Icon
                  name={config.icon}
                  className="text-[28px]"
                />
                <p className="text-lg font-semibold">{org.name}</p>
                <p
                  className={cn(
                    'text-[11px] font-medium uppercase tracking-wider',
                    isActive ? 'text-white/70' : 'text-diligent-gray-3',
                  )}
                >
                  {config.subtitle}
                </p>
                <p
                  className={cn(
                    'mt-1 text-xs font-semibold uppercase tracking-wider',
                    isActive ? 'text-white/80' : 'text-diligent-gray-3',
                  )}
                >
                  {org.count} resources
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/hub/OrgTypeSelector.tsx
git commit -m "feat: add OrgTypeSelector component for homepage org type bar"
```

---

## Task 7: Create `PopularWidget` component

**Files:**
- Create: `components/hub/PopularWidget.tsx`

Section 3: most popular content with type filter tabs and horizontal card scroller.

- [ ] **Step 1: Create the component**

```typescript
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { HorizontalCardScroller } from '@/components/hub/HorizontalCardScroller'
import { cn } from '@/lib/cn'
import type { ContentItem, ContentType } from '@/types/content'

const tabs: { label: string; type: ContentType }[] = [
  { label: 'Templates', type: 'template' },
  { label: 'Courses', type: 'course' },
  { label: 'Videos', type: 'video' },
  { label: 'Learning paths', type: 'learningPath' },
]

interface PopularWidgetProps {
  items: ContentItem[]
}

export function PopularWidget({ items }: PopularWidgetProps) {
  const [activeType, setActiveType] = useState<ContentType | null>(null)

  const filteredItems = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0),
    )
    if (!activeType) return sorted.slice(0, 12)
    return sorted.filter((i) => i._type === activeType).slice(0, 12)
  }, [items, activeType])

  return (
    <section className="border-b border-diligent-gray-2 py-12">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-diligent-gray-3">
            Across the hub
          </p>
          <div className="mt-1 flex items-center gap-3">
            <Icon name="star" className="text-[24px] text-diligent-red" />
            <h2 className="text-heading-2 font-semibold text-diligent-gray-5">
              Most popular
            </h2>
          </div>
          <div className="mt-1">
            <Link
              href="/library?sort=popular"
              className="text-sm font-medium text-link no-underline hover:underline"
            >
              See all popular &rarr;
            </Link>
          </div>
        </div>

        {/* Type filter tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveType(null)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              activeType === null
                ? 'border-diligent-gray-5 bg-diligent-gray-5 text-white'
                : 'border-diligent-gray-2 text-diligent-gray-4 hover:border-diligent-gray-3',
            )}
          >
            All
          </button>
          {tabs.map((tab) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => setActiveType(tab.type)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                activeType === tab.type
                  ? 'border-diligent-gray-5 bg-diligent-gray-5 text-white'
                  : 'border-diligent-gray-2 text-diligent-gray-4 hover:border-diligent-gray-3',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Card scroller */}
        <HorizontalCardScroller
          items={filteredItems}
          seeAllHref="/library?sort=popular"
          seeAllLabel="See all popular"
        />
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/hub/PopularWidget.tsx
git commit -m "feat: add PopularWidget component with type filter tabs"
```

---

## Task 8: Create `SubjectGroupWidget` component

**Files:**
- Create: `components/hub/SubjectGroupWidget.tsx`

Section 4 (repeated 6 times): left info panel with icon, description, sub-topic pills + right card scroller.

- [ ] **Step 1: Create the component**

```typescript
'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { HorizontalCardScroller } from '@/components/hub/HorizontalCardScroller'
import { subjectGroupConfig } from '@/components/hub/subjectGroupConfig'
import type { ContentItem } from '@/types/content'

interface SubjectInfo {
  id: string
  name: string
  slug: string
}

interface SubjectGroupWidgetProps {
  groupSlug: string
  groupName: string
  subjects: SubjectInfo[]
  items: ContentItem[]
  activeOrgTypeSlug: string
}

export function SubjectGroupWidget({
  groupSlug,
  groupName,
  subjects,
  items,
  activeOrgTypeSlug,
}: SubjectGroupWidgetProps) {
  const config = subjectGroupConfig[groupSlug]
  if (!config) return null

  const seeAllHref = `/library?subject=${groupSlug}&orgType=${activeOrgTypeSlug}`

  return (
    <section className="border-b border-diligent-gray-2 py-12">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr]">
          {/* Left panel */}
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-diligent-red">
              <Icon name={config.icon} className="text-[24px] text-white" />
            </div>
            <h2 className="text-heading-2 font-semibold text-diligent-gray-5">
              {groupName}
            </h2>
            <p className="text-sm leading-relaxed text-diligent-gray-4">
              {config.description}
            </p>

            {/* Sub-topic pills */}
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={`/library?subject=${subject.id}`}
                  className="rounded-full border border-diligent-gray-2 px-3 py-1 text-xs text-diligent-gray-4 no-underline transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5 hover:no-underline"
                >
                  {subject.name}
                </Link>
              ))}
            </div>

            {/* See all link */}
            <Link
              href={seeAllHref}
              className="mt-auto text-sm font-medium text-link no-underline hover:underline"
            >
              See all {items.length} items &rarr;
            </Link>
          </div>

          {/* Right panel — card scroller */}
          <div className="min-w-0">
            <HorizontalCardScroller
              items={items.slice(0, 12)}
              seeAllHref={seeAllHref}
              seeAllLabel="See all in this category"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/hub/SubjectGroupWidget.tsx
git commit -m "feat: add SubjectGroupWidget component with info panel and card scroller"
```

---

## Task 9: Create `HomepageContent` client wrapper

**Files:**
- Create: `components/hub/HomepageContent.tsx`

Client wrapper that manages org type state. On org type change, fetches updated content from `/api/hub/content` and passes it to child widgets.

- [ ] **Step 1: Create the component**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { OrgTypeSelector, type OrgType } from '@/components/hub/OrgTypeSelector'
import { PopularWidget } from '@/components/hub/PopularWidget'
import { SubjectGroupWidget } from '@/components/hub/SubjectGroupWidget'
import { subjectGroupOrder } from '@/components/hub/subjectGroupConfig'
import type { ContentItem } from '@/types/content'

interface SubjectGroupData {
  id: string
  name: string
  slug: string
  subjects: { id: string; name: string; slug: string }[]
}

interface HomepageContentProps {
  orgTypes: OrgType[]
  defaultOrgTypeId: string
  subjectGroups: SubjectGroupData[]
  initialItems: ContentItem[]
}

export function HomepageContent({
  orgTypes,
  defaultOrgTypeId,
  subjectGroups,
  initialItems,
}: HomepageContentProps) {
  const [activeOrgTypeId, setActiveOrgTypeId] = useState(defaultOrgTypeId)
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState(false)

  const activeOrgType = orgTypes.find((o) => o.id === activeOrgTypeId)
  const activeOrgTypeSlug = activeOrgType?.slug ?? 'public-company'

  const fetchContent = useCallback(async (orgTypeId: string) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/hub/content?orgType=${orgTypeId}&sort=popular&limit=50`,
      )
      if (res.ok) {
        const data: ContentItem[] = await res.json()
        setItems(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  function handleOrgTypeChange(id: string) {
    if (id === activeOrgTypeId) return
    setActiveOrgTypeId(id)
    fetchContent(id)
  }

  // Group items by subject group for the widgets
  function itemsForGroup(groupSlug: string): ContentItem[] {
    const group = subjectGroups.find((g) => g.slug === groupSlug)
    if (!group) return []
    const subjectIds = new Set(group.subjects.map((s) => s.id))
    return items.filter((item) =>
      item.subjects?.some((s) => subjectIds.has(s._id)),
    )
  }

  // Ordered groups matching the config order
  const orderedGroups = subjectGroupOrder
    .map((slug) => subjectGroups.find((g) => g.slug === slug))
    .filter(Boolean) as SubjectGroupData[]

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : ''}>
      {/* Section 2: Org type selector */}
      <OrgTypeSelector
        orgTypes={orgTypes}
        activeOrgTypeId={activeOrgTypeId}
        onOrgTypeChange={handleOrgTypeChange}
      />

      {/* Section 3: Most popular */}
      <PopularWidget items={items} />

      {/* Section 4: Subject group widgets */}
      {orderedGroups.map((group) => (
        <SubjectGroupWidget
          key={group.id}
          groupSlug={group.slug}
          groupName={group.name}
          subjects={group.subjects}
          items={itemsForGroup(group.slug)}
          activeOrgTypeSlug={activeOrgTypeSlug}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/hub/HomepageContent.tsx
git commit -m "feat: add HomepageContent client wrapper for org type state management"
```

---

## Task 10: Rewrite the homepage `app/(hub)/page.tsx`

**Files:**
- Modify: `app/(hub)/page.tsx` (complete rewrite)

Server component that fetches all initial data and composes the 6 sections.

- [ ] **Step 1: Rewrite the page**

```typescript
export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import {
  toCourseItem,
  toTemplateItem,
  toVideoItem,
  toLearningPathItem,
  taxonomyInclude,
  publishedFilter,
} from '@/lib/content'
import type { ContentItem } from '@/types/content'
import { HomepageHero } from '@/components/hub/HomepageHero'
import { HomepageContent } from '@/components/hub/HomepageContent'
import { PartnerLogoScroller } from '@/components/hub/PartnerLogoScroller'
import { FooterCTASection } from '@/components/hub/FooterCTASection'

export default async function HubHomePage() {
  const [
    settings,
    courses,
    templates,
    videos,
    learningPaths,
    partners,
    orgTypeSubjects,
    subjectGroupsRaw,
  ] = await Promise.all([
    prisma.hubSettings.findFirst(),
    prisma.course.findMany({
      where: { ...publishedFilter, restricted: false },
      include: taxonomyInclude,
      orderBy: { viewCount: 'desc' },
    }),
    prisma.template.findMany({
      where: publishedFilter,
      include: taxonomyInclude,
      orderBy: { viewCount: 'desc' },
    }),
    prisma.video.findMany({
      where: publishedFilter,
      include: taxonomyInclude,
      orderBy: { viewCount: 'desc' },
    }),
    prisma.learningPath.findMany({
      where: publishedFilter,
      include: taxonomyInclude,
      orderBy: { viewCount: 'desc' },
    }),
    prisma.educationalPartner.findMany({ orderBy: { order: 'asc' } }),
    // Fetch organization type subjects
    prisma.subject.findMany({
      where: { group: { slug: 'organization-type' } },
      include: { group: true },
    }),
    // Fetch all subject groups with their subjects (excluding org type)
    prisma.subjectGroup.findMany({
      where: { slug: { not: 'organization-type' } },
      include: {
        subjects: {
          orderBy: { name: 'asc' },
        },
      },
    }),
  ])

  // Build unified items
  const allItems: ContentItem[] = [
    ...courses.map(toCourseItem),
    ...templates.map(toTemplateItem),
    ...videos.map(toVideoItem),
    ...learningPaths.map(toLearningPathItem),
  ]

  // Find default org type (public-company)
  const defaultOrgType =
    orgTypeSubjects.find((s) => s.slug === 'public-company') ??
    orgTypeSubjects[0]
  const defaultOrgTypeId = defaultOrgType?.id ?? ''

  // Compute resource counts per org type
  const orgTypes = orgTypeSubjects.map((subject) => {
    const count = allItems.filter((item) =>
      item.subjects?.some((s) => s._id === subject.id),
    ).length
    return {
      id: subject.id,
      name: subject.name,
      slug: subject.slug,
      count,
    }
  })

  // Filter initial items to default org type
  const initialItems = defaultOrgTypeId
    ? allItems.filter((item) =>
        item.subjects?.some((s) => s._id === defaultOrgTypeId),
      )
    : allItems

  // Map subject groups for HomepageContent
  const subjectGroups = subjectGroupsRaw.map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    subjects: g.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
    })),
  }))

  // Map partners
  const mappedPartners = partners.map((p) => ({
    _id: p.id,
    name: p.name,
    logoUrl: p.logoUrl,
    logoAlt: p.logoAlt,
    url: p.linkUrl,
  }))

  return (
    <>
      {/* Section 1: Hero / Search */}
      <HomepageHero />

      {/* Sections 2-4: Org type selector, Popular, Subject groups */}
      <HomepageContent
        orgTypes={orgTypes}
        defaultOrgTypeId={defaultOrgTypeId}
        subjectGroups={subjectGroups}
        initialItems={initialItems}
      />

      {/* Section 5: Educational Partners */}
      <PartnerLogoScroller
        heading={settings?.partnersSectionHeading ?? null}
        partners={mappedPartners}
      />

      {/* Section 6: Footer CTA */}
      <FooterCTASection
        heading={settings?.footerHeading ?? null}
        body={settings?.footerBody ?? null}
        ctaText={settings?.footerCTAText ?? null}
        ctaUrl={settings?.demoCTAUrl ?? null}
      />
    </>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -10`
Expected: Build succeeds and `ƒ /` appears in the routes list.

- [ ] **Step 3: Test locally**

Run: `npx next dev`
- Visit `http://localhost:3000` — verify the new homepage renders all 6 sections
- Click each org type — verify content updates in all widgets
- Type in the search bar and press Enter — verify it navigates to `/library?q=[term]`
- Click a suggestion pill — verify it navigates to `/library?q=[term]`
- Click a sub-topic pill — verify it navigates to `/library?subject=[id]`
- Verify the partner scroller and footer CTA still render correctly
- Test at mobile breakpoints (375px, 768px) — verify responsive layout

- [ ] **Step 4: Commit**

```bash
git add app/(hub)/page.tsx
git commit -m "feat: rebuild homepage with search hero, org type selector, and subject group widgets"
```

---

## Task 11: Update library page to use shared `lib/content.ts`

**Files:**
- Modify: `app/(hub)/library/page.tsx`

Replace the duplicated mapping functions with imports from `lib/content.ts`. This is a refactor — no behaviour change.

- [ ] **Step 1: Update library page imports and remove duplicate functions**

Replace the top of `app/(hub)/library/page.tsx`. Remove these local functions: `mapAccessTier`, `toCourseItem`, `toTemplateItem`, `toVideoItem`, `toLearningPathItem`, and the `publishedFilter` and `taxonomyInclude` constants. Replace with imports from `lib/content.ts`.

The updated imports section:

```typescript
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import type { ContentItem } from '@/types/content'
import {
  toCourseItem,
  toTemplateItem,
  toVideoItem,
  toLearningPathItem,
  taxonomyInclude,
  publishedFilter,
} from '@/lib/content'
import { HeroSection } from '@/components/hub/HeroSection'
import { PopularFeaturedSection } from '@/components/hub/PopularFeaturedSection'
import { PartnerLogoScroller } from '@/components/hub/PartnerLogoScroller'
import { ResourceLibrary } from '@/components/hub/ResourceLibrary'
import { CertificationsSection } from '@/components/hub/CertificationsSection'
import { FooterCTASection } from '@/components/hub/FooterCTASection'
```

Remove the local `mapAccessTier`, `toCourseItem`, `toTemplateItem`, `toVideoItem`, `toLearningPathItem`, `publishedFilter`, `taxonomyInclude`, and the `AccessTier as PrismaAccessTier, ContentStatus` import from `@/lib/generated/prisma`.

The `fetchCourses()`, `fetchTemplates()`, `fetchVideos()`, `fetchLearningPaths()` functions remain local because they use `prisma` directly.

Update `fetchCourses`:
```typescript
function fetchCourses() {
  return prisma.course.findMany({
    where: { ...publishedFilter, restricted: false },
    include: taxonomyInclude,
    orderBy: { publishedAt: 'desc' },
  })
}
```

The fetch functions use `publishedFilter` and `taxonomyInclude` from the import. The rest of the page (the `LibraryPage` function, JSX, etc.) stays the same.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds. Library page still renders correctly.

- [ ] **Step 3: Test locally**

Run: `npx next dev`
Visit `http://localhost:3000/library` — verify the library page still works identically (filters, search, sort, pagination).

- [ ] **Step 4: Commit**

```bash
git add app/(hub)/library/page.tsx
git commit -m "refactor: use shared content mapping functions in library page"
```

---

## Summary of files

| # | File | Action |
|---|------|--------|
| 1 | `lib/content.ts` | Create — shared mapping functions |
| 2 | `app/api/hub/content/route.ts` | Create — public content API |
| 3 | `components/hub/subjectGroupConfig.ts` | Create — group/org type config |
| 4 | `components/hub/HorizontalCardScroller.tsx` | Create — reusable card scroller |
| 5 | `components/hub/HomepageHero.tsx` | Create — search hero |
| 6 | `components/hub/OrgTypeSelector.tsx` | Create — org type bar |
| 7 | `components/hub/PopularWidget.tsx` | Create — most popular section |
| 8 | `components/hub/SubjectGroupWidget.tsx` | Create — subject group section |
| 9 | `components/hub/HomepageContent.tsx` | Create — client state wrapper |
| 10 | `app/(hub)/page.tsx` | Rewrite — new homepage |
| 11 | `app/(hub)/library/page.tsx` | Modify — use shared imports |
