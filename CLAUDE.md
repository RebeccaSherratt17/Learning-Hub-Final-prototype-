# Claude Code Prompt: Diligent Learning Hub

## Overview
The Diligent Learning Hub is a publicly accessible educational resource hub for governance professionals including board directors, company secretaries, executives and general counsel. It hosts free and gated educational content about corporate governance, risk and compliance (GRC).

The hub is fully built and deployed at **`https://learning-hub-final-prototype.vercel.app`** (production domain — always serves the latest production deployment). Addresses like `learning-hub-final-prototype-<hash>.vercel.app` are individual deployments and change with every release; they're behind Vercel login (Deployment Protection). The canonical address used in absolute URLs comes from `SITE_URL` in `lib/site-url.ts` (`NEXT_PUBLIC_SITE_URL`, falling back to the production domain). This CLAUDE.md reflects the **current state of the codebase** (last updated 2026-10-15) — not a spec for something yet to be built. Read it to understand what exists before making any changes.

GitHub repo: `RebeccaSherratt17/Learning-Hub-Final-prototype-`
Local paths: `C:\Users\rsherratt\Claude-Code-projects\learning-hub`, `C:\Users\athompson\Claude-Code-projects\Learning-Hub-Final-prototype-`

---

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma (client generated to `lib/generated/prisma`)
- **File storage**: Vercel Blob (public store — images, templates, SCORM course files)
- **Admin interface**: Custom `/admin` dashboard (Next.js)
- **Admin authentication**: NextAuth.js (email/password — admins log in at `/admin/login`)
- **SCORM hosting**: Self-hosted via `scorm-again` npm package (no SCORM Cloud)
- **Styling**: Tailwind CSS
- **Language**: TypeScript throughout
- **Node.js**: 24.x, pinned via `engines` in `package.json`
- **HTML sanitizer (`SafeHtml`)**: `isomorphic-dompurify` is **pinned to exactly 2.26.0** (jsdom 26) and listed in `experimental.serverComponentsExternalPackages` in `next.config.mjs`. Do not upgrade it to 3.x: 3.x uses jsdom 29+, whose dependency `@exodus/bytes` is ESM-only, and Vercel's module loader fails with `ERR_REQUIRE_ESM` even on Node 24 — every page using `SafeHtml` then returns HTTP 500 (it still renders client-side, so it looks fine in a browser). Test any change with `node --no-experimental-require-module -e "require('isomorphic-dompurify').sanitize('<p>x</p>')"`, which reproduces Vercel's behaviour locally. Tests still use jsdom 29 (devDependency).
- **Lead management**: Marketo (REST API, server-side proxy — credentials pending)
- **Analytics**: Amplitude (client-side SDK + server-side HTTP API, consent-aware — API key pending)
- **Digital badges**: Credly (REST API — credentials set, badge templates being configured)
- **Deployment**: Vercel (auto-deploys from GitHub `main` branch)
- **Scheduled jobs**: Vercel Cron (`vercel.json`) — publish-scheduled every 5 mins; feedback-digest monthly (cron entry exists but the `/api/cron/feedback-digest` route is **not yet built**)

---

## CRITICAL — Database Safety Rules

**NEVER** run `prisma migrate reset` or `prisma migrate reset --force` without explicit written approval from the project owner. A previous incident (2026-05-19) resulted in complete data loss from the production Supabase database.

- For schema changes: use `prisma db push` (safe, does not drop data)
- For migration files: use `prisma migrate dev` with caution
- If Prisma reports migration drift: **stop and flag to the project owner** — never resolve drift automatically
- After schema changes, run `prisma generate` to regenerate the client
- These rules apply to subagents and automated scripts too

---

## What Is Already Built

### Phase 1 — Complete
- PostgreSQL schema (37 tables), Supabase connection, NextAuth.js admin auth
- Database seed: admin user (`certifications@diligent.com`), taxonomy, hub settings

