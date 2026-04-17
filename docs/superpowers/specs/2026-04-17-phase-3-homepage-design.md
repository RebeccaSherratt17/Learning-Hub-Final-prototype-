# Phase 3: Full Homepage — Design Spec

**Date:** 2026-04-17
**Status:** Approved
**Depends on:** Phase 2 (Hub Foundations) — merged to master

---

## Goal

Replace the Phase 2 demo homepage with the full 7-section Diligent Learning Hub homepage as specified in CLAUDE.md. All copy is Sanity-driven via the Hub Settings singleton. The page is server-rendered with one client-side island (the resource library) for interactive filtering, search, sorting, and pagination.

---

## Architecture

The homepage (`app/(hub)/page.tsx`) is an async server component that fetches all required data from Sanity in parallel using `Promise.all`, then passes data as props to 7 section components. Only the resource library (Section 4) is a client component — everything else is server-rendered.

### Data flow

```
page.tsx (server)
  ├─ sanityFetch(hubSettingsQuery)          → settings for all section headings/body
  ├─ sanityFetch(popularContentQuery)       → top 3 by viewCount
  ├─ sanityFetch(newestContentQuery)        → newest 3 (already exists)
  ├─ sanityFetch(allContentItemsQuery)      → full library (expanded projection)
  ├─ sanityFetch(educationalPartnersQuery)  → partner logos
  ├─ sanityFetch(certificationBadgesQuery)  → certification badges
  ├─ sanityFetch(allPersonasQuery)          → filter options
  ├─ sanityFetch(allRegionsQuery)           → filter options
  └─ sanityFetch(allSubjectsQuery)          → filter options (grouped)
```

All fetches use `tags: ['content']` or `tags: ['settings']` for ISR revalidation.

---

## Sections

### Section 1: Hero

- **Component:** `HeroSection`
- **Data:** `heroHeading`, `heroSubheading`, `heroOverview` from Hub Settings
- **Sub-component:** `ContentTypeSignpost` — four items (Courses, Templates, Videos, Learning Paths), each with an icon, label, and description per CLAUDE.md spec. Links to the resource library section with the corresponding content type filter pre-applied (anchor link `#library` + URL param, e.g. `#library?type=course`).
- **"Education & Templates Library" text** in overview links to `https://www.diligent.com/solutions/board-education`
- **Layout:** Full-width section, max-content-width inner container. Heading uses `text-display-1`, subheading uses body text size, signposts in a 2x2 grid on mobile / 4-column row on `md+`.

### Section 2: Popular & Featured Content

- **Component:** `PopularFeaturedSection`
- **Data:** `popularSectionHeading` from Hub Settings, popular items array, newest items array
- **Sub-component:** `ContentWidget` — titled widget containing 3 `ContentCard` items in a vertical stack
- **Widget 1 (Most popular):** Top 3 items by `viewCount desc`. Will show items with 0 views until the analytics phase wires up view count increments — this is acknowledged and accepted.
- **Widget 2 (Newest):** Top 3 items by `publishedAt desc` (query already exists).
- **Layout:** Two widgets side by side on `md+`, stacked on mobile.

### Section 3: Educational Partners

- **Component:** `PartnerLogoScroller` (client component)
- **Data:** `partnersSectionHeading` from Hub Settings, partner logos array
- **Behaviour:** Continuously auto-scrolling horizontal row of logos. Logo set duplicated in DOM for seamless loop. Pauses on hover. Respects `prefers-reduced-motion` (static row, no animation). Uses CSS `@keyframes` animation, not JS intervals.
- **Sanity:** Logos from `educationalPartner` documents, ordered by `order` field. Each has optional `url` — if present, logo is wrapped in a link.
- **Empty state:** Section hidden if no partners exist.

### Section 4: Full Resource Library

- **Component:** `ResourceLibrary` (client component, receives all data as props from server)
- **Data:** `librarySectionHeading` from Hub Settings, all content items (expanded projection with personas + regions), all taxonomy documents for filter options
- **Sub-components:**
  - `SearchBar` — keyword search on title, debounced (300ms)
  - `FilterBar` — multi-select filters for content type, persona, region, subject (grouped by `group` field). Visible inline on `md+`. On mobile, collapsed behind a "Filters" button that opens a `FilterDrawer` (slide-in panel).
  - `SortDropdown` — three options: Newest (default), Most popular, A-Z. Resets to Newest on fresh visit.
  - `Pagination` — 15 items per page, 3-column grid (`lg`), 2-column (`sm`), 1-column (mobile). Numbered page links. Current page reflected in URL (`?page=2`). Resets to page 1 when filters/sort change.
- **Filtering logic:** All client-side in-memory. Content items filtered by: search term (case-insensitive substring match on title), content type, personas (item matches if it has ANY of the selected personas), regions (same), subjects (same). All filters are AND between categories, OR within a category.
- **URL state:** Search, filters, sort, and page are synced to URL search params using `useSearchParams` + `useRouter`. This enables bookmarking, sharing, and browser back/forward.
- **Empty state:** "No results found for '[term]'" with suggestion to clear filters.
- **Anchor:** Section has `id="library"` so signpost links from the hero can scroll to it.

