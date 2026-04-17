# Learning Hub: Phase 2 — Hub Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the Diligent brand design system (colors, typography, icons, layouts), wire up the typed Sanity data layer (GROQ queries, generated types, draft-mode live preview), and build the reusable `ContentCard` primitive. End state: a demo homepage renders real content items from Sanity in a Diligent-branded card grid, proving the full data + design stack end-to-end.

**Architecture:** Extend Tailwind with the full Diligent brand palette (reds 1–5, grays 1–5, data-viz blues/purples) and font tokens. Load Plus Jakarta Sans via `next/font/google`. Embed Material Symbols Sharp via a `<link>` in the root layout and wrap it in an `Icon` component. Use Sanity v3.99's built-in `sanity schema extract` + `sanity typegen generate` pipeline to produce a `types/sanity.generated.ts` file from both schemas and tagged GROQ queries. Wrap data fetching in a single `sanityFetch` helper that reads Next.js `draftMode()` and toggles between CDN vs. live API + `perspective: 'previewDrafts'`. Draft mode is enabled and disabled via API routes hit from Sanity Studio preview links. `ContentCard` is a pure presentational component taking a normalised `ContentItem` union so it can be reused by homepage widgets, library grid, and related-items widgets.

**Tech Stack:** Tailwind CSS, `next/font/google` (Plus Jakarta Sans), Google Material Symbols Sharp (via stylesheet), Next.js 14 App Router (draft mode, server components), `next-sanity@^9`, `sanity@^3.99` (typegen), `@sanity/image-url`, `clsx` + `tailwind-merge`, `vitest` + `@testing-library/react` (testing baseline)

**Scope — what's NOT in this phase:**
- Homepage sections 1–7 as designed (hero copy, partner carousel, certifications row, footer CTA) — deferred to Phase 3. Phase 2 gives a *demo* homepage that simply lists content items to prove the pipeline.
- Filtering UI, search, pagination — Phase 3
- Content detail pages (course/template/video/learningPath routes) — Phase 4
- Sanity Presentation tool (side-by-side Studio + preview) — Phase 4 (depends on detail pages existing)
- Marketo gate, SCORM, Credly, analytics — later phases
- Cookie consent, sitemap, robots.txt, redirects — later phases
- WCAG AA contrast audit of the full palette — flagged in Task 2 notes, tracked as separate work

**Testing philosophy:** Unit tests (Vitest) for pure functions and presentational components (`cn`, `Icon`, `Badge`, `ContentCard`). Manual verification steps for Tailwind theme rendering, font loading, Sanity integration, and draft mode flow — these are hard to cover in unit tests without Playwright or Storybook, both of which are out of scope for this phase. Testing infrastructure is introduced in Task 1 so future phases can build on it.

---

## Pre-check: Before you start

- [ ] **P1. Confirm current state.**

Run:
```bash
git status
git log --oneline -3
```

Expected: on `master`, clean working tree (aside from untracked `images/` assets and `.claude/settings.local.json`), top commit `feat: merge Sanity schemas, Studio configuration, and desk structure`.

- [ ] **P2. Confirm Studio still works.**

Run `npm run dev` and visit `http://localhost:3000/studio`. Sign in. Confirm desk structure still shows Hub Settings, Content (4), Taxonomy (3), Site Content (2), Administration (2). Then stop the server with Ctrl+C.

- [ ] **P3. Seed minimum content for Task 15 verification.**

In Studio, create:
- 3× **Persona** documents (e.g. "Board Director", "Company Secretary", "Risk")
- 2× **Region** documents (e.g. "Global", "UK")
- 3× **Subject** documents (e.g. "Board Governance", "ERM", "Compliance")
- 1× **Course** — fill title, slug, description, SCORM Cloud course ID (any string), thumbnail image (upload anything), at least one persona/region/subject tag, access tier "Free", published date today, archived false, restricted false
- 1× **Template** — fill title, slug, description, file asset (upload any PDF or docx), thumbnail, tags, access tier "Gated"
- 1× **Video** — fill title, slug, Vidyard URL (e.g. `https://share.vidyard.com/watch/abc123`), description, tags, access tier "Free"
- 1× **Learning Path** — fill title, slug, description, add at least one reference to one of the above, tags, access tier "Free"
- **Hub Settings** singleton — fill title, description, demo CTA URL (any URL)

This seed data isn't needed until Task 15 but it's faster to do it now while Studio is fresh in your mind.

---

## File structure