### Phase 2 — Admin Dashboard — Complete
Full custom admin dashboard at `/admin`. Sidebar sections: **Content** (Dashboard, Courses, Templates, Videos, Learning Paths), **Configuration** (Taxonomy, Partners, Redirects), **System** (Reporting, Settings).

**Dashboard (`/admin`):**
- Welcome message, total published count, per-content-type status counts
- "Action required" panel listing published items with missing metadata (uses `lib/admin/metadataHealth.ts`)

**List pages (all four content types):**
- Filter dropdowns: status, access tier, restricted, author
- Author column
- Red warning icons on items missing metadata
- Delete confirmation modals
- Bulk actions (`/api/admin/[type]/bulk`)

**Content forms (all four content types):**
- CRUD for courses, templates, videos, learning paths
- Slug + SKU side by side
- Author dropdown (`AuthorSelect`) with inline author creation — `Author` model shared across all content types
- **Level** field (Beginner / Intermediate / Advanced — `DifficultyLevel` enum) on courses, videos and learning paths (not templates) — required to publish
- **Learning objectives** rich text field on courses only
- Two-column Media section: thumbnail and OG image side by side, each with alt text (`thumbnailAlt`, `ogImageAlt`)
- Taxonomy accordion dropdowns — Organization type shown first, red asterisk, mandatory
- Credly badge template ID field
- Related items picker (up to 3 per content item)
- Mandatory vs Elective items + milestones in learning paths
- Restricted access section (token-gated URLs) on all four content types — generate/revoke token, optional `restrictedNote`
- Success/error messages at top AND bottom of forms; status-specific success messages with "View live page" link after publishing
- "Visit live page" button on edit pages when published
- Preview button (blue) next to save actions — 30-min preview tokens, yellow preview banner on public page
- **Publishing actions** at the bottom of the form (after SEO):
  - "Save as draft" — no validation
  - "Publish" split button with "Schedule for later" dropdown (date picker)
  - "Archive this item" / Restore
- **Publish-blocking validation** (client + server, only on Publish/Schedule — returns 400 from API). Required fields:
  - All: title, slug, description, thumbnail image, OG image, organization type
  - Courses: + level, SCORM file (SCORM can only be uploaded after first saving as draft)
  - Templates: + template file
  - Videos: + level, Vidyard URL/ID, duration
  - Learning paths: + level

**Other admin pages:**
- Taxonomy management (personas, regions, subjects/subject groups)
- Educational partners management (logos for the homepage scroller)
- Redirects management (301 redirects via middleware)
- Content revision history
- Vercel Blob file uploads
- Scheduled publishing (status: DRAFT / SCHEDULED / PUBLISHED / ARCHIVED)
- **Hub Settings** (`/admin/settings`) — exactly these fields:
  - `librarySectionHeading`, `librarySectionBody` (library page)
  - `footerHeading`, `footerBody`, `footerCTAText`, `footerEmail` (footer CTA)
  - `defaultSeoTitle`, `defaultSeoDescription` (fallback SEO for content detail pages and homepage JSON-LD)

**Removed** (do not reintroduce without asking): Certification Badges admin page/model (`CertificationBadge`), and old HubSettings hero/popular/partners/certifications/demoCTAUrl fields.

### Phase 3 — Public Content Pages — Complete
- **Course page** (`/courses/[slug]`): two-column layout, description, collapsible **Learning Objectives** accordion (`CourseObjectivesAccordion`), launch form (first name, last name, work email, organization), related items, preview support. Course opens in a **new tab** at the player page (see SCORM Integration).
- **Template page** (`/templates/[slug]`): Two-column layout, gate form in right column (replaces placeholder image on submission), download button, legal disclaimer, taxonomy tags linking to library, share buttons, CTA banner
- **Video page** (`/videos/[slug]`): Vidyard embed (`VidyardEmbed` component), gate form, related items, CTA banner
- **Learning path page** (`/learning-paths/[slug]`): Ordered items with checkboxes, milestones as subheadings, learner identity form (name/email), progress tracking, Credly badge on completion, related items
- **SCORM player page** (`/play/[attemptId]`): standalone full-window page that hosts `ScormEmbed`
- UI breadcrumbs on all detail pages: Home > [Content type] (links to `/library?type=X#resource-library`) > Item title
- SEO metadata falls back to Hub Settings default SEO title/description

