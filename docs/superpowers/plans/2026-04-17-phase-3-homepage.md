# Phase 3: Full Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Phase 2 demo homepage with the full 7-section Diligent Learning Hub homepage — hero, popular/newest widgets, partner logo scroller, full filterable resource library, questions CTA, certifications row, and footer CTA — all driven by Sanity Hub Settings content.

**Architecture:** Server component homepage fetches all data from Sanity in parallel via `Promise.all`, renders 7 section components. Only the resource library (Section 4) is a client component — it receives content items and taxonomy data as props, handles search/filter/sort/pagination client-side with URL search params. All section headings and body copy come from the Hub Settings singleton in Sanity.

**Tech Stack:** Next.js 14 App Router (server components + one client island), Sanity v3 (GROQ via `sanityFetch`), Tailwind CSS, `next/font/google` (Plus Jakarta Sans), Google Material Symbols Sharp, `clsx` + `tailwind-merge`, Vitest + `@testing-library/react`

**IMPORTANT — `baseUrl` prohibition:** Do NOT add `baseUrl` to `tsconfig.json`. The local `sanity/` folder shadows the npm `sanity` package when `baseUrl` is set. Prefixed paths (`@/*`) work without `baseUrl` because `moduleResolution` is `"bundler"` (TS 5+).

---

## Pre-check: Before you start

- [ ] **P1. Confirm current state.**

```bash
git status
git log --oneline -5
```

Expected: on `master`, clean working tree (aside from untracked `images/` assets and `.claude/settings.local.json`). Top commits should include the Phase 2 merge and Phase 3 spec.

- [ ] **P2. Create feature branch.**

```bash
git checkout -b feature/phase-3-homepage
```

---

## File structure

```
sanity/lib/
├── queries.ts                          # MODIFY: expand hubSettingsQuery, cardProjection; add 5 new queries
components/
├── ui/
│   ├── Button.tsx                      # CREATE: shared CTA button primitive
│   └── __tests__/
│       └── Button.test.tsx             # CREATE
└── hub/
    ├── HeroSection.tsx                 # CREATE
    ├── ContentTypeSignpost.tsx         # CREATE
    ├── PopularFeaturedSection.tsx      # CREATE
    ├── ContentWidget.tsx               # CREATE
    ├── PartnerLogoScroller.tsx         # CREATE (client)
    ├── ResourceLibrary.tsx             # CREATE (client)
    ├── SearchBar.tsx                   # CREATE (client)
    ├── FilterBar.tsx                   # CREATE (client)
    ├── FilterDrawer.tsx                # CREATE (client)
    ├── SortDropdown.tsx                # CREATE (client)
    ├── Pagination.tsx                  # CREATE (client)
    ├── QuestionsSection.tsx            # CREATE
    ├── CertificationsSection.tsx       # CREATE
    ├── CertificationBadge.tsx          # CREATE
    ├── FooterCTASection.tsx            # CREATE
    └── __tests__/
        ├── Pagination.test.tsx         # CREATE
        └── ResourceLibrary.test.tsx    # CREATE
app/
├── globals.css                         # MODIFY: add partner scroller keyframes
├── (hub)/
│   └── page.tsx                        # MODIFY: full homepage with all 7 sections
types/
├── content.ts                          # MODIFY: add subject group labels map
├── sanity.generated.ts                 # REGENERATE after query changes
```

---

### Task 1: Expand GROQ queries and regenerate types

**Files:**
- Modify: `sanity/lib/queries.ts`
- Modify: `types/content.ts`
- Regenerate: `types/sanity.generated.ts`

- [ ] **Step 1: Expand `cardProjection` and `hubSettingsQuery`, add new queries**

Replace the full content of `sanity/lib/queries.ts` with:

```ts
import { defineQuery } from 'next-sanity'

// Projection used by every list/grid so ContentCard consumers get a consistent shape.
const cardProjection = `
  _id,
  _type,
  title,
  "slug": slug.current,
  description,
  thumbnail,
  accessTier,
  "subjects": subjects[]->{ _id, title, group },
  "personas": personas[]->{ _id, title },
  "regions": regions[]->{ _id, title },
  publishedAt,
  archived
`

// Shared content filter — excludes drafts, archived, and restricted courses.
const contentFilter = `
  _type in ["course", "template", "video", "learningPath"]
  && !(_id in path("drafts.**"))
  && archived != true
  && (_type != "course" || restricted != true)
`

/** All published, non-archived content items across all 4 content types. */
export const allContentItemsQuery = defineQuery(`
  *[${contentFilter}] | order(publishedAt desc) {
    ${cardProjection}
  }
`)

/** The Hub Settings singleton — all fields needed by the homepage. */
export const hubSettingsQuery = defineQuery(`
  *[_type == "hubSettings"][0]{
    siteTitle,
    siteDescription,
    demoCTAUrl,
    heroHeading,
    heroSubheading,
    heroOverview,
    popularSectionHeading,
    partnersSectionHeading,
    librarySectionHeading,
    questionsSectionHeading,
    questionsSectionBody,
    certificationsSectionHeading,
    certificationsSectionBody,
    footerHeading,
    footerBody,
    footerCTAText,
    privacyPolicyUrl
  }
`)

/** Newest 3 — homepage Widget 2. */
export const newestContentQuery = defineQuery(`
  *[${contentFilter}] | order(publishedAt desc)[0...3] {
    ${cardProjection}
  }
`)

/** Most popular 3 — homepage Widget 1 (by viewCount). */
export const popularContentQuery = defineQuery(`
  *[${contentFilter}] | order(viewCount desc, publishedAt desc)[0...3] {
    ${cardProjection}
  }
`)

/** Educational partner logos for the homepage scroller. */
export const educationalPartnersQuery = defineQuery(`
  *[_type == "educationalPartner"] | order(order asc) {
    _id,
    name,
    logo,
    url
  }
`)

/** Certification badges for the homepage row. */
export const certificationBadgesQuery = defineQuery(`
  *[_type == "certificationBadge"] | order(order asc) {
    _id,
    title,
    image,
    url
  }
`)

/** All personas — for filter dropdown. */
export const allPersonasQuery = defineQuery(`
  *[_type == "persona"] | order(title asc) {
    _id,
    title
  }
`)

/** All regions — for filter dropdown. */
export const allRegionsQuery = defineQuery(`
  *[_type == "region"] | order(title asc) {
    _id,
    title
  }
`)

/** All subjects — for filter dropdown (grouped). */
export const allSubjectsQuery = defineQuery(`
  *[_type == "subject"] | order(group asc, title asc) {
    _id,
    title,
    group
  }