```
app/
├── layout.tsx                              # MODIFY: load Plus Jakarta Sans, add Material Symbols link, set body classes
├── globals.css                             # MODIFY: CSS custom properties, reduced-motion, focus-visible, material-symbols class
├── (hub)/
│   ├── layout.tsx                          # MODIFY: wrap children with SiteHeader + SiteFooter
│   └── page.tsx                            # MODIFY: fetch content items from Sanity and render ContentCards
├── api/
│   └── draft-mode/
│       ├── enable/
│       │   └── route.ts                    # CREATE: validate secret, enable draftMode, redirect
│       └── disable/
│           └── route.ts                    # CREATE: disable draftMode, redirect
components/
├── ui/
│   ├── Icon.tsx                            # CREATE: Material Symbols Sharp wrapper
│   ├── Badge.tsx                           # CREATE: label badge (content type, access tier)
│   └── __tests__/
│       ├── Icon.test.tsx
│       └── Badge.test.tsx
└── hub/
    ├── SiteHeader.tsx                      # CREATE: hub header shell (logo + nav placeholder)
    ├── SiteFooter.tsx                      # CREATE: hub footer shell
    ├── ContentCard.tsx                     # CREATE: reusable card (thumbnail, badges, title, desc)
    ├── FallbackThumbnail.tsx               # CREATE: SVG fallback when no thumbnail
    └── __tests__/
        └── ContentCard.test.tsx
lib/
├── cn.ts                                   # CREATE: class-name helper (clsx + tailwind-merge)
├── draft-mode.ts                           # CREATE: draft mode helpers (isPreview, preview cookie name)
└── __tests__/
    └── cn.test.ts
sanity/
├── lib/
│   ├── client.ts                           # MODIFY: add tokenless CDN client and token-authenticated draft client
│   ├── image.ts                            # (unchanged — already has urlForImage)
│   ├── queries.ts                          # CREATE: all GROQ queries using defineQuery
│   └── sanity-fetch.ts                     # CREATE: unified fetch wrapper (draft-aware, typed, cache-tagged)
types/
├── sanity.generated.ts                     # CREATE: via `npm run sanity:typegen` (generated, git-committed)
└── content.ts                              # CREATE: narrowed ContentItem union for ContentCard consumption
public/
└── images/
    └── fallback-thumbnail.svg              # CREATE: 1200x675 Diligent Red gradient placeholder
tailwind.config.ts                          # MODIFY: extend theme with Diligent palette + font family
sanity-typegen.json                         # CREATE: typegen config pointing at schema.json + query sources
schema.json                                 # CREATE: generated by `sanity schema extract` (git-committed)
vitest.config.ts                            # CREATE: Vitest + jsdom + path alias config
vitest.setup.ts                             # CREATE: jest-dom matchers
package.json                                # MODIFY: add test + sanity:extract + sanity:typegen scripts, add deps
.gitignore                                  # (leave schema.json and sanity.generated.ts committed — not ignored)
```

---

### Task 1: Set up testing infrastructure and `cn` utility

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `lib/cn.ts`, `lib/__tests__/cn.test.ts`
- Modify: `package.json`, `tsconfig.json`

- [ ] **Step 1: Install deps**

Run:
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @types/node
npm install clsx tailwind-merge
```

Expected: packages added to `package.json`.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['**/__tests__/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Add test + tsconfig path alias**

Edit `package.json` scripts:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest",
  "test:run": "vitest run"
}
```

Edit `tsconfig.json` — add `"paths"` inside `compilerOptions` (or merge if exists):
```json
"paths": {
  "@/*": ["./*"]
}
```

**Do NOT add `baseUrl`.** The project has a local folder named `sanity/` which collides with the `sanity` npm package; setting `baseUrl: "."` makes TypeScript resolve bare imports like `sanity/structure` against the local folder instead of `node_modules/sanity`, breaking the Studio config types. With `moduleResolution: "bundler"` (TS 5+) prefixed paths like `@/*` work correctly without `baseUrl`.

Create a separate **`tsconfig.test.json`** at project root so test-runner types don't leak into production TypeScript scope:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": [
    "**/__tests__/**/*.ts",
    "**/__tests__/**/*.tsx",
    "vitest.setup.ts",
    "vitest.config.ts"
  ]
}
```

Point Vitest at the test tsconfig by adding `typecheck: { tsconfig: './tsconfig.test.json' }` inside the `test` block of `vitest.config.ts`.

Do **not** add `"types"` to the root `tsconfig.json` — leaking test globals into production code was a real issue caught by the code-quality reviewer.

- [ ] **Step 5: Write failing test for `cn`**

Create `lib/__tests__/cn.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/cn'

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b')
  })

  it('merges conflicting tailwind classes, keeping the last', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('preserves non-conflicting classes', () => {
    expect(cn('px-2', 'py-4', 'text-diligent-red')).toBe('px-2 py-4 text-diligent-red')
  })
})
```

- [ ] **Step 6: Run test — expect fail**

```bash
npm run test:run -- lib/__tests__/cn.test.ts
```
Expected: FAIL with "Cannot find module '@/lib/cn'".

- [ ] **Step 7: Implement `cn`**

Create `lib/cn.ts`:
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 8: Run test — expect pass**

```bash
npm run test:run -- lib/__tests__/cn.test.ts
```
Expected: PASS, 4 tests.

- [ ] **Step 9: Commit**

```bash
git add vitest.config.ts vitest.setup.ts lib/cn.ts lib/__tests__/cn.test.ts package.json package-lock.json tsconfig.json
git commit -m "chore: add Vitest testing infrastructure and cn class-name helper"
```

---

### Task 2: Extend Tailwind theme with Diligent brand tokens

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace theme config with Diligent palette**

Overwrite `tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Diligent brand — primary (reds)
        'diligent-red': '#EE312E',
        'diligent-red-2': '#D3222A',
        'diligent-red-3': '#AF292E',
        'diligent-red-4': '#921A1D',
        'diligent-red-5': '#5F091D',
        // Diligent brand — neutrals
        'diligent-gray-1': '#F3F3F3',
        'diligent-gray-2': '#DADADA',
        'diligent-gray-3': '#A0A2A5',
        'diligent-gray-4': '#6F7377',
        'diligent-gray-5': '#282E37',
        // Diligent brand — data viz (charts only, not UI)
        'diligent-blue-1': '#00D3F3',
        'diligent-blue-2': '#0086FA',
        'diligent-blue-3': '#0B4CCE',
        'diligent-purple-1': '#C247FA',
        'diligent-purple-2': '#8B4BFA',
        'diligent-purple-3': '#642FCF',
        // Semantic
        link: '#0B4CCE', // Blue 3, per brand spec
      },
      fontFamily: {
        sans: [
          'var(--font-plus-jakarta)',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        'display-1': ['clamp(2.5rem, 4vw + 1rem, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'display-2': ['clamp(2rem, 3vw + 0.5rem, 3rem)', { lineHeight: '1.15' }],
        'heading-1': ['clamp(1.5rem, 2vw + 0.5rem, 2.25rem)', { lineHeight: '1.2' }],
        'heading-2': ['1.5rem', { lineHeight: '1.3' }],
        'heading-3': ['1.25rem', { lineHeight: '1.35' }],
      },
    },
  },
  plugins: [],
}
export default config
```

**Accessibility note (do not ignore):** `#EE312E` (Diligent Red) on white is ~3.66:1 contrast — it **passes WCAG AA for large text (≥18px bold or ≥24px regular)** but **fails for small body text**. Use `diligent-red` only for large headlines, icons, and CTA backgrounds-with-white-text where contrast passes. For small red text on white, prefer `diligent-red-3` (`#AF292E`, ~6.3:1) or darker. For white text on red backgrounds, `diligent-red` is fine at large sizes but switch to `diligent-red-3` or darker for small text. This will be audited properly in a future accessibility sweep.