Additional infrastructure:
- Gate form with 30-day `hub_gated_access` session cookie (site-wide unlock)
- **Learning path-based unlocking**: identifying on a learning path sets the `hub_unlocked_paths` cookie (30-day, HttpOnly, URL-encoded JSON array of path IDs). Course/template/video pages treat an item as ungated if the site-wide cookie is set OR the item belongs to any unlocked path (`lib/unlocked-paths.ts`). Standalone items not in an unlocked path gate normally.
- Learner identity + progress tracking (`hub_learner_id` cookie, LearnerProgress table)
- Credly badge issuance on course completion AND learning path completion (via `/api/credly/issue`)
- SCORM proxy route (`/api/scorm/content/[...path]`) — serves course files inline with correct headers
- **Restricted content** (all four types): `restricted` + `accessToken` + `restrictedNote` fields. Accessible only via `?token=` URL; invalid tokens show a "This link is not valid" page. Hidden from library, content API, homepage widgets and sitemap.
- Sitemap (`/sitemap.xml`) — published non-restricted content only
- Robots.txt — environment-aware (blocks crawling unless `VERCEL_ENV=production`; previews are blocked)
- Absolute URLs (sitemap, robots, JSON-LD, breadcrumbs, `metadataBase` for Open Graph) all use `SITE_URL` from `lib/site-url.ts` — never hard-code a domain
- 301 redirects middleware
- Cookie consent banner (GDPR, `hub_cookie_consent` 365-day cookie)
- Branded 404 and 500 error pages
- Mobile responsiveness (44px touch targets, responsive grids)
- Row-level security enabled on all Supabase tables

### Structured Data (JSON-LD) — Complete
Shared typed builders in `lib/jsonld.ts` (descriptions HTML-stripped):
- Course → `Course`; Template → `DigitalDocument`; Video → `VideoObject`; Learning path → `Course` with `hasPart`
- All include provider, inLanguage and offers where appropriate
- `BreadcrumbList` on all four detail pages
- `WebSite` with `SearchAction` on the homepage
- `CollectionPage` on the library page

### Homepage — Complete
The homepage (`/`) is wrapped in a `<main>` landmark with `aria-labelledby` sections:

**Section 1 — Hero** (`HomepageHero`, gray background):
- Heading: "Search the hub. Or scan the shelves." ("shelves." in Diligent Red)
- Subheading: "Browse a category, search a keyword, or click a subtopic to jump straight to what you need."
- Search bar with autocomplete (`/api/hub/search-suggest`) — navigates to `/library?q=[term]#resource-library`
- "TRY:" suggestion pills — 4 random terms from `SEARCH_SUGGESTION_POOL` in `lib/searchSuggestions.ts` (12 terms; shared with library page)
- Compact "IN PARTNERSHIP WITH:" partner logo scroller (homepage only)

**Section 2 — Organization type selector** (`OrgTypeSelector`):
- Dark bar (`#282E37`) with three columns: Public company, Private company, Nonprofit, with resource counts
- Active selection highlighted in Diligent Red (no "VIEWING" badge)
- Clicking refetches `/api/hub/content?orgType=...&sort=popular&limit=50` and filters all widgets below
- Default: Public company

**Section 3 — Most popular widget** (`PopularWidget`):
- Slim horizontal header: "Most popular" + "The most-accessed resources across the hub" + "See all" link (`/library?sort=popular`)
- Static grid of 4 cards (2-col mobile, 4-col desktop) — no content type tabs, no left panel, no outer border

**Section 4 — Six subject group widgets** (`SubjectGroupWidget`):
- Same slim header style: group name, description line (from `subjectGroupConfig.ts`), "See all" link to library filtered by the group's subject cuids + active org type
- Static grid of 4 cards — no sub-topic pills, no left panel