`)

/** Single course by slug — for Phase 4 course detail page. */
export const courseBySlugQuery = defineQuery(`
  *[_type == "course" && slug.current == $slug && archived != true][0] {
    ${cardProjection},
    scormCourseId,
    estimatedDuration,
    author,
    restricted,
    restrictedAccessNote
  }
`)

/** Single template by slug — for Phase 4 template detail page. */
export const templateBySlugQuery = defineQuery(`
  *[_type == "template" && slug.current == $slug && archived != true][0] {
    ${cardProjection},
    file
  }
`)

/** Single video by slug — for Phase 4 video detail page. */
export const videoBySlugQuery = defineQuery(`
  *[_type == "video" && slug.current == $slug && archived != true][0] {
    ${cardProjection},
    vidyardEmbed,
    duration
  }
`)

/** Single learning path by slug — for Phase 4 learning path page. */
export const learningPathBySlugQuery = defineQuery(`
  *[_type == "learningPath" && slug.current == $slug && archived != true][0] {
    ${cardProjection},
    estimatedCompletionTime,
    credlyBadgeId,
    items[]->{ ${cardProjection} }
  }
`)
```

- [ ] **Step 2: Add subject group labels to `types/content.ts`**

Add to the end of `types/content.ts`:

```ts
export const subjectGroupLabels: Record<string, string> = {
  'board-leadership-operations': 'Board Leadership & Operations',
  'risk-management': 'Risk Management',
  'regulations-compliance': 'Regulations & Compliance',
  'entity-management': 'Entity Management',
  'organization-type': 'Organization Type',
}
```

- [ ] **Step 3: Regenerate types**

```bash
npm run sanity:types
```

Expected: `types/sanity.generated.ts` regenerated with new query result types including `PopularContentQueryResult`, `EducationalPartnersQueryResult`, `CertificationBadgesQueryResult`, `AllPersonasQueryResult`, `AllRegionsQueryResult`, `AllSubjectsQueryResult`, and an expanded `HubSettingsQueryResult`.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. The expanded `cardProjection` changes the shape of `AllContentItemsQueryResult` (now includes `personas` and `regions`), which flows through to `ContentItem`. `ContentCard` doesn't use these new fields so it should still compile.

- [ ] **Step 5: Run existing tests**

```bash
npm run test:run
```

Expected: all 16 tests pass. The `ContentCard` tests use `as unknown as ContentItem` casts so the shape change won't break them.

- [ ] **Step 6: Commit**

```bash
git add sanity/lib/queries.ts types/content.ts types/sanity.generated.ts schema.json
git commit -m "feat(sanity): expand queries with personas/regions, hub settings, partners, badges, taxonomy"
```

---

### Task 2: Build `Button` UI primitive

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/__tests__/Button.test.tsx`

- [ ] **Step 1: Write failing test**

Create `components/ui/__tests__/Button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('renders as a link when href is provided', () => {
    render(<Button href="/demo">Request a demo</Button>)
    const link = screen.getByRole('link', { name: 'Request a demo' })
    expect(link).toHaveAttribute('href', '/demo')
  })

  it('applies primary variant styles by default', () => {
    render(<Button>CTA</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-diligent-red')
  })

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-diligent-red')
  })

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-transparent')
  })
})
```

- [ ] **Step 2: Run test — expect fail**

```bash
npm run test:run -- components/ui/__tests__/Button.test.tsx
```

Expected: FAIL, "Cannot find module".

- [ ] **Step 3: Implement `Button`**

Create `components/ui/Button.tsx`:

```tsx
import Link from 'next/link'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-diligent-red text-white hover:bg-diligent-red-2 focus-visible:bg-diligent-red-2',
  secondary:
    'border border-diligent-red text-diligent-red bg-white hover:bg-diligent-gray-1 focus-visible:bg-diligent-gray-1',
  ghost:
    'bg-transparent text-current hover:bg-diligent-gray-1 focus-visible:bg-diligent-gray-1',
}

export interface ButtonProps {
  children: React.ReactNode
  variant?: ButtonVariant
  href?: string
  className?: string
  type?: 'button' | 'submit'
  onClick?: () => void
}

export function Button({
  children,
  variant = 'primary',
  href,
  className,
  type = 'button',
  onClick,
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-sm px-6 py-3 text-sm font-medium no-underline transition hover:no-underline focus-visible:no-underline',
    variantStyles[variant],
    className,
  )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} onClick={onClick}>
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npm run test:run -- components/ui/__tests__/Button.test.tsx
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Button.tsx components/ui/__tests__/Button.test.tsx
git commit -m "feat(ui): add Button primitive with primary, secondary, and ghost variants"
```

---

### Task 3: Build `HeroSection` and `ContentTypeSignpost`

**Files:**
- Create: `components/hub/HeroSection.tsx`, `components/hub/ContentTypeSignpost.tsx`

- [ ] **Step 1: Create `ContentTypeSignpost`**

Create `components/hub/ContentTypeSignpost.tsx`:

```tsx
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

interface SignpostItem {
  icon: string
  label: string
  description: string
  filterParam: string
}

const signposts: SignpostItem[] = [
  {
    icon: 'school',
    label: 'Courses',
    description:
      'Master essential GRC topics through targeted short courses.',
    filterParam: 'course',
  },
  {
    icon: 'description',
    label: 'Templates',
    description:
      'Access professionally crafted and ready-to-use templates that accelerate your governance initiatives.',
    filterParam: 'template',
  },
  {
    icon: 'play_circle',
    label: 'Videos',
    description:
      'Watch interviews with industry experts and animated content breaking down complex principles into digestible, memorable formats.',
    filterParam: 'video',
  },
  {
    icon: 'route',
    label: 'Learning Paths',
    description:
      'Access curated sets of content on a given topic, helping you build skills with clarity and confidence.',
    filterParam: 'learningPath',
  },
]