### Section 5: Got Questions?

- **Component:** `QuestionsSection`
- **Data:** `questionsSectionHeading`, `questionsSectionBody` from Hub Settings
- **The email `certifications@diligent.com`** rendered as a `mailto:` link.
- **Layout:** Simple centered text section with generous whitespace.

### Section 6: Professionally-Accredited Certifications

- **Component:** `CertificationsSection`
- **Data:** `certificationsSectionHeading`, `certificationsSectionBody` from Hub Settings, certification badges array
- **Sub-component:** `CertificationBadge` — image + link. If `url` is null/empty (e.g. Board Leadership TBC), render badge image without a link.
- **"Education & Templates Library" text** in body links to `https://www.diligent.com/solutions/board-education`
- **Layout:** Heading, body text, then 6 badges in a horizontal row on `lg`, wrapping to 3x2 on `sm`, 2x3 on mobile.

### Section 7: Footer CTA

- **Component:** `FooterCTASection`
- **Data:** `footerHeading`, `footerBody`, `footerCTAText`, `demoCTAUrl` from Hub Settings
- **CTA button:** Diligent Red background, white text, sentence case, medium weight. Uses the shared `Button` component.
- **Layout:** Centered section with dark background (`diligent-gray-5`), white text, generous padding. Sits above the `SiteFooter`.

---

## Query Changes

| Query | Change |
|-------|--------|
| `hubSettingsQuery` | Expand to fetch all 18 fields |
| `cardProjection` | Add `"personas": personas[]->{ _id, title }` and `"regions": regions[]->{ _id, title }` |
| `popularContentQuery` | New — top 3 by `viewCount desc`, same filters as `allContentItemsQuery` |
| `educationalPartnersQuery` | New — all `educationalPartner` docs ordered by `order asc` |
| `certificationBadgesQuery` | New — all `certificationBadge` docs ordered by `order asc` |
| `allPersonasQuery` | New — all `persona` docs ordered by `title asc` |
| `allRegionsQuery` | New — all `region` docs ordered by `title asc` |
| `allSubjectsQuery` | New — all `subject` docs ordered by `group asc, title asc` |

After query changes, regenerate types via `npm run sanity:types`.

---

## New Shared UI Primitive

### `Button`

A reusable button/link component with variants:
- **`primary`**: Diligent Red background, white text (for CTAs)
- **`secondary`**: White background, Diligent Red border + text
- **`ghost`**: Transparent background, current text colour

Renders as `<button>` by default, or `<a>` / Next.js `<Link>` when `href` is provided. Sentence case text, medium font weight per brand spec.

---

## Component File Structure

```
components/
├── ui/
│   ├── Button.tsx                    # New — shared CTA button
│   ├── Badge.tsx                     # Existing
│   ├── Icon.tsx                      # Existing
│   └── __tests__/
│       ├── Button.test.tsx           # New
│       ├── Badge.test.tsx            # Existing
│       └── Icon.test.tsx             # Existing
└── hub/
    ├── SiteHeader.tsx                # Existing
    ├── SiteFooter.tsx                # Existing
    ├── ContentCard.tsx               # Existing
    ├── FallbackThumbnail.tsx         # Existing
    ├── HeroSection.tsx               # New
    ├── ContentTypeSignpost.tsx       # New
    ├── PopularFeaturedSection.tsx    # New
    ├── ContentWidget.tsx             # New
    ├── PartnerLogoScroller.tsx       # New (client)
    ├── ResourceLibrary.tsx           # New (client)
    ├── SearchBar.tsx                 # New (client)
    ├── FilterBar.tsx                 # New (client)
    ├── FilterDrawer.tsx              # New (client)
    ├── SortDropdown.tsx              # New (client)
    ├── Pagination.tsx                # New (client)
    ├── QuestionsSection.tsx          # New
    ├── CertificationsSection.tsx     # New
    ├── CertificationBadge.tsx        # New
    ├── FooterCTASection.tsx          # New
    └── __tests__/
        ├── ContentCard.test.tsx      # Existing
        ├── Pagination.test.tsx       # New
        └── ResourceLibrary.test.tsx  # New
```

---

## What's NOT in Phase 3

- Content detail pages (`/courses/[slug]`, etc.) — Phase 4
- Marketo gate forms, SCORM embed, Credly badges — later phases
- GA4 analytics integration and view count increment — later phase
- Cookie consent banner — later phase
- Social sharing buttons — later phase
- Sitemap, robots.txt, structured data — later phase

---

## Testing Approach

- **Unit tests:** `Button`, `Pagination` (page calculation logic), `ResourceLibrary` (filter/search/sort logic)
- **Manual verification:** Visual check of all 7 sections, responsive behaviour at 375px/768px/1024px+, reduced-motion behaviour for partner scroller, keyboard navigation through filters, empty states