Subject groups in order:
1. Board governance — "Tools to help leaders govern effectively"
2. Board meetings & committees — "Guidance for running meetings and committees"
3. AI & technology — "Governance of AI, technology and cyber risk"
4. Risk management — "Managing risk across your organization"
5. Compliance & policy — "Stay ahead of regulatory obligations"
6. Governance professionals — "For the people who make governance work"

**Section 5 — Footer CTA** (`FooterCTASection` + `DemoRequestForm`):
- Heading, body, CTA button text and contact email all come from Hub Settings (fallback heading: "Upskill your board today")
- Demo form with 6 fields: First name, Last name, Work email, Phone number, Company name, Country (optgroup with US/Canada/UK pinned at top)
- "Got questions? Email [footerEmail]" mailto link, smallprint with Preference Center and Privacy Notice links

### Library Page — Complete
`/library` — the resource library is the first section below the nav (no hero, no featured/certifications sections):
- `<h1>` "Resource library" ("library" in red), body from Hub Settings
- Full-width search bar (controlled — pill clicks update the text) + popular searches pills row
- "[N] resources" count with sort dropdown aligned to the filter sidebar header
- Active filter tags row with individual remove buttons
- Left sidebar filter accordions, in order: Content type, Organization type, Level, Subject, Region, Persona (sentence case labels). Mobile uses `FilterDrawer` with focus trap.
- Reads URL params: `q`, `type`, `sort`, `orgType`, subject cuids. Org type and topic subjects are applied as separate AND conditions.
- 3-column content grid, 15 items per page, numbered pagination (scrolls to top of grid on page change)
- **Global region logic**: content tagged "Global" automatically appears in all region filters
- No partner scroller (homepage only)

### Navigation — Complete
`components/hub/SiteHeader.tsx`:
- Diligent logo + "Learning Hub" text left-aligned (link to `/`)
- Right-aligned: **Library** flyout and **Certifications** dropdown (no Home link, no admin link)
- Library flyout — two-panel design: "Resource library" link, "By content type" (Courses, Templates, Videos, Learning paths with icons + descriptions), "By topic" (subject groups, alphabetical, linking to library filtered by subject cuids fetched in `app/(hub)/layout.tsx`)
- Certifications dropdown: 6 certification links with badge images
- Keyboard support: `aria-haspopup`/`aria-expanded`, Escape closes and returns focus, Tab/focus activates flyout sub-panels; mobile menu focus management

### Accessibility — Homepage and Library audited
WCAG 2.1 AA fixes applied to homepage and library: skip nav link, colour contrast (secondary text `#5C5F63`), heading hierarchy, aria labels, touch targets, partner scroller duplicates `aria-hidden`. Content detail pages and admin have **not** been audited yet.

---

## Content Types

### 1. Courses
- SCORM `.zip` uploaded via admin dashboard using a **client-side Vercel Blob upload** (`@vercel/blob/client`, token from `/api/admin/courses/[id]/scorm/upload`) to bypass Vercel's 4.5MB serverless body limit. Server then downloads the zip from Blob, extracts it, stores files in Vercel Blob and deletes the temp zip (`/api/admin/courses/[id]/scorm`).
- `scorm-again` handles SCORM 1.2 and 2004 runtime API
- No learner accounts — learners identified by first name, last name, email, organization (form on course page)
- 30-day gate cookie (`hub_gated_access`) — returning visitors skip the form and see a "Welcome back" launch button
- `learningObjectives` (rich text) shown in a collapsible accordion on the course page
- Completion data stored in `Attempt` table (status: IN_PROGRESS / COMPLETED / PASSED / FAILED)
- Credly badge issued on COMPLETED/PASSED if `credlyBadgeId` set on course