- [ ] **Step 2: Sanity-check with npm run dev**

Run `npm run dev`, open `http://localhost:3000`, open DevTools, confirm no Tailwind build errors in terminal. The placeholder homepage will look the same — this task just defines tokens without using them yet.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(design): extend Tailwind theme with Diligent brand palette and typography tokens"
```

---

### Task 3: Load Plus Jakarta Sans via next/font and update root layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-plus-jakarta',
})

export const metadata: Metadata = {
  title: {
    default: 'Diligent Learning Hub',
    template: '%s | Diligent Learning Hub',
  },
  description:
    'Explore educational courses, ready-to-use templates, and videos to develop your expertise and enhance board effectiveness across key governance, risk, and compliance topics.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@48,400,0,0"
        />
      </head>
      <body className="bg-white font-sans text-diligent-gray-5 antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify font loads**

Run `npm run dev`. Open `http://localhost:3000`, DevTools → Network tab → filter for "plus-jakarta". You should see a font file loaded. Inspect `<body>` → computed styles → `font-family` should resolve to Plus Jakarta Sans.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(design): load Plus Jakarta Sans and register Material Symbols Sharp stylesheet"
```

---

### Task 4: Add Material Symbols Sharp class and global reset styles

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-bg: #ffffff;
  --color-fg: #282E37;
  --color-link: #0B4CCE;
  --color-diligent-red: #EE312E;
  --max-content-width: 72rem;
}

/* Material Symbols Sharp — settings per Diligent brand spec */
.material-symbols-sharp {
  font-family: 'Material Symbols Sharp';
  font-weight: 400;
  font-style: normal;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 48;
}

/* Hyperlinks per brand spec: Blue 3, no underline */
a {
  color: var(--color-link);
  text-decoration: none;
}

a:hover,
a:focus-visible {
  text-decoration: underline;
}

/* Visible focus for keyboard users */
:focus-visible {
  outline: 2px solid var(--color-link);
  outline-offset: 2px;
}

/* Respect prefers-reduced-motion per brand + WCAG */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Verify visually**

Run `npm run dev`, visit `http://localhost:3000`. The `Diligent Learning Hub` placeholder should now be in Plus Jakarta Sans on white background with dark grey text. Tab through the page — focus rings should be visible (though there's nothing focusable yet; you'll see the window-level focus).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(design): add brand CSS vars, Material Symbols class, a11y focus and reduced-motion"
```

---

### Task 5: Build `Icon` and `Badge` UI primitives

**Files:**
- Create: `components/ui/Icon.tsx`, `components/ui/Badge.tsx`, `components/ui/__tests__/Icon.test.tsx`, `components/ui/__tests__/Badge.test.tsx`

- [ ] **Step 1: Write failing Icon test**

Create `components/ui/__tests__/Icon.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Icon } from '@/components/ui/Icon'

describe('Icon', () => {
  it('renders the Material Symbols name as text', () => {
    render(<Icon name="menu" />)
    expect(screen.getByText('menu')).toBeInTheDocument()
  })

  it('is aria-hidden by default (decorative)', () => {
    render(<Icon name="menu" />)
    expect(screen.getByText('menu')).toHaveAttribute('aria-hidden', 'true')
  })

  it('exposes an accessible name when label is provided', () => {
    render(<Icon name="search" label="Search" />)
    const icon = screen.getByRole('img', { name: 'Search' })
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('aria-hidden', 'false')
  })

  it('applies the material-symbols-sharp class', () => {
    render(<Icon name="menu" />)
    expect(screen.getByText('menu')).toHaveClass('material-symbols-sharp')
  })
})
```

- [ ] **Step 2: Write failing Badge test**

Create `components/ui/__tests__/Badge.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge variant="course">Course</Badge>)
    expect(screen.getByText('Course')).toBeInTheDocument()
  })

  it('applies variant-specific classes', () => {
    const { rerender } = render(<Badge variant="course">Course</Badge>)
    expect(screen.getByText('Course')).toHaveClass('bg-diligent-gray-5')

    rerender(<Badge variant="premium">Premium</Badge>)
    expect(screen.getByText('Premium')).toHaveClass('bg-diligent-red-3')
  })
})
```

- [ ] **Step 3: Run tests — expect fail**

```bash
npm run test:run -- components/ui
```
Expected: FAIL on both files, "Cannot find module".

- [ ] **Step 4: Implement `Icon`**

Create `components/ui/Icon.tsx`:
```tsx
import { cn } from '@/lib/cn'

export interface IconProps {
  name: string
  className?: string
  /** If provided, icon is announced to screen readers with this label */
  label?: string
}

export function Icon({ name, className, label }: IconProps) {
  const decorative = !label
  return (
    <span
      className={cn('material-symbols-sharp select-none', className)}
      aria-hidden={decorative}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
    </span>
  )
}
```

- [ ] **Step 5: Implement `Badge`**

Create `components/ui/Badge.tsx`:
```tsx
import { cn } from '@/lib/cn'

export type BadgeVariant =
  | 'course'
  | 'template'
  | 'video'
  | 'learningPath'
  | 'free'
  | 'gated'
  | 'premium'