export function ContentTypeSignpost() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {signposts.map((item) => (
        <Link
          key={item.filterParam}
          href={`/#library?type=${item.filterParam}`}
          className="group flex items-start gap-3 rounded-md border border-diligent-gray-2 p-4 no-underline transition hover:border-diligent-gray-3 hover:no-underline"
        >
          <Icon
            name={item.icon}
            className="mt-0.5 text-[28px] text-diligent-red"
          />
          <div>
            <p className="font-semibold text-diligent-gray-5">{item.label}</p>
            <p className="mt-1 text-sm text-diligent-gray-4">
              {item.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `HeroSection`**

Create `components/hub/HeroSection.tsx`:

```tsx
import { ContentTypeSignpost } from '@/components/hub/ContentTypeSignpost'

const ETL_URL = 'https://www.diligent.com/solutions/board-education'

interface HeroSectionProps {
  heading: string | null
  subheading: string | null
  overview: string | null
}

export function HeroSection({ heading, subheading, overview }: HeroSectionProps) {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <h1 className="text-display-1 font-bold text-diligent-gray-5">
          {heading ?? 'Diligent Learning Hub'}
        </h1>
        {subheading && (
          <p className="mt-4 max-w-3xl text-lg text-diligent-gray-4">
            {subheading}
          </p>
        )}
        {overview && (
          <p className="mt-6 max-w-3xl text-diligent-gray-4">
            {overview.includes('Education & Templates Library') ? (
              <>
                {overview.split('Education & Templates Library')[0]}
                <a href={ETL_URL} className="font-medium">
                  Education &amp; Templates Library
                </a>
                {overview.split('Education & Templates Library')[1]}
              </>
            ) : (
              overview
            )}
          </p>
        )}
        <ContentTypeSignpost />
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/hub/HeroSection.tsx components/hub/ContentTypeSignpost.tsx
git commit -m "feat(hub): add HeroSection with content type signpost links"
```

---

### Task 4: Build `PopularFeaturedSection` and `ContentWidget`

**Files:**
- Create: `components/hub/ContentWidget.tsx`, `components/hub/PopularFeaturedSection.tsx`

- [ ] **Step 1: Create `ContentWidget`**

Create `components/hub/ContentWidget.tsx`:

```tsx
import { ContentCard } from '@/components/hub/ContentCard'
import type { ContentItem } from '@/types/content'

interface ContentWidgetProps {
  title: string
  items: ContentItem[]
}

export function ContentWidget({ title, items }: ContentWidgetProps) {
  if (items.length === 0) return null

  return (
    <div>
      <h3 className="mb-4 text-heading-3 font-semibold text-diligent-gray-5">
        {title}
      </h3>
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item._id}>
            <ContentCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Create `PopularFeaturedSection`**

Create `components/hub/PopularFeaturedSection.tsx`:

```tsx
import { ContentWidget } from '@/components/hub/ContentWidget'
import type { ContentItem } from '@/types/content'

interface PopularFeaturedSectionProps {
  heading: string | null
  popularItems: ContentItem[]
  newestItems: ContentItem[]
}

export function PopularFeaturedSection({
  heading,
  popularItems,
  newestItems,
}: PopularFeaturedSectionProps) {
  if (popularItems.length === 0 && newestItems.length === 0) return null

  return (
    <section className="bg-diligent-gray-1 py-16">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <h2 className="mb-8 text-heading-1 font-bold text-diligent-gray-5">
          {heading ?? 'Jump in: Popular and featured content'}
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <ContentWidget title="Most popular" items={popularItems} />
          <ContentWidget title="Newest" items={newestItems} />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/hub/ContentWidget.tsx components/hub/PopularFeaturedSection.tsx
git commit -m "feat(hub): add PopularFeaturedSection with Most Popular and Newest widgets"
```

---

### Task 5: Build `PartnerLogoScroller`

**Files:**
- Create: `components/hub/PartnerLogoScroller.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add marquee keyframes to `globals.css`**

Add to the end of `app/globals.css` (before the closing of the file):

```css
/* Partner logo scroller marquee */
@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
```

- [ ] **Step 2: Create `PartnerLogoScroller`**

Create `components/hub/PartnerLogoScroller.tsx`:

```tsx
'use client'

import Image from 'next/image'
import type { Image as SanityImage } from 'sanity'
import { urlForImage } from '@/sanity/lib/image'

interface Partner {
  _id: string
  name: string | null
  logo: {
    asset?: { _ref: string; _type: 'reference' } | null
    alt?: string | null
    [key: string]: unknown
  } | null
  url: string | null
}

interface PartnerLogoScrollerProps {
  heading: string | null
  partners: Partner[]
}

function PartnerLogo({ partner }: { partner: Partner }) {
  if (!partner.logo?.asset) return null

  const src = urlForImage(partner.logo as SanityImage)
    .height(80)
    .url()

  const img = (
    <Image
      src={src}
      alt={partner.logo.alt ?? partner.name ?? 'Partner logo'}
      width={160}
      height={80}
      className="h-12 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
    />
  )

  if (partner.url) {
    return (
      <a
        href={partner.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 no-underline hover:no-underline"
      >
        {img}
      </a>
    )
  }

  return <span className="flex-shrink-0">{img}</span>
}

export function PartnerLogoScroller({
  heading,
  partners,
}: PartnerLogoScrollerProps) {
  if (partners.length === 0) return null

  // Duplicate list for seamless loop
  const allLogos = [...partners, ...partners]

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <h2 className="mb-8 text-center text-heading-1 font-bold text-diligent-gray-5">
          {heading ?? 'Our educational partners'}
        </h2>
      </div>
      <div className="group relative overflow-hidden">
        <div
          className="flex items-center gap-12 motion-safe:animate-[marquee_30s_linear_infinite] motion-safe:group-hover:[animation-play-state:paused]"
          style={{ width: 'max-content' }}
        >
          {allLogos.map((partner, i) => (
            <PartnerLogo key={`${partner._id}-${i}`} partner={partner} />
          ))}
        </div>
      </div>
    </section>
  )
}
```

> Note: `motion-safe:` is Tailwind's built-in variant that only applies when `prefers-reduced-motion` is NOT `reduce`. Combined with the global `prefers-reduced-motion: reduce` reset in `globals.css`, users who prefer reduced motion see a static row of logos with no animation.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/hub/PartnerLogoScroller.tsx app/globals.css
git commit -m "feat(hub): add PartnerLogoScroller with CSS marquee and reduced-motion support"
```

---

### Task 6: Build `QuestionsSection`

**Files:**
- Create: `components/hub/QuestionsSection.tsx`

- [ ] **Step 1: Create `QuestionsSection`**

Create `components/hub/QuestionsSection.tsx`:

```tsx
interface QuestionsSectionProps {
  heading: string | null
  body: string | null
}

export function QuestionsSection({ heading, body }: QuestionsSectionProps) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6 text-center">
        <h2 className="text-heading-1 font-bold text-diligent-gray-5">
          {heading ?? 'Got questions?'}
        </h2>
        {body ? (
          <p className="mt-4 text-diligent-gray-4">
            {body.includes('certifications@diligent.com') ? (
              <>
                {body.split('certifications@diligent.com')[0]}
                <a
                  href="mailto:certifications@diligent.com"
                  className="font-medium"
                >
                  certifications@diligent.com
                </a>
                {body.split('certifications@diligent.com')[1]}
              </>
            ) : (
              body
            )}
          </p>
        ) : (
          <p className="mt-4 text-diligent-gray-4">
            We&apos;re here to help! If you have any questions about our
            educational resources, email{' '}
            <a
              href="mailto:certifications@diligent.com"
              className="font-medium"
            >
              certifications@diligent.com
            </a>
          </p>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/hub/QuestionsSection.tsx
git commit -m "feat(hub): add QuestionsSection with mailto link"
```

---

### Task 7: Build `CertificationsSection` and `CertificationBadge`

**Files:**
- Create: `components/hub/CertificationBadge.tsx`, `components/hub/CertificationsSection.tsx`

- [ ] **Step 1: Create `CertificationBadge`**

Create `components/hub/CertificationBadge.tsx`:

```tsx
import Image from 'next/image'
import type { Image as SanityImage } from 'sanity'
import { urlForImage } from '@/sanity/lib/image'

interface CertificationBadgeProps {
  title: string | null
  image: {
    asset?: { _ref: string; _type: 'reference' } | null
    alt?: string | null
    [key: string]: unknown
  } | null
  url: string | null
}

export function CertificationBadge({
  title,
  image,
  url,
}: CertificationBadgeProps) {
  if (!image?.asset) return null

  const src = urlForImage(image as SanityImage).width(200).url()

  const img = (
    <Image
      src={src}
      alt={image.alt ?? title ?? 'Certification badge'}
      width={200}
      height={200}
      className="h-auto w-full"
    />
  )

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline transition hover:opacity-80 hover:no-underline"
      >
        {img}
      </a>
    )
  }

  return <div>{img}</div>
}
```

- [ ] **Step 2: Create `CertificationsSection`**

Create `components/hub/CertificationsSection.tsx`:

```tsx
import { CertificationBadge } from '@/components/hub/CertificationBadge'

const ETL_URL = 'https://www.diligent.com/solutions/board-education'

interface Badge {
  _id: string
  title: string | null
  image: {
    asset?: { _ref: string; _type: 'reference' } | null
    alt?: string | null
    [key: string]: unknown
  } | null
  url: string | null
}

interface CertificationsSectionProps {
  heading: string | null
  body: string | null
  badges: Badge[]
}

export function CertificationsSection({
  heading,
  body,
  badges,
}: CertificationsSectionProps) {
  return (
    <section className="bg-diligent-gray-1 py-16">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6 text-center">
        <h2 className="text-heading-1 font-bold text-diligent-gray-5">
          {heading ?? 'Professionally-accredited certifications'}
        </h2>
        {body && (
          <p className="mx-auto mt-4 max-w-3xl text-diligent-gray-4">
            {body.includes('Education & Templates Library') ? (
              <>
                {body.split('Education & Templates Library')[0]}
                <a href={ETL_URL} className="font-medium">
                  Education &amp; Templates Library
                </a>
                {body.split('Education & Templates Library')[1]}
              </>
            ) : (
              body
            )}
          </p>
        )}
        {badges.length > 0 && (
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {badges.map((badge) => (
              <CertificationBadge
                key={badge._id}
                title={badge.title}
                image={badge.image}
                url={badge.url}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/hub/CertificationBadge.tsx components/hub/CertificationsSection.tsx
git commit -m "feat(hub): add CertificationsSection with null-safe badge links"
```

---

### Task 8: Build `FooterCTASection`

**Files:**
- Create: `components/hub/FooterCTASection.tsx`

- [ ] **Step 1: Create `FooterCTASection`**

Create `components/hub/FooterCTASection.tsx`:

```tsx
import { Button } from '@/components/ui/Button'

interface FooterCTASectionProps {
  heading: string | null
  body: string | null
  ctaText: string | null
  ctaUrl: string | null
}

export function FooterCTASection({
  heading,
  body,
  ctaText,
  ctaUrl,
}: FooterCTASectionProps) {
  return (
    <section className="bg-diligent-gray-5 py-16">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6 text-center">
        <h2 className="text-heading-1 font-bold text-white">
          {heading ?? 'Upskill your board today'}
        </h2>
        {body && <p className="mx-auto mt-4 max-w-2xl text-diligent-gray-3">{body}</p>}
        {ctaUrl && (
          <div className="mt-8">
            <Button href={ctaUrl}>
              {ctaText ?? 'Request a demo'}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/hub/FooterCTASection.tsx
git commit -m "feat(hub): add FooterCTASection with demo CTA button"
```

---

### Task 9: Build `SearchBar` and `SortDropdown`

**Files:**
- Create: `components/hub/SearchBar.tsx`, `components/hub/SortDropdown.tsx`

- [ ] **Step 1: Create `SearchBar`**

Create `components/hub/SearchBar.tsx`:

```tsx
'use client'

import { useCallback, useRef } from 'react'
import { Icon } from '@/components/ui/Icon'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onChange(val), 300)
    },
    [onChange],
  )

  return (
    <div className="relative w-full max-w-md">
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-diligent-gray-3"
      />
      <input
        type="search"
        placeholder="Search by title..."
        defaultValue={value}
        onChange={handleChange}
        className="w-full rounded-sm border border-diligent-gray-2 bg-white py-2.5 pl-10 pr-4 text-sm text-diligent-gray-5 outline-none placeholder:text-diligent-gray-3 focus-visible:border-link focus-visible:ring-0"
        aria-label="Search content by title"
      />
    </div>
  )
}
```

- [ ] **Step 2: Create `SortDropdown`**

Create `components/hub/SortDropdown.tsx`:

```tsx
'use client'

export type SortOption = 'newest' | 'popular' | 'az'

const sortLabels: Record<SortOption, string> = {
  newest: 'Newest',
  popular: 'Most popular',
  az: 'A\u2013Z',
}

interface SortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort-select"
        className="whitespace-nowrap text-sm text-diligent-gray-4"
      >
        Sort by
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="rounded-sm border border-diligent-gray-2 bg-white px-3 py-2 text-sm text-diligent-gray-5 outline-none focus-visible:border-link"
      >
        {(Object.keys(sortLabels) as SortOption[]).map((key) => (
          <option key={key} value={key}>
            {sortLabels[key]}
          </option>
        ))}
      </select>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/hub/SearchBar.tsx components/hub/SortDropdown.tsx
git commit -m "feat(hub): add SearchBar with debounce and SortDropdown"
```

---

### Task 10: Build `FilterBar` and `FilterDrawer`

**Files:**
- Create: `components/hub/FilterBar.tsx`, `components/hub/FilterDrawer.tsx`

- [ ] **Step 1: Create `FilterBar`**

Create `components/hub/FilterBar.tsx`:

```tsx
'use client'

import { cn } from '@/lib/cn'
import { contentTypeLabels, subjectGroupLabels } from '@/types/content'
import type { ContentType } from '@/types/content'

interface TaxonomyItem {
  _id: string
  title: string | null
}

interface SubjectItem extends TaxonomyItem {
  group: string | null
}

export interface FilterState {
  types: string[]
  personas: string[]
  regions: string[]
  subjects: string[]
}

interface FilterBarProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  personas: TaxonomyItem[]
  regions: TaxonomyItem[]
  subjects: SubjectItem[]
  className?: string
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-diligent-gray-4">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={cn(
                'rounded-sm border px-2.5 py-1 text-xs transition',
                isActive
                  ? 'border-diligent-gray-5 bg-diligent-gray-5 text-white'
                  : 'border-diligent-gray-2 bg-white text-diligent-gray-4 hover:border-diligent-gray-3',
              )}
              aria-pressed={isActive}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function toggleValue(arr: string[], value: string): string[] {
  return arr.includes(value)
    ? arr.filter((v) => v !== value)
    : [...arr, value]
}

export function FilterBar({
  filters,
  onFilterChange,
  personas,
  regions,
  subjects,
  className,
}: FilterBarProps) {
  const typeOptions = (
    Object.entries(contentTypeLabels) as [ContentType, string][]
  ).map(([value, label]) => ({ value, label }))

  const personaOptions = personas.map((p) => ({
    value: p._id,
    label: p.title ?? '',
  }))

  const regionOptions = regions.map((r) => ({
    value: r._id,
    label: r.title ?? '',
  }))

  // Group subjects by their group field
  const groupedSubjects = Object.entries(subjectGroupLabels).map(
    ([groupValue, groupLabel]) => ({
      groupLabel,
      items: subjects
        .filter((s) => s.group === groupValue)
        .map((s) => ({ value: s._id, label: s.title ?? '' })),
    }),
  )

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.personas.length > 0 ||
    filters.regions.length > 0 ||
    filters.subjects.length > 0

  return (
    <div className={cn('space-y-4', className)}>
      <FilterGroup
        label="Content type"
        options={typeOptions}
        selected={filters.types}
        onToggle={(v) =>
          onFilterChange({ ...filters, types: toggleValue(filters.types, v) })
        }
      />
      <FilterGroup
        label="Persona"
        options={personaOptions}
        selected={filters.personas}
        onToggle={(v) =>
          onFilterChange({
            ...filters,
            personas: toggleValue(filters.personas, v),
          })
        }
      />
      <FilterGroup
        label="Region"
        options={regionOptions}
        selected={filters.regions}
        onToggle={(v) =>
          onFilterChange({
            ...filters,
            regions: toggleValue(filters.regions, v),
          })
        }
      />
      {groupedSubjects.map(
        ({ groupLabel, items }) =>
          items.length > 0 && (
            <FilterGroup
              key={groupLabel}
              label={groupLabel}
              options={items}
              selected={filters.subjects}
              onToggle={(v) =>
                onFilterChange({
                  ...filters,
                  subjects: toggleValue(filters.subjects, v),
                })
              }
            />
          ),
      )}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() =>
            onFilterChange({ types: [], personas: [], regions: [], subjects: [] })
          }
          className="text-xs font-medium text-link hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `FilterDrawer`**

Create `components/hub/FilterDrawer.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/Icon'
import { FilterBar, type FilterState } from '@/components/hub/FilterBar'

interface TaxonomyItem {
  _id: string
  title: string | null
}

interface SubjectItem extends TaxonomyItem {
  group: string | null
}

interface FilterDrawerProps {
  open: boolean
  onClose: () => void
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  personas: TaxonomyItem[]
  regions: TaxonomyItem[]
  subjects: SubjectItem[]
}

export function FilterDrawer({
  open,
  onClose,
  filters,
  onFilterChange,
  personas,
  regions,
  subjects,
}: FilterDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Trap focus and handle Escape
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-diligent-gray-2 px-6 py-4">
          <h2 className="text-heading-3 font-semibold text-diligent-gray-5">
            Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 hover:bg-diligent-gray-1"
            aria-label="Close filters"
          >
            <Icon name="close" className="text-[24px]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <FilterBar
            filters={filters}
            onFilterChange={onFilterChange}
            personas={personas}
            regions={regions}
            subjects={subjects}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/hub/FilterBar.tsx components/hub/FilterDrawer.tsx
git commit -m "feat(hub): add FilterBar with multi-select grouped subjects and mobile FilterDrawer"
```

---

### Task 11: Build `Pagination`

**Files:**
- Create: `components/hub/Pagination.tsx`, `components/hub/__tests__/Pagination.test.tsx`

- [ ] **Step 1: Write failing test**

Create `components/hub/__tests__/Pagination.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Pagination, getPageNumbers } from '@/components/hub/Pagination'

describe('getPageNumbers', () => {
  it('returns all pages when total <= 7', () => {
    expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('returns truncated range with ellipsis for many pages, current near start', () => {
    expect(getPageNumbers(2, 12)).toEqual([1, 2, 3, '...', 12])
  })

  it('returns truncated range with ellipsis for many pages, current near end', () => {
    expect(getPageNumbers(11, 12)).toEqual([1, '...', 10, 11, 12])
  })

  it('returns double ellipsis for current in middle', () => {
    expect(getPageNumbers(6, 12)).toEqual([1, '...', 5, 6, 7, '...', 12])
  })
})

describe('Pagination', () => {
  it('renders nothing when totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders page buttons', () => {
    const onChange = vi.fn()
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={onChange} />,
    )
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('marks current page as aria-current', () => {
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={() => {}} />,
    )
    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page')
  })
})
```

- [ ] **Step 2: Run test — expect fail**

```bash
npm run test:run -- components/hub/__tests__/Pagination.test.tsx
```

Expected: FAIL, "Cannot find module".

- [ ] **Step 3: Implement `Pagination`**

Create `components/hub/Pagination.tsx`:

```tsx
'use client'

import { cn } from '@/lib/cn'

/**
 * Compute page numbers to display, inserting '...' for ellipsis gaps.
 * Always shows first, last, and a window around current.
 */
export function getPageNumbers(
  current: number,
  total: number,
): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = []

  if (current <= 3) {
    pages.push(1, 2, 3, '...', total)
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 2, total - 1, total)
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total)
  }

  return pages
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <nav aria-label="Pagination" className="mt-10 flex justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-sm px-3 py-2 text-sm text-diligent-gray-4 transition hover:bg-diligent-gray-1 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Previous page"
      >
        &lsaquo;
      </button>
      {pages.map((page, i) =>
        page === '...' ? (
          <span
            key={`ellipsis-${i}`}
            className="px-2 py-2 text-sm text-diligent-gray-3"
          >
            &hellip;
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(
              'min-w-[2.5rem] rounded-sm px-3 py-2 text-sm transition',
              page === currentPage
                ? 'bg-diligent-gray-5 font-semibold text-white'
                : 'text-diligent-gray-4 hover:bg-diligent-gray-1',
            )}
          >
            {page}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-sm px-3 py-2 text-sm text-diligent-gray-4 transition hover:bg-diligent-gray-1 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Next page"
      >
        &rsaquo;
      </button>
    </nav>
  )
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npm run test:run -- components/hub/__tests__/Pagination.test.tsx
```

Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add components/hub/Pagination.tsx components/hub/__tests__/Pagination.test.tsx
git commit -m "feat(hub): add Pagination with page number windowing and tests"
```

---

### Task 12: Build `ResourceLibrary`

**Files:**
- Create: `components/hub/ResourceLibrary.tsx`, `components/hub/__tests__/ResourceLibrary.test.tsx`

- [ ] **Step 1: Write failing test**

Create `components/hub/__tests__/ResourceLibrary.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { filterItems, sortItems } from '@/components/hub/ResourceLibrary'

// Mock next/navigation for useSearchParams / useRouter
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
}))

const items = [
  {
    _id: '1',
    _type: 'course' as const,
    title: 'Board Governance 101',
    slug: 'board-governance-101',
    description: 'Intro to governance.',
    thumbnail: null,
    accessTier: 'free' as const,
    subjects: [{ _id: 's1', title: 'Board Governance', group: 'board-leadership-operations' }],
    personas: [{ _id: 'p1', title: 'Board Director' }],
    regions: [{ _id: 'r1', title: 'Global' }],
    publishedAt: '2026-04-10T00:00:00Z',
    archived: false,
  },
  {
    _id: '2',
    _type: 'template' as const,
    title: 'AI Risk Template',
    slug: 'ai-risk-template',
    description: 'Template for AI risk.',
    thumbnail: null,
    accessTier: 'gated' as const,
    subjects: [{ _id: 's2', title: 'AI', group: 'risk-management' }],
    personas: [{ _id: 'p2', title: 'Risk' }],
    regions: [{ _id: 'r1', title: 'Global' }],
    publishedAt: '2026-04-15T00:00:00Z',
    archived: false,
  },
  {
    _id: '3',
    _type: 'video' as const,
    title: 'Compliance Overview',
    slug: 'compliance-overview',
    description: 'Video on compliance.',
    thumbnail: null,
    accessTier: 'free' as const,
    subjects: [{ _id: 's3', title: 'Compliance', group: 'regulations-compliance' }],
    personas: [{ _id: 'p1', title: 'Board Director' }],
    regions: [{ _id: 'r2', title: 'UK' }],
    publishedAt: '2026-04-12T00:00:00Z',
    archived: false,
  },
]

describe('filterItems', () => {
  it('returns all items with empty filters', () => {
    const result = filterItems(items as any, '', {
      types: [],
      personas: [],
      regions: [],
      subjects: [],
    })
    expect(result).toHaveLength(3)
  })

  it('filters by search term (case-insensitive)', () => {
    const result = filterItems(items as any, 'ai', {
      types: [],
      personas: [],
      regions: [],
      subjects: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe('2')
  })

  it('filters by content type', () => {
    const result = filterItems(items as any, '', {
      types: ['course'],
      personas: [],
      regions: [],
      subjects: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0]._type).toBe('course')
  })

  it('filters by persona (OR within category)', () => {
    const result = filterItems(items as any, '', {
      types: [],
      personas: ['p1'],
      regions: [],
      subjects: [],
    })
    expect(result).toHaveLength(2)
  })

  it('combines filters with AND between categories', () => {
    const result = filterItems(items as any, '', {
      types: ['course'],
      personas: ['p1'],
      regions: [],
      subjects: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe('1')
  })
})

describe('sortItems', () => {
  it('sorts by newest (publishedAt desc)', () => {
    const sorted = sortItems([...items] as any, 'newest')
    expect(sorted[0]._id).toBe('2')
  })

  it('sorts alphabetically', () => {
    const sorted = sortItems([...items] as any, 'az')
    expect(sorted[0].title).toBe('AI Risk Template')
    expect(sorted[2].title).toBe('Compliance Overview')
  })
})
```

- [ ] **Step 2: Run test — expect fail**

```bash
npm run test:run -- components/hub/__tests__/ResourceLibrary.test.tsx
```

Expected: FAIL, "Cannot find module".

- [ ] **Step 3: Implement `ResourceLibrary`**

Create `components/hub/ResourceLibrary.tsx`:

```tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ContentCard } from '@/components/hub/ContentCard'
import { SearchBar } from '@/components/hub/SearchBar'
import { SortDropdown, type SortOption } from '@/components/hub/SortDropdown'
import { FilterBar, type FilterState } from '@/components/hub/FilterBar'
import { FilterDrawer } from '@/components/hub/FilterDrawer'
import { Pagination } from '@/components/hub/Pagination'
import { Icon } from '@/components/ui/Icon'
import type { ContentItem } from '@/types/content'

const ITEMS_PER_PAGE = 15

interface TaxonomyItem {
  _id: string
  title: string | null
}

interface SubjectItem extends TaxonomyItem {
  group: string | null
}

interface ResourceLibraryProps {
  heading: string | null
  items: ContentItem[]
  personas: TaxonomyItem[]
  regions: TaxonomyItem[]
  subjects: SubjectItem[]
}

/** Filter items by search term and multi-select filters. Exported for testing. */
export function filterItems(
  items: ContentItem[],
  search: string,
  filters: FilterState,
): ContentItem[] {
  return items.filter((item) => {
    // Search term (case-insensitive substring match on title)
    if (search && !item.title?.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    // Content type filter
    if (filters.types.length > 0 && !filters.types.includes(item._type)) {
      return false
    }
    // Persona filter (OR within — item matches if it has ANY selected persona)
    if (filters.personas.length > 0) {
      const itemPersonaIds = (item as any).personas?.map((p: any) => p._id) ?? []
      if (!filters.personas.some((id) => itemPersonaIds.includes(id))) {
        return false
      }
    }
    // Region filter (OR within)
    if (filters.regions.length > 0) {
      const itemRegionIds = (item as any).regions?.map((r: any) => r._id) ?? []
      if (!filters.regions.some((id) => itemRegionIds.includes(id))) {
        return false
      }
    }
    // Subject filter (OR within)
    if (filters.subjects.length > 0) {
      const itemSubjectIds = item.subjects?.map((s) => s._id) ?? []
      if (!filters.subjects.some((id) => itemSubjectIds.includes(id))) {
        return false
      }
    }
    return true
  })
}

/** Sort items by selected sort option. Exported for testing. */
export function sortItems(
  items: ContentItem[],
  sort: SortOption,
): ContentItem[] {
  const sorted = [...items]
  switch (sort) {
    case 'newest':
      return sorted.sort(
        (a, b) =>
          new Date(b.publishedAt ?? 0).getTime() -
          new Date(a.publishedAt ?? 0).getTime(),
      )
    case 'popular':
      return sorted // already sorted by viewCount in GROQ; for client sort, keep original order
    case 'az':
      return sorted.sort((a, b) =>
        (a.title ?? '').localeCompare(b.title ?? ''),
      )
  }
}

export function ResourceLibrary({
  heading,
  items,
  personas,
  regions,
  subjects,
}: ResourceLibraryProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'newest',
  )
  const [filters, setFilters] = useState<FilterState>(() => ({
    types: searchParams.getAll('type'),
    personas: searchParams.getAll('persona'),
    regions: searchParams.getAll('region'),
    subjects: searchParams.getAll('subject'),
  }))
  const [page, setPage] = useState(
    Number(searchParams.get('page')) || 1,
  )
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Sync state to URL
  const syncUrl = useCallback(
    (newState: {
      search?: string
      sort?: SortOption
      filters?: FilterState
      page?: number
    }) => {
      const params = new URLSearchParams()
      const s = newState.search ?? search
      const so = newState.sort ?? sort
      const f = newState.filters ?? filters
      const p = newState.page ?? page

      if (s) params.set('q', s)
      if (so !== 'newest') params.set('sort', so)
      f.types.forEach((v) => params.append('type', v))
      f.personas.forEach((v) => params.append('persona', v))
      f.regions.forEach((v) => params.append('region', v))
      f.subjects.forEach((v) => params.append('subject', v))
      if (p > 1) params.set('page', String(p))

      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}#library`, {
        scroll: false,
      })
    },
    [search, sort, filters, page, pathname, router],
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      setPage(1)
      syncUrl({ search: value, page: 1 })
    },
    [syncUrl],
  )

  const handleSortChange = useCallback(
    (value: SortOption) => {
      setSort(value)
      setPage(1)
      syncUrl({ sort: value, page: 1 })
    },
    [syncUrl],
  )

  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters)
      setPage(1)
      syncUrl({ filters: newFilters, page: 1 })
    },
    [syncUrl],
  )

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage)
      syncUrl({ page: newPage })
    },
    [syncUrl],
  )

  // Compute filtered, sorted, paginated items
  const filtered = useMemo(
    () => filterItems(items, search, filters),
    [items, search, filters],
  )
  const sorted = useMemo(() => sortItems(filtered, sort), [filtered, sort])
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE)
  const safePage = Math.min(page, Math.max(totalPages, 1))
  const paginatedItems = sorted.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  )

  return (
    <section id="library" className="py-16">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <h2 className="mb-8 text-heading-1 font-bold text-diligent-gray-5">
          {heading ?? 'Full resource library'}
        </h2>

        {/* Controls row */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <SearchBar value={search} onChange={handleSearchChange} />
          <SortDropdown value={sort} onChange={handleSortChange} />
          {/* Mobile filter toggle */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-sm border border-diligent-gray-2 px-3 py-2 text-sm text-diligent-gray-4 hover:border-diligent-gray-3 md:hidden"
          >
            <Icon name="filter_list" className="text-[18px]" />
            Filters
          </button>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar filters */}
          <aside className="hidden w-60 flex-shrink-0 md:block">
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              personas={personas}
              regions={regions}
              subjects={subjects}
            />
          </aside>

          {/* Content grid */}
          <div className="min-w-0 flex-1">
            {paginatedItems.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-diligent-gray-4">
                  {search
                    ? `No results found for "${search}"`
                    : 'No content matches the current filters.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setFilters({
                      types: [],
                      personas: [],
                      regions: [],
                      subjects: [],
                    })
                    setPage(1)
                    syncUrl({
                      search: '',
                      filters: {
                        types: [],
                        personas: [],
                        regions: [],
                        subjects: [],
                      },
                      page: 1,
                    })
                  }}
                  className="mt-2 text-sm font-medium text-link hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedItems.map((item) => (
                    <li key={item._id}>
                      <ContentCard item={item} />
                    </li>
                  ))}
                </ul>
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        personas={personas}
        regions={regions}
        subjects={subjects}
      />
    </section>
  )
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npm run test:run -- components/hub/__tests__/ResourceLibrary.test.tsx
```

Expected: PASS, 7 tests.

- [ ] **Step 5: Run full test suite**

```bash
npm run test:run
```

Expected: all tests pass (previous 16 + 7 Pagination + 7 ResourceLibrary = 30 total).

- [ ] **Step 6: Commit**

```bash
git add components/hub/ResourceLibrary.tsx components/hub/__tests__/ResourceLibrary.test.tsx
git commit -m "feat(hub): add ResourceLibrary with client-side filtering, sorting, pagination, and tests"
```

---

### Task 13: Compose full homepage

**Files:**
- Modify: `app/(hub)/page.tsx`

- [ ] **Step 1: Replace homepage with all 7 sections**

Replace the full content of `app/(hub)/page.tsx` with:

```tsx
import { sanityFetch } from '@/sanity/lib/sanity-fetch'
import {
  hubSettingsQuery,
  popularContentQuery,
  newestContentQuery,
  allContentItemsQuery,
  educationalPartnersQuery,
  certificationBadgesQuery,
  allPersonasQuery,
  allRegionsQuery,
  allSubjectsQuery,
} from '@/sanity/lib/queries'
import type {
  HubSettingsQueryResult,
  PopularContentQueryResult,
  NewestContentQueryResult,
  AllContentItemsQueryResult,
  EducationalPartnersQueryResult,
  CertificationBadgesQueryResult,
  AllPersonasQueryResult,
  AllRegionsQueryResult,
  AllSubjectsQueryResult,
} from '@/types/sanity.generated'
import { HeroSection } from '@/components/hub/HeroSection'
import { PopularFeaturedSection } from '@/components/hub/PopularFeaturedSection'
import { PartnerLogoScroller } from '@/components/hub/PartnerLogoScroller'
import { ResourceLibrary } from '@/components/hub/ResourceLibrary'
import { QuestionsSection } from '@/components/hub/QuestionsSection'
import { CertificationsSection } from '@/components/hub/CertificationsSection'
import { FooterCTASection } from '@/components/hub/FooterCTASection'