### 2. Templates
- Downloadable Word (.docx), Excel (.xlsx) or PDF files
- Gate form (first name, last name, work email, organization) before download
- File size and page count auto-detected on upload (pdf-lib for PDFs, jszip for DOCX)
- Generic placeholder image (`/public/template-placeholder.png`) shown in right column
- Gate form replaces placeholder image in right column; disappears after submission revealing placeholder + download button
- No Level field

### 3. Videos
- Vidyard embed (JavaScript embed via `VidyardEmbed` client component — not iframe)
- Can be free or gated

### 4. Learning Paths
- Ordered collection of courses, templates, videos
- Milestones: optional subheadings between items
- Mandatory vs Elective: `isElective` boolean per item — path is complete when all Mandatory items done
- Learner identity captured via name/email form (`/api/learner/identify`) — also unlocks all items in the path site-wide (`hub_unlocked_paths` cookie)
- Progress tracked in `LearnerProgress` table
- Credly badge issued on completion if `credlyBadgeId` set

### Shared fields (all four types)
`title`, `slug`, `description` (rich text), `sku`, `authorId` → `Author`, `thumbnailUrl`/`thumbnailAlt`, `ogImageUrl`/`ogImageAlt`, `accessTier`, `status`, `publishedAt`, `scheduledPublishAt`, `restricted`/`accessToken`/`restrictedNote`, `seoTitle`/`seoDescription`, `credlyBadgeId` (not templates), `level` (not templates), `viewCount`.

---

## Taxonomy

**Organization Type** (mandatory on all content — validated on publish, shown first in Taxonomy section; stored as subjects in the `organization-type` subject group):
- Public company, Private company, Nonprofit

**Level** (`DifficultyLevel` enum, not templates): Beginner (shown as "Beginner-friendly" in library filter), Intermediate, Advanced

**Personas**:
- Board Director, Executive Management, Company Secretary, General Counsel, Risk, Legal

**Regions**:
- Global, US, EU, UK, APAC, Canada
- **Global logic**: content tagged Global automatically appears in all region filter results (OR condition in Prisma queries)
- Admin note shown in Regions accordion: "Items tagged as Global are automatically included in all region filters — no need to tag individual countries separately."

**Subjects** (6 groups):

| Group | Sub-topics |
|---|---|
| Board Governance | Board governance, Board structure, Director onboarding, Board evaluations, Entity management |
| Board Meetings & Committees | Board meetings, Agendas and calendars, Meeting minutes, Board committees, Compensation, Financials |
| AI & Technology | AI governance, AI ethics, AI risk management, Cyber risk, Cyber resilience, Incident response |
| Risk Management | ERM, ESG, Market risk, IPO, Investor stewardship |
| Compliance & Policy | Regulatory compliance, Corporate policies, ESG compliance |
| Governance Professionals | Professional development, Governance administration, Strategic communication |

Use `lib/toSentenceCase.ts` when displaying taxonomy names in the public UI.

---

## Access Tiers
1. **Free**: No gate — learner identity still captured for SCORM tracking (name, email, organization)
2. **Gated**: Gate form before access — 30-day `hub_gated_access` cookie, or unlocked via a learning path (`hub_unlocked_paths`)
3. **Premium**: Demo CTA only — "Request a demo" button (links to `/#footer-cta`)

Separately, any item can be **Restricted** (token-only access, hidden from public listings) regardless of tier.

---

## SCORM Integration