const variantStyles: Record<BadgeVariant, string> = {
  course: 'bg-diligent-gray-5 text-white',
  template: 'bg-diligent-gray-2 text-diligent-gray-5',
  video: 'bg-diligent-red-3 text-white',
  learningPath: 'bg-diligent-blue-3 text-white',
  free: 'bg-diligent-gray-1 text-diligent-gray-5 ring-1 ring-diligent-gray-2',
  gated: 'bg-diligent-gray-5 text-white',
  premium: 'bg-diligent-red-3 text-white',
}

export interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 6: Run tests — expect pass**

```bash
npm run test:run -- components/ui
```
Expected: PASS, 6 tests total.

- [ ] **Step 7: Commit**

```bash
git add components/ui
git commit -m "feat(ui): add Icon (Material Symbols Sharp wrapper) and Badge primitives"
```

---

### Task 6: Build `SiteHeader` and `SiteFooter` shells

**Files:**
- Create: `components/hub/SiteHeader.tsx`, `components/hub/SiteFooter.tsx`

These are structural shells only — no final design. Header has the Diligent wordmark placeholder and a placeholder nav. Footer has a copyright line and a single CTA. Real design and navigation items are Phase 3 work.

- [ ] **Step 1: Create `SiteHeader.tsx`**

```tsx
import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="border-b border-diligent-gray-2 bg-white">
      <div className="mx-auto flex max-w-[var(--max-content-width)] items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-bold text-diligent-gray-5 no-underline hover:no-underline"
        >
          Diligent Learning Hub
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex gap-6 text-sm font-medium text-diligent-gray-4">
            <li>
              <Link href="/" className="text-diligent-gray-4 hover:text-diligent-gray-5">
                Home
              </Link>
            </li>
            <li>
              <a
                href="https://www.diligent.com"
                className="text-diligent-gray-4 hover:text-diligent-gray-5"
              >
                diligent.com
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create `SiteFooter.tsx`**

```tsx
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-diligent-gray-2 bg-diligent-gray-1">
      <div className="mx-auto flex max-w-[var(--max-content-width)] flex-col items-start justify-between gap-4 px-6 py-8 md:flex-row md:items-center">
        <p className="text-sm text-diligent-gray-4">
          &copy; {new Date().getFullYear()} Diligent Corporation. All rights reserved.
        </p>
        <a
          href="mailto:certifications@diligent.com"
          className="text-sm font-medium"
        >
          certifications@diligent.com
        </a>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/hub/SiteHeader.tsx components/hub/SiteFooter.tsx
git commit -m "feat(hub): add SiteHeader and SiteFooter shells"
```

---

### Task 7: Update hub layout to wrap children with header + footer

**Files:**
- Modify: `app/(hub)/layout.tsx`

- [ ] **Step 1: Replace the layout**

```tsx
import { SiteHeader } from '@/components/hub/SiteHeader'
import { SiteFooter } from '@/components/hub/SiteFooter'

export default function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run `npm run dev`, visit `http://localhost:3000`. You should now see:
- Header with "Diligent Learning Hub" on the left, nav on the right (md+ viewport)
- The placeholder `<main>` content in the middle
- Footer with copyright and email address at the bottom

Resize below 768px — nav should hide, header should remain readable.

- [ ] **Step 3: Commit**

```bash
git add app/\(hub\)/layout.tsx
git commit -m "feat(hub): wrap hub routes with SiteHeader and SiteFooter"
```

> Note: on Windows/bash the parentheses in `(hub)` may need escaping. If the `git add` above fails, use: `git add 'app/(hub)/layout.tsx'`.

---

### Task 8: Create `FallbackThumbnail` SVG and helper component

**Files:**
- Create: `public/images/fallback-thumbnail.svg`, `components/hub/FallbackThumbnail.tsx`

- [ ] **Step 1: Create the SVG asset**

Create `public/images/fallback-thumbnail.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-label="Diligent Learning Hub">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#EE312E"/>
      <stop offset="1" stop-color="#5F091D"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#g)"/>
  <text x="600" y="355" font-family="ui-sans-serif, system-ui, sans-serif" font-size="72" font-weight="700" fill="#ffffff" text-anchor="middle">Diligent</text>
  <text x="600" y="430" font-family="ui-sans-serif, system-ui, sans-serif" font-size="32" font-weight="400" fill="#ffffff" text-anchor="middle" opacity="0.85">Learning Hub</text>
</svg>
```

- [ ] **Step 2: Create the React helper**

Create `components/hub/FallbackThumbnail.tsx`:
```tsx
import Image from 'next/image'
import { cn } from '@/lib/cn'

export interface FallbackThumbnailProps {
  className?: string
  alt?: string
}

export function FallbackThumbnail({
  className,
  alt = 'Diligent Learning Hub',
}: FallbackThumbnailProps) {
  return (
    <Image
      src="/images/fallback-thumbnail.svg"
      alt={alt}
      width={1200}
      height={675}
      className={cn('h-full w-full object-cover', className)}
    />
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add public/images/fallback-thumbnail.svg components/hub/FallbackThumbnail.tsx
git commit -m "feat(hub): add fallback thumbnail SVG and component"
```

---

### Task 9: Generate Sanity TypeScript types via `sanity typegen`

**Files:**
- Create: `sanity-typegen.json`
- Modify: `package.json`
- Generated: `schema.json`, `types/sanity.generated.ts` (committed to git)

- [ ] **Step 1: Create `sanity-typegen.json`**

```json
{
  "path": ["./sanity/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  "schema": "./schema.json",
  "generates": "./types/sanity.generated.ts",
  "overloadClientMethods": true
}
```

- [ ] **Step 2: Add scripts to `package.json`**