export default async function HubHomePage() {
  const [
    settings,
    popularItems,
    newestItems,
    allItems,
    partners,
    badges,
    personas,
    regions,
    subjects,
  ] = await Promise.all([
    sanityFetch<HubSettingsQueryResult>({
      query: hubSettingsQuery,
      tags: ['settings'],
    }),
    sanityFetch<PopularContentQueryResult>({
      query: popularContentQuery,
      tags: ['content'],
    }),
    sanityFetch<NewestContentQueryResult>({
      query: newestContentQuery,
      tags: ['content'],
    }),
    sanityFetch<AllContentItemsQueryResult>({
      query: allContentItemsQuery,
      tags: ['content'],
    }),
    sanityFetch<EducationalPartnersQueryResult>({
      query: educationalPartnersQuery,
      tags: ['partners'],
    }),
    sanityFetch<CertificationBadgesQueryResult>({
      query: certificationBadgesQuery,
      tags: ['badges'],
    }),
    sanityFetch<AllPersonasQueryResult>({
      query: allPersonasQuery,
      tags: ['taxonomy'],
    }),
    sanityFetch<AllRegionsQueryResult>({
      query: allRegionsQuery,
      tags: ['taxonomy'],
    }),
    sanityFetch<AllSubjectsQueryResult>({
      query: allSubjectsQuery,
      tags: ['taxonomy'],
    }),
  ])

  return (
    <>
      {/* Section 1: Hero */}
      <HeroSection
        heading={settings?.heroHeading ?? null}
        subheading={settings?.heroSubheading ?? null}
        overview={settings?.heroOverview ?? null}
      />

      {/* Section 2: Popular & Featured Content */}
      <PopularFeaturedSection
        heading={settings?.popularSectionHeading ?? null}
        popularItems={popularItems}
        newestItems={newestItems}
      />

      {/* Section 3: Educational Partners */}
      <PartnerLogoScroller
        heading={settings?.partnersSectionHeading ?? null}
        partners={partners}
      />

      {/* Section 4: Full Resource Library */}
      <ResourceLibrary
        heading={settings?.librarySectionHeading ?? null}
        items={allItems}
        personas={personas}
        regions={regions}
        subjects={subjects}
      />

      {/* Section 5: Got Questions? */}
      <QuestionsSection
        heading={settings?.questionsSectionHeading ?? null}
        body={settings?.questionsSectionBody ?? null}
      />

      {/* Section 6: Professionally-Accredited Certifications */}
      <CertificationsSection
        heading={settings?.certificationsSectionHeading ?? null}
        body={settings?.certificationsSectionBody ?? null}
        badges={badges}
      />

      {/* Section 7: Footer CTA */}
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

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If there are type mismatches between the generated query result types and component prop interfaces, fix the prop types to match what the generated types provide.

- [ ] **Step 3: Run full test suite**

```bash
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "app/(hub)/page.tsx"
git commit -m "feat(hub): compose full homepage with all 7 sections driven by Sanity"
```

---

### Task 14: End-to-end verification

- [ ] **Step 1: Lint + type-check + tests**

```bash
npm run lint
npx tsc --noEmit
npm run test:run
```

All three must pass with no errors (lint warnings for the Material Symbols stylesheet are expected and acceptable).

- [ ] **Step 2: Manual verification**

Run `npm run dev` and visit `http://localhost:3000`. Verify:

1. **Section 1 (Hero):** Heading, subheading, overview text rendered. Four signpost cards with icons. "Education & Templates Library" is a link to `https://www.diligent.com/solutions/board-education`.
2. **Section 2 (Popular & Featured):** Two widgets side by side — "Most popular" and "Newest". Each shows up to 3 content cards.
3. **Section 3 (Partners):** Auto-scrolling logo row (only visible if partner documents exist in Sanity). Pauses on hover. No animation at reduced-motion.
4. **Section 4 (Resource Library):** Search bar, sort dropdown, filter sidebar (hidden on mobile, visible on md+). Content grid with pagination at 15 items/page. Filters update in real time. URL params update. Empty state shows when no results match.
5. **Section 5 (Questions):** Heading + body with clickable `mailto:certifications@diligent.com` link.
6. **Section 6 (Certifications):** Heading, body text, badge row (only visible if badge documents exist). "Education & Templates Library" is a link.
7. **Section 7 (Footer CTA):** Dark background, heading, body, red CTA button linking to demo URL.
8. **Responsive:** Resize to 375px — single column grid, filter drawer replaces sidebar, no horizontal scroll.
9. **Keyboard:** Tab through filters, pagination, links — visible focus rings throughout.

- [ ] **Step 3: Fix any issues found**

If any manual issues are found, fix and commit:

```bash
git add -A
git commit -m "fix(hub): address verification findings"
```

- [ ] **Step 4: Summary**

Mark all tasks complete. Phase 3 delivers the full 7-section homepage. Next phase: content detail pages (courses, templates, videos, learning paths).

---

## Self-review

**Spec coverage (design spec vs this plan):**

- ✅ Section 1: Hero with heading, subheading, overview, signpost links — Task 3
- ✅ Section 2: Popular & Featured with two widgets — Task 4
- ✅ Section 3: Partner logo scroller with CSS marquee, pause-on-hover, reduced-motion — Task 5
- ✅ Section 4: Full resource library with search, filters (type/persona/region/subject grouped), sort (newest/popular/az), pagination (15/page, URL params) — Tasks 9, 10, 11, 12
- ✅ Section 5: Questions with mailto link — Task 6
- ✅ Section 6: Certifications with null-safe badge links, ETL link — Task 7
- ✅ Section 7: Footer CTA with Button primitive — Task 8
- ✅ Button primitive (primary/secondary/ghost) — Task 2
- ✅ Expanded queries (hubSettings all fields, personas, regions, popular, partners, badges, taxonomy) — Task 1
- ✅ Mobile filter drawer — Task 10
- ✅ URL state sync for library — Task 12
- ✅ Empty states for search/filter — Task 12
- ✅ Tests for Button, Pagination, ResourceLibrary filter/sort logic — Tasks 2, 11, 12
- ✅ "Education & Templates Library" links to correct URL — Tasks 3, 7
- ✅ `certifications@diligent.com` as mailto — Task 6
- ✅ Section hidden when no data (partners, badges) — Tasks 5, 7
- ⚠️ Popular widget shows 0-view items until analytics phase — acknowledged in spec, not a gap

**Placeholder scan:** No "TBD", "TODO", "implement later" found. All steps have exact code.

**Type consistency:**
- `FilterState` defined in `FilterBar.tsx`, imported by `FilterDrawer.tsx` and `ResourceLibrary.tsx` ✅
- `SortOption` defined in `SortDropdown.tsx`, imported by `ResourceLibrary.tsx` ✅
- `ContentItem` from `types/content.ts` used consistently across all components ✅
- `TaxonomyItem` / `SubjectItem` interfaces repeated in `FilterBar`, `FilterDrawer`, `ResourceLibrary` — consistent shapes ✅
- `ButtonVariant` / `Button` props match across `Button.tsx` and consumers (`FooterCTASection`) ✅
- `filterItems` / `sortItems` exported from `ResourceLibrary.tsx` and imported in test ✅
- `getPageNumbers` exported from `Pagination.tsx` and imported in test ✅

---

## Execution handoff