### How it works
1. Admin saves course as draft → uploads `.zip` directly to Vercel Blob from the browser → server extracts → files stored in Vercel Blob
2. Learner fills name/email/org form (`CourseRightColumn`) → `/api/gate/submit` (if not already gated) → `/api/scorm/launch` creates Attempt + HMAC token
3. `CourseRightColumn` stores the launch details (`attemptId`, `courseId`, `launchToken`, `launchUrl`, `scormVersion`, `courseTitle`) in `localStorage` via `storeLaunchData()` (`lib/scorm/launchHandoff.ts`), then opens `/play/[attemptId]` in a new tab. The course page then shows "Course opened in a new tab" with a "Reopen course" button; if the browser blocks the tab, it shows an "Open course" link instead.
4. The player page (`app/play/[attemptId]/page.tsx`) reads and removes that entry (`takeLaunchData()`), then renders `ScormEmbed` full-window. If the entry is missing it shows a branded "session has expired" message. This page exists so the `scorm-again` LMS API is on the window that hosts the course iframe.
5. `ScormEmbed` initialises `scorm-again` BEFORE the iframe src is set (critical)
6. Course files served via `/api/scorm/content/[...path]` proxy
7. `scorm-again` POSTs CMI data to `/api/scorm/tracking/:attemptId`
8. Tracking endpoint normalises SCORM 1.2/2004 CMI (nested object, not dot-notation) → updates Attempt table
9. On completion: Credly badge issued if `credlyBadgeId` set. The player tab broadcasts completion on the `hub-scorm` `BroadcastChannel` (`broadcastCompletion()`) and the course page switches to its "Course completed" message (`onCourseCompleted()`). Closing the player calls `window.close()`.
10. `ScormEmbed` keeps `onComplete` in a ref — never add callbacks to the API-initialisation effect deps, or the SCORM API is re-created mid-course.

### Security
- Path traversal rejected at manifest parser + extractor levels
- Launch tokens verified with `timingSafeEqual` (never string comparison)
- Zip-bomb protection enforced
- `SCORM_TOKEN_SECRET` minimum 32 bytes
- All SCORM routes server-side only

---

## Credly Integration

- Uses HTTP Basic auth (API key as username, empty password) — NOT Bearer token
- `issued_at` ISO field required in request body
- Duplicate prevention via `CredlyBadgeIssuance` table
- Badge issuance is fire-and-forget with 3 retries and exponential backoff
- Triggered by: SCORM tracking endpoint (courses) and learner progress endpoint (learning paths)

---

## Public APIs

`GET /api/hub/content` — public endpoint for client-side content fetching (excludes restricted items):
- `orgType` — subject ID (cuid) for org type filter
- `subject` — subject ID for subject filter
- `sort` — `popular` | `newest`
- `type` — `COURSE` | `TEMPLATE` | `VIDEO` | `LEARNING_PATH`
- `limit` — number (default 12)

`GET /api/hub/search-suggest` — search autocomplete for the homepage hero.

Other public routes: `/api/gate/submit`, `/api/demo-request`, `/api/learner/identify`, `/api/learner/progress`, `/api/scorm/launch`, `/api/scorm/tracking/[attemptId]`, `/api/scorm/content/[...path]`, `/api/credly/issue`, `/api/redirects`.

---

## Brand Guidelines

### Typography
- **Primary typeface**: Plus Jakarta Sans (max 2 weights, 140% word spacing)
- Small uppercase eyebrow labels: `text-[11px] tracking-[0.08em] font-medium` in `#5C5F63`

### Colors
- **Diligent Red**: `#EE312E`
- **Grays**: Gray1 `#F3F3F3`, Gray2 `#DADADA`, Gray3 `#A0A2A5`, Gray4 `#6F7377`, Gray5 `#282E37`
- **Accessible secondary text**: `#5C5F63` (used instead of Gray4 for body/secondary text to meet WCAG AA 4.5:1)
- **Secondary** (data viz only): Blue3 `#0B4CCE` (hyperlinks), others for charts only
- **Hyperlinks**: Blue3 `#0B4CCE`, no underline
- **CTAs**: Diligent Red, sentence case, medium weight
- Content cards: rounded corners, colour-coded content type badges

### Icons
- Material Symbols, Fill 0, Weight 400, Grade 0, Optical 48px — both Sharp and Rounded fonts are loaded in `app/layout.tsx`
- **Rounded** is used on the homepage and navigation (via `<Icon variant="rounded" />`)
- **Sharp** (`material-symbols-sharp`) is still used on content detail pages and admin

---

## Rich Text Fields