Merge into the `"scripts"` object:
```json
"sanity:extract": "sanity schema extract --path=./schema.json",
"sanity:typegen": "sanity typegen generate",
"sanity:types": "npm run sanity:extract && npm run sanity:typegen"
```

- [ ] **Step 3: Run schema extract**

```bash
npm run sanity:extract
```

Expected: creates `schema.json` at project root (will be ~few hundred KB).

Note: this requires the Sanity CLI to authenticate against your project. If it prompts, it'll use the login from earlier.

- [ ] **Step 4: Run typegen (first pass — schema only, no queries yet)**

```bash
npm run sanity:typegen
```

Expected: creates `types/sanity.generated.ts` containing `SanitySchema` types for every document type (`Course`, `Template`, `Video`, `LearningPath`, `HubSettings`, etc.) plus `AllSanitySchemaTypes` union. No query types yet — those come in Task 10.

- [ ] **Step 5: Verify type file is usable**

Open `types/sanity.generated.ts` and spot-check — you should see exported types like `Course`, `Template`, `Video`, `LearningPath`, `HubSettings`, `Persona`, `Region`, `Subject`, `EducationalPartner`, `CertificationBadge`, `Redirect`, `Feedback`.

- [ ] **Step 6: Commit (including generated files)**

```bash
git add sanity-typegen.json package.json package-lock.json schema.json types/sanity.generated.ts
git commit -m "feat(sanity): add schema extract + typegen pipeline and generated types"
```

> Both `schema.json` and `types/sanity.generated.ts` are committed deliberately — they're reproducible from Sanity schemas, but committing them means type-checks pass in CI and downstream contributors don't need Sanity auth to run `npm run build`.

---

### Task 10: Define GROQ queries and narrowed `ContentItem` types

**Files:**
- Create: `sanity/lib/queries.ts`, `types/content.ts`
- Regenerate: `types/sanity.generated.ts` (after queries are defined)

- [ ] **Step 1: Create `sanity/lib/queries.ts`**

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
  publishedAt,
  archived
`

/** All published, non-archived content items across all 4 content types. */
export const allContentItemsQuery = defineQuery(`
  *[
    _type in ["course", "template", "video", "learningPath"]
    && !(_id in path("drafts.**"))
    && archived != true
    && (_type != "course" || restricted != true)
  ] | order(publishedAt desc) {
    ${cardProjection}
  }
`)

/** The Hub Settings singleton. */
export const hubSettingsQuery = defineQuery(`
  *[_type == "hubSettings"][0]{
    heroHeading,
    heroSubheading,
    heroOverview,
    demoCtaUrl
  }
`)

/** Newest 3 — used by homepage Widget 2 in Phase 3. */
export const newestContentQuery = defineQuery(`
  *[
    _type in ["course", "template", "video", "learningPath"]
    && !(_id in path("drafts.**"))
    && archived != true
    && (_type != "course" || restricted != true)
  ] | order(publishedAt desc)[0...3] {
    ${cardProjection}
  }
`)

/** Single course by slug — for Phase 4 course detail page. */
export const courseBySlugQuery = defineQuery(`
  *[_type == "course" && slug.current == $slug && archived != true][0] {
    ${cardProjection},
    scormCloudCourseId,
    estimatedDuration,
    author,
    restricted,
    restrictedNote
  }
`)

/** Single template by slug — for Phase 4 template detail page. */
export const templateBySlugQuery = defineQuery(`
  *[_type == "template" && slug.current == $slug && archived != true][0] {
    ${cardProjection},
    fileAsset
  }
`)

/** Single video by slug — for Phase 4 video detail page. */
export const videoBySlugQuery = defineQuery(`
  *[_type == "video" && slug.current == $slug && archived != true][0] {
    ${cardProjection},
    vidyardUrl,
    duration
  }
`)

/** Single learning path by slug — for Phase 4 learning path page. */
export const learningPathBySlugQuery = defineQuery(`
  *[_type == "learningPath" && slug.current == $slug && archived != true][0] {
    ${cardProjection},
    estimatedCompletionTime,
    credlyBadgeId,
    items[]{
      _key,
      "item": @.item->{ ${cardProjection} }
    }
  }
`)
```

> Note: the exact field names above (`heroHeading`, `scormCloudCourseId`, `vidyardUrl`, `credlyBadgeId`, etc.) assume the schema uses these identifiers. If the actual schemas use different names, the engineer should grep `sanity/schemas/` and update the projections to match. **Do not invent fields** — projections must match what's in the schema.

- [ ] **Step 2: Verify field names against actual schemas**

For each projected field in Step 1, grep the schema files and confirm the name matches:
```bash
grep -n "name:" sanity/schemas/documents/course.ts
grep -n "name:" sanity/schemas/documents/template.ts
grep -n "name:" sanity/schemas/documents/video.ts
grep -n "name:" sanity/schemas/documents/learningPath.ts
grep -n "name:" sanity/schemas/documents/hubSettings.ts
```

If any projected field doesn't exist in the schema, either (a) update the projection to use the correct name, or (b) remove the field from the projection. **Do not proceed** until every projected field is confirmed.

- [ ] **Step 3: Regenerate types with queries included**

```bash
npm run sanity:types
```

Expected: `types/sanity.generated.ts` now contains query result types like `AllContentItemsQueryResult`, `HubSettingsQueryResult`, etc., based on the GROQ projections.

- [ ] **Step 4: Create narrowed `ContentItem` type**