Tiptap rich text (H2, H3, bold, italic, lists, hyperlinks, text colour) used in:
- Hub Settings: `librarySectionBody`, `footerBody`
- Content type description fields (all four types)
- Course `learningObjectives`

Rendered via `SafeHtml` component (DOMPurify). List styling via `.rich-text` CSS class.

---

## Reporting & First-Party Analytics

**Reporting page** (`/admin/reporting`) — server-rendered from `lib/admin/reporting.ts`:
- Date range pills (`?range=7d|30d|90d|12m|all`, default 30d) or a custom range (`?range=custom&from=YYYY-MM-DD&to=YYYY-MM-DD`, inclusive, UTC; `DateRangeFilter.tsx`) scope everything on the page. Resolved by `resolveRange()` in `lib/admin/reportingRanges.ts` into `{ from, to, end (exclusive), bucket }`; all queries use `>= from AND < end`. Custom trend buckets: daily ≤92 days, weekly ≤2 years, else monthly.
- KPI tiles: unique visitors, page views, leads (gate submissions), course completions (with completion rate), template downloads, Credly badges issued
- Trend chart (`components/admin/reporting/TrendChart.tsx`): visitors / page views, daily buckets up to 90d, weekly for 12m, monthly for all time; crosshair tooltip, keyboard arrows, table view. Single series in Blue3 `#0B4CCE`.
- Most popular (`PopularContent.tsx`): separate top-10 ranked lists for Courses, Learning paths, Videos and Templates, toggling between the selected period (tracked page views) and all time (`viewCount` since launch)
- Content performance table (`ItemsReportTable.tsx`): per item views, visitors, all-time `viewCount`, leads, downloads (templates), starts/completions/completion rate (courses); sortable, filter by type/status/search
- Learning paths table: views, enrolled, active learners, completions (all mandatory items done), badges
- CSV export: `/api/admin/reporting/export?report=items|learning-paths|leads&range=...` (admin-only; leads CSV contains PII; cells are escaped against formula injection)
- Course starts/completions are cohort-based: attempts **started** in the range, and how many of those completed/passed

**Tracking** — written to the existing `AnalyticsEvent` table (no schema change):
- `page_view` — `PageViewTracker` in `app/(hub)/layout.tsx` beacons `/api/track` on every route change; the API resolves `/courses|templates|videos|learning-paths/[slug]` to the content item
- `template_download` — download button click and gate-form auto-download
- `learning_path_enrol` — recorded by `/api/learner/identify` (`metadata.learnerId`)
- **Cookieless unique visitors**: `metadata.visitorHash` = HMAC-SHA256 of IP + user agent, keyed by `ANALYTICS_HASH_SECRET` (falls back to `NEXTAUTH_SECRET`) + UTC date (`lib/analytics/visitor.ts`). No cookie, raw IP never stored. A visitor is counted once **per day**, so multi-day totals are the sum of daily uniques.
- Skipped: bots (UA regex), signed-in admins, `?preview=` views, `/admin`, `/api`, `/play`
- Tracking started when this shipped — earlier visits only exist in the all-time `viewCount` counters (which still increment server-side and include bots)

## Known Issues / Tech Debt

- Homepage server query (`app/(hub)/page.tsx`) filters `restricted: false` for courses only — templates, videos and learning paths in the initial render are not filtered (the content API and library are)
- `vercel.json` schedules `/api/cron/feedback-digest`, but the route doesn't exist yet

---

## Remaining To Build

1. **Amplitude analytics** — awaiting API key from team
2. **Marketo integration** — gate form stores locally; awaiting credentials
3. **Feedback system** — post-completion star rating + monthly email digest (cron route not yet created)
4. **Accessibility audit** — content detail pages, player page and admin (homepage and library done)
5. **Credly learning path testing** — completion flow not yet verified end-to-end

---

## Pending Team Decisions

- Navigation bar: possible "Request a demo" CTA
- Content re-tagging with new taxonomy, authors and levels (manual work via admin dashboard)
- Homepage: further design refinements ongoing

---

## Key File Locations

| File | Purpose |
|---|---|
| `app/(hub)/page.tsx` | Homepage |
| `app/(hub)/layout.tsx` | Hub layout (fetches subject group cuids for nav) |
| `app/(hub)/library/page.tsx` | Resource library |
| `app/(hub)/courses/[slug]/page.tsx` | Course detail page |
| `app/play/[attemptId]/page.tsx` | SCORM player page (opened in new tab) |
| `app/admin/(dashboard)/page.tsx` | Admin dashboard (metadata health panel) |
| `components/hub/HomepageContent.tsx` | Client wrapper for org type state |
| `components/hub/HomepageHero.tsx` | Search hero + partner scroller |
| `components/hub/OrgTypeSelector.tsx` | Org type selector bar |
| `components/hub/PopularWidget.tsx` | Most popular widget |
| `components/hub/SubjectGroupWidget.tsx` | Per-subject-group widget |
| `components/hub/subjectGroupConfig.ts` | Subject group order, icons and descriptions |
| `components/hub/SiteHeader.tsx` | Navigation bar (Library flyout, Certifications dropdown) |
| `components/hub/SiteFooter.tsx` | Dark footer |
| `components/hub/ContentCard.tsx` | Content card (standard + compact variants) |
| `components/hub/ResourceLibrary.tsx` | Filterable content grid |
| `components/hub/FilterSidebar.tsx` | Left sidebar filter accordion |
| `components/hub/FilterDrawer.tsx` | Mobile filter drawer |
| `components/hub/DemoRequestForm.tsx` | Footer CTA demo form |
| `components/hub/FooterCTASection.tsx` | Footer CTA section |
| `components/hub/GateForm.tsx` | Gate form (templates, videos) |
| `components/hub/TemplateRightColumn.tsx` | Template right column state |
| `components/hub/CourseRightColumn.tsx` | Course launch form + new-tab launch |
| `components/hub/CourseObjectivesAccordion.tsx` | Learning objectives accordion (SafeHtml) |
| `lib/scorm/launchHandoff.ts` | Course page ↔ player tab hand-off + completion broadcast |
| `components/content/ScormEmbed.tsx` | SCORM runtime + iframe |
| `components/content/VidyardEmbed.tsx` | Vidyard player |
| `components/ui/Icon.tsx` | Material Symbols icon (`variant` sharp/rounded) |
| `components/admin/RichTextEditor.tsx` | Tiptap editor |
| `components/admin/TaxonomySelect.tsx` | Taxonomy with org type validation |
| `components/admin/AuthorSelect.tsx` | Author dropdown with inline creation |
| `components/admin/CourseForm.tsx` etc. | Content type forms (Course/Template/Video/LearningPath) |
| `components/admin/CourseList.tsx` etc. | Admin list pages with filters |
| `lib/admin/metadataHealth.ts` | Metadata health checks + publish validation |
| `app/admin/(dashboard)/reporting/page.tsx` | Reporting page |
| `lib/admin/reporting.ts` | Reporting queries (shared by page + CSV export) |
| `lib/admin/reportingRanges.ts` | Date range / trend bucket helpers |
| `lib/analytics/` | Event recording, visitor hash, client beacon |
| `app/api/track/route.ts` | Public tracking endpoint |
| `lib/credly.ts` | Credly badge helper |
| `lib/content.ts` | Shared content mapping (`publishedFilter`, `toCourseItem` etc.) |
| `lib/jsonld.ts` | JSON-LD builders |
| `lib/gate-session.ts` | Gate cookie helpers |
| `lib/learner-session.ts` | Learner cookie helpers |
| `lib/unlocked-paths.ts` | Learning path unlock cookie helpers |
| `lib/searchSuggestions.ts` | Shared search suggestion pool |
| `lib/toSentenceCase.ts` | Sentence case utility |
| `lib/related-items.ts` | Related items helper |
| `lib/scorm/` | Manifest parser, tokens, extractor |
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.ts` | Database seed |