Create `types/content.ts`:
```ts
import type { AllContentItemsQueryResult } from './sanity.generated'

/**
 * Single content item as returned by the list queries.
 * Use this shape for ContentCard and any list rendering.
 */
export type ContentItem = AllContentItemsQueryResult[number]

export type ContentType = ContentItem['_type']

export const contentTypeLabels: Record<ContentType, string> = {
  course: 'Course',
  template: 'Template',
  video: 'Video',
  learningPath: 'Learning Path',
}

export type AccessTier = 'free' | 'gated' | 'premium'

export const accessTierLabels: Record<AccessTier, string> = {
  free: 'Free',
  gated: 'Gated',
  premium: 'Premium',
}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If errors surface about query result shapes, go back to Step 2 and reconcile with the actual schema.

- [ ] **Step 6: Commit**

```bash
git add sanity/lib/queries.ts types/content.ts types/sanity.generated.ts
git commit -m "feat(sanity): add typed GROQ queries and narrowed ContentItem types"
```

---

### Task 11: Build the `sanityFetch` wrapper with draft-mode support

**Files:**
- Modify: `sanity/lib/client.ts`
- Create: `sanity/lib/sanity-fetch.ts`, `lib/draft-mode.ts`
- Modify: `.env.local.example`

- [ ] **Step 1: Extend `.env.local.example`**

Append to `.env.local.example`:
```
# Sanity — additional for server-side draft reads and webhook secret
SANITY_VIEWER_TOKEN=
SANITY_PREVIEW_SECRET=
```

And add the same two vars to your local `.env.local` (leave `SANITY_VIEWER_TOKEN` blank for now — will be created in a later sub-step; set `SANITY_PREVIEW_SECRET` to any random string, e.g. `openssl rand -hex 32`).

- [ ] **Step 2: Create a Sanity viewer token**

In your terminal:
```bash
! npx sanity@3 tokens create "next-hub-viewer" --role=viewer
```

Copy the returned token and paste it into `.env.local` as `SANITY_VIEWER_TOKEN=<token>`. This is a read-only token used server-side for draft reads only.

- [ ] **Step 3: Replace `sanity/lib/client.ts`**

```ts
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

/** Public CDN client — anonymous, fast, used for published content. */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
  stega: { studioUrl: '/studio' },
})

/** Server-only client with viewer token — used for draft/preview reads. */
export const draftClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'previewDrafts',
  token: process.env.SANITY_VIEWER_TOKEN,
  stega: { studioUrl: '/studio' },
})
```

- [ ] **Step 4: Create `lib/draft-mode.ts`**

```ts
import 'server-only'
import { draftMode } from 'next/headers'

export const PREVIEW_COOKIE = '__prerender_bypass'

export async function isDraftMode(): Promise<boolean> {
  const { isEnabled } = draftMode()
  return isEnabled
}
```

- [ ] **Step 5: Create `sanity/lib/sanity-fetch.ts`**

```ts
import 'server-only'
import type { QueryParams } from 'next-sanity'
import { client, draftClient } from './client'
import { isDraftMode } from '@/lib/draft-mode'

interface SanityFetchOptions<QueryResponse> {
  query: string
  params?: QueryParams
  /** Cache tags for Next.js ISR invalidation via /api/revalidate */
  tags?: string[]
  /** Cast the return type; set when using defineQuery-typed queries */
  _type?: QueryResponse
}

export async function sanityFetch<QueryResponse>({
  query,
  params = {},
  tags = [],
}: SanityFetchOptions<QueryResponse>): Promise<QueryResponse> {
  const isDraft = await isDraftMode()
  const activeClient = isDraft ? draftClient : client
  return activeClient.fetch<QueryResponse>(query, params, {
    // Draft mode bypasses all caching; published fetches use tag-based revalidation
    cache: isDraft ? 'no-store' : 'force-cache',
    next: isDraft ? undefined : { tags },
  })
}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add sanity/lib/client.ts sanity/lib/sanity-fetch.ts lib/draft-mode.ts .env.local.example
git commit -m "feat(sanity): add draft-aware sanityFetch wrapper and viewer token support"
```

---

### Task 12: Build the `ContentCard` component

**Files:**
- Create: `components/hub/ContentCard.tsx`, `components/hub/__tests__/ContentCard.test.tsx`

- [ ] **Step 1: Write failing test**

Create `components/hub/__tests__/ContentCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ContentCard } from '@/components/hub/ContentCard'
import type { ContentItem } from '@/types/content'

const baseItem: ContentItem = {
  _id: 'c1',
  _type: 'course',
  title: 'ESG Fundamentals',
  slug: 'esg-fundamentals',
  description: 'A short course on ESG basics.',
  thumbnail: null,
  accessTier: 'free',
  subjects: [],
  publishedAt: '2026-04-01T00:00:00Z',
  archived: false,
} as unknown as ContentItem

describe('ContentCard', () => {
  it('renders title and description', () => {
    render(<ContentCard item={baseItem} />)
    expect(screen.getByText('ESG Fundamentals')).toBeInTheDocument()
    expect(screen.getByText(/ESG basics/i)).toBeInTheDocument()
  })

  it('renders a content-type badge', () => {
    render(<ContentCard item={baseItem} />)
    expect(screen.getByText('Course')).toBeInTheDocument()
  })

  it('renders an access-tier badge', () => {
    render(<ContentCard item={baseItem} />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('links to the correct detail page by _type and slug', () => {
    render(<ContentCard item={baseItem} />)
    const link = screen.getByRole('link', { name: /ESG Fundamentals/i })
    expect(link).toHaveAttribute('href', '/courses/esg-fundamentals')
  })

  it('uses /learning-paths/ for learning-path items', () => {
    render(<ContentCard item={{ ...baseItem, _type: 'learningPath' } as ContentItem} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/learning-paths/esg-fundamentals')
  })

  it('renders fallback thumbnail when none provided', () => {
    render(<ContentCard item={baseItem} />)
    expect(screen.getByAltText(/Diligent Learning Hub/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect fail**

```bash
npm run test:run -- components/hub
```
Expected: FAIL, "Cannot find module".

- [ ] **Step 3: Implement `ContentCard`**

Create `components/hub/ContentCard.tsx`:
```tsx
import Link from 'next/link'
import Image from 'next/image'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { FallbackThumbnail } from '@/components/hub/FallbackThumbnail'
import { urlForImage } from '@/sanity/lib/image'
import {
  type ContentItem,
  type ContentType,
  contentTypeLabels,
  accessTierLabels,
} from '@/types/content'
import { cn } from '@/lib/cn'

const routePrefix: Record<ContentType, string> = {
  course: '/courses',
  template: '/templates',
  video: '/videos',
  learningPath: '/learning-paths',
}

function badgeVariantForType(t: ContentType): BadgeVariant {
  return t
}

function badgeVariantForTier(
  tier: ContentItem['accessTier'],
): BadgeVariant {
  if (tier === 'gated') return 'gated'
  if (tier === 'premium') return 'premium'
  return 'free'
}

export interface ContentCardProps {
  item: ContentItem
  className?: string
}

export function ContentCard({ item, className }: ContentCardProps) {
  const href = `${routePrefix[item._type]}/${item.slug ?? ''}`
  const thumbUrl = item.thumbnail
    ? urlForImage(item.thumbnail).width(1200).height(675).url()
    : null

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-md border border-diligent-gray-2 bg-white transition hover:border-diligent-gray-3',
        className,
      )}
    >
      <Link href={href} className="block no-underline hover:no-underline">
        <div className="relative aspect-[16/9] w-full bg-diligent-gray-1">
          {thumbUrl ? (
            <Image
              src={thumbUrl}
              alt={item.thumbnail?.alt ?? item.title ?? ''}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <FallbackThumbnail alt={item.title ?? 'Diligent Learning Hub'} />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <Badge variant={badgeVariantForType(item._type)}>
              {contentTypeLabels[item._type]}
            </Badge>
            {item.accessTier && (
              <Badge variant={badgeVariantForTier(item.accessTier)}>
                {accessTierLabels[item.accessTier as keyof typeof accessTierLabels]}
              </Badge>
            )}
          </div>
          <h3 className="text-heading-3 font-semibold text-diligent-gray-5">
            {item.title}
          </h3>
          {item.description && (
            <p className="line-clamp-3 text-sm text-diligent-gray-4">
              {item.description}
            </p>
          )}
        </div>
      </Link>
    </article>
  )
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npm run test:run -- components/hub
```
Expected: PASS, 6 tests.

> Note: Next.js `Image` needs a special mock in jsdom. If tests fail with "Image requires src", add this to `vitest.setup.ts`:
>
> ```ts
> import '@testing-library/jest-dom/vitest'
> import { vi } from 'vitest'
>
> vi.mock('next/image', () => ({
>   default: (props: any) => {
>     // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
>     return <img {...props} />
>   },
> }))
> ```
>
> (then re-run the test — expect PASS)

- [ ] **Step 5: Commit**

```bash
git add components/hub/ContentCard.tsx components/hub/__tests__/ContentCard.test.tsx vitest.setup.ts
git commit -m "feat(hub): add ContentCard component with tests"
```

---

### Task 13: Wire up draft-mode enable/disable API routes

**Files:**
- Create: `app/api/draft-mode/enable/route.ts`, `app/api/draft-mode/disable/route.ts`

- [ ] **Step 1: Create enable route**

```ts
// app/api/draft-mode/enable/route.ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Called from Sanity Studio preview URLs, e.g.
 *   /api/draft-mode/enable?secret=<SANITY_PREVIEW_SECRET>&slug=/courses/my-course
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  const slug = url.searchParams.get('slug') ?? '/'

  if (!process.env.SANITY_PREVIEW_SECRET) {
    return new Response('Preview secret not configured', { status: 500 })
  }
  if (secret !== process.env.SANITY_PREVIEW_SECRET) {
    return new Response('Invalid secret', { status: 401 })
  }
  // Only allow relative paths — prevents open-redirect.
  if (!slug.startsWith('/') || slug.startsWith('//')) {
    return new Response('Invalid slug', { status: 400 })
  }

  draftMode().enable()
  redirect(slug)
}
```

- [ ] **Step 2: Create disable route**

```ts
// app/api/draft-mode/disable/route.ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  draftMode().disable()
  const url = new URL(request.url)
  const returnTo = url.searchParams.get('return-to') ?? '/'
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    redirect('/')
  }
  redirect(returnTo)
}
```

- [ ] **Step 3: Manual verification**

Run `npm run dev`. In a private/incognito browser window:
1. Visit `http://localhost:3000/api/draft-mode/enable?secret=<your-SANITY_PREVIEW_SECRET>&slug=/`
2. You should land on `/` and a cookie named `__prerender_bypass` should be set (DevTools → Application → Cookies)
3. Visit `http://localhost:3000/api/draft-mode/disable`
4. Cookie should be cleared

If the secret is wrong: expect 401. If the slug is an absolute URL (e.g. `https://evil.com`): expect 400.

- [ ] **Step 4: Commit**

```bash
git add app/api/draft-mode
git commit -m "feat(preview): add draft mode enable/disable API routes with secret + redirect validation"
```

---

### Task 14: Replace placeholder homepage with a Sanity-driven demo

**Files:**
- Modify: `app/(hub)/page.tsx`

- [ ] **Step 1: Replace homepage**

```tsx
import { sanityFetch } from '@/sanity/lib/sanity-fetch'
import { allContentItemsQuery } from '@/sanity/lib/queries'
import type { AllContentItemsQueryResult } from '@/types/sanity.generated'
import { ContentCard } from '@/components/hub/ContentCard'

export default async function HubHomePage() {
  const items = await sanityFetch<AllContentItemsQueryResult>({
    query: allContentItemsQuery,
    tags: ['content'],
  })

  return (
    <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-12">
      <header className="mb-10">
        <h1 className="text-display-1 font-bold text-diligent-gray-5">
          Diligent Learning Hub
        </h1>
        <p className="mt-4 max-w-2xl text-diligent-gray-4">
          Phase 2 demo — this page will be replaced with the full homepage in
          Phase 3. For now, it lists all published content items to verify the
          data + design pipeline.
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-diligent-gray-4">
          No content published yet. Open{' '}
          <a href="/studio" className="font-medium">
            Studio
          </a>{' '}
          and publish at least one item.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item._id}>
              <ContentCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
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
git add app/\(hub\)/page.tsx
git commit -m "feat(hub): replace placeholder homepage with Sanity-driven content grid demo"
```

---

### Task 15: End-to-end verification

- [ ] **Step 1: Run the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Homepage shows seed content**

Visit `http://localhost:3000`. You should see:
- Header: "Diligent Learning Hub" (Plus Jakarta Sans, bold, dark grey)
- Below: the "Phase 2 demo" paragraph
- Below: a responsive grid of ContentCards (1 column on mobile, 2 on sm, 3 on lg)
- Each card shows: thumbnail (image if uploaded, SVG fallback otherwise), content type badge, access tier badge, title, description
- Footer: copyright + certifications@diligent.com mailto link

If you don't see your seed content:
- Check Studio — is the document published (not just saved as draft)?
- Check browser console for Sanity errors
- Check terminal for server errors

- [ ] **Step 3: Draft mode round-trip**

1. In Studio, edit one of your content items. Change the title from (e.g.) "ESG Fundamentals" to "ESG Fundamentals (DRAFT)". **Do not publish** — just save.
2. In the same browser, visit `http://localhost:3000/api/draft-mode/enable?secret=<SANITY_PREVIEW_SECRET>&slug=/`
3. On the resulting homepage, the card for that item should show the DRAFT title.
4. Visit `http://localhost:3000/api/draft-mode/disable`.
5. Return to `/` — the published title should be back.

- [ ] **Step 4: Material Symbols render**

Temporarily add `<Icon name="menu" />` somewhere in `SiteHeader` (e.g. next to the logo). Save. You should see a small menu icon rendered. Revert the change before committing (optional — leave it if you like).

- [ ] **Step 5: Responsive behaviour**

Resize the viewport to 375px. Grid should collapse to 1 column. Header nav should hide. Footer should stack. No horizontal scroll.

- [ ] **Step 6: Lint + type-check + tests all green**

```bash
npm run lint
npx tsc --noEmit
npm run test:run
```

All three should exit with no errors. If anything fails, fix before closing out the phase.

- [ ] **Step 7: Final verification commit (empty or summary)**

If any last-mile tweaks were made during verification, commit them:
```bash
git add -A
git status
git commit -m "chore(phase-2): verification pass — lint + type-check + tests green"
```

- [ ] **Step 8: Update task tracker and wrap**

- Mark this plan complete (check all boxes).
- Summarise for the user what was built and what's next (Phase 3 = homepage sections 1–7).

---

## Self-review

**Spec coverage (CLAUDE.md vs this plan):**

- ✅ Tech stack (Next.js 14 + Sanity v3 + Tailwind + TS) — Tasks 1–4, 9–12
- ✅ Design: Plus Jakarta Sans — Task 3
- ✅ Design: Diligent colour palette (reds, neutrals, data viz) — Task 2
- ✅ Design: Material Symbols Sharp — Tasks 3, 4, 5
- ✅ Design: Blue 3 (`#0B4CCE`) hyperlinks — Task 4 globals.css
- ✅ Design: Sentence-case CTA, medium weight — documented in Badge task, real CTAs come Phase 3
- ✅ Accessibility: focus-visible, reduced-motion, alt text on fallback — Task 4, 8
- ✅ Accessibility: WCAG AA red contrast note — Task 2
- ✅ Image handling: Next.js `<Image>`, urlForImage, alt text, fallback — Tasks 8, 12
- ✅ Sanity live preview (draft mode) — Tasks 11, 13
- ✅ Browser tab title template — Task 3 metadata
- ⚠️  Sanity Presentation tool (optional live side-by-side) — **deferred to Phase 4** (stated upfront in scope)
- ⚠️  Homepage sections 1–7 — **deferred to Phase 3** (stated upfront in scope)
- ⚠️  Full content library, filtering, pagination — **deferred to Phase 3**
- ⚠️  Detail pages, gating, SCORM, Credly, Marketo, analytics — **deferred to later phases**

**Placeholder scan:** no "TBD", no "fill in", every step has either exact code or exact commands. One flagged contingency (Step 2 of Task 10: "verify field names against actual schemas, do not proceed until confirmed") — this is intentional and actionable, not a placeholder.

**Type consistency check:**
- `ContentItem` type derived from `AllContentItemsQueryResult[number]` in `types/content.ts` — used by `ContentCard` in Task 12. ✅
- `BadgeVariant` enumerated in Task 5, reused by `ContentCard` in Task 12. ✅
- `sanityFetch<T>` generic in Task 11, invoked with `AllContentItemsQueryResult` in Task 14. ✅
- `SANITY_PREVIEW_SECRET` named consistently in `.env.local.example`, enable route, disable route. ✅
- `SANITY_VIEWER_TOKEN` named consistently in `.env.local.example` and `draftClient`. ✅

**One known risk:** Task 10 projects fields (`heroHeading`, `scormCloudCourseId`, etc.) that may not match the exact field names in the committed schemas. Step 2 of Task 10 explicitly addresses this by requiring verification before continuing.

---

## Execution handoff

Once this plan is approved, two execution options are available:

1. **Subagent-Driven (recommended for a plan of this length)** — one fresh subagent per task, main agent reviews each task's output between dispatches. Slower but much higher quality (fresh context per task, no drift).
2. **Inline execution** — execute tasks in a single session using `superpowers:executing-plans`, with checkpoints for review after every 3–4 tasks.

User to pick one after approval.
