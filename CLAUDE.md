# Claude Code Prompt: Diligent Learning Hub

## Overview
The Diligent Learning Hub is a publicly accessible educational resource hub for governance professionals including board directors, company secretaries, executives and general counsel. It hosts free and gated educational content about corporate governance, risk and compliance (GRC).

The hub is fully built and deployed at `https://learning-hub-final-prototype-3zio4xt7t.vercel.app`. This CLAUDE.md reflects the **current state of the codebase** — not a spec for something yet to be built. Read it to understand what exists before making any changes.

GitHub repo: `RebeccaSherratt17/Learning-Hub-Final-prototype-`
Local path: `C:\Users\rsherratt\Claude-Code-projects\learning-hub`

---

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **File storage**: Vercel Blob (public store — images, templates, SCORM course files)
- **Admin interface**: Custom `/admin` dashboard (Next.js)
- **Admin authentication**: NextAuth.js (email/password — admins log in at `/admin/login`)
- **SCORM hosting**: Self-hosted via `scorm-again` npm package (no SCORM Cloud)
- **Styling**: Tailwind CSS
- **Language**: TypeScript throughout
- **Lead management**: Marketo (REST API, server-side proxy — credentials pending)
- **Analytics**: Amplitude (client-side SDK + server-side HTTP API, consent-aware — API key pending)
- **Digital badges**: Credly (REST API — credentials set, badge templates being configured)
- **Deployment**: Vercel (auto-deploys from GitHub `main` branch)
- **Scheduled jobs**: Vercel Cron (publish-scheduled every 5 mins, feedback-digest monthly)

---

## CRITICAL — Database Safety Rules

**NEVER** run `prisma migrate reset` or `prisma migrate reset --force` without explicit written approval from the project owner. A previous incident (2026-05-19) resulted in complete data loss from the production Supabase database.

- For schema changes: use `prisma db push` (safe, does not drop data)
- For migration files: use `prisma migrate dev` with caution
- If Prisma reports migration drift: **stop and flag to the project owner** — never resolve drift automatically
- These rules apply to subagents and automated scripts too

---

## What Is Already Built

### Phase 1 — Complete
- PostgreSQL schema (37 tables), Supabase connection, NextAuth.js admin auth
- Database seed: admin user (`certifications@diligent.com`), taxonomy, hub settings, certification badges

### Phase 2 — Complete
Full custom admin dashboard at `/admin`:
- CRUD for courses, templates, videos, learning paths
- Taxonomy management (personas, regions, subjects/subject groups)
- Hub Settings (homepage copy, editable via Tiptap rich text editor)
- Educational partners management
- Certification badges management
- Redirects management (301 redirects via middleware)
- Content revision history
- Vercel Blob file uploads
- Scheduled publishing (status: DRAFT / SCHEDULED / PUBLISHED / ARCHIVED)
- Preview mode (30-min tokens, yellow "PREVIEW — NOT PUBLISHED" banner)
- Related items picker (up to 3 per content item)
- SKU field on all four content types
- Credly badge template ID field on all four content types
- Taxonomy accordion dropdowns in admin forms
- Mandatory vs Elective items in learning paths
- Organization type validation (mandatory — at least one must be selected before saving)
- Success/error messages at top AND bottom of all content type forms
- Publishing section at the very bottom of all content type forms (after SEO)
- Preview button (blue) next to Save button on all content type edit pages

### Phase 3 — Complete
All public hub content item detail pages:
- **Course page** (`/courses/[slug]`): SCORM launch form (name, email, organization), fullscreen overlay, scorm-again runtime, completion message, related items, preview support
- **Template page** (`/templates/[slug]`): Two-column layout, gate form in right column (replaces with placeholder image on submission), download button, legal disclaimer, taxonomy tags linking to library, share buttons, CTA banner
- **Video page** (`/videos/[slug]`): Vidyard embed (VidyardEmbed component), gate form, related items, CTA banner
- **Learning path page** (`/learning-paths/[slug]`): Ordered items with checkboxes, milestones as subheadings, learner identity form (name/email), progress tracking, Credly badge on completion, related items

Additional infrastructure:
- Gate form with 30-day `hub_gated_access` session cookie
- Learner identity + progress tracking (`hub_learner_id` cookie, LearnerProgress table)
- Credly badge issuance on course completion AND learning path completion (via `/api/credly/issue`)
- SCORM proxy route (`/api/scorm/content/[...path]`) — serves course files inline with correct headers
- Sitemap (`/sitemap.xml`) — published non-restricted content only
- Robots.txt — environment-aware (blocks crawling on non-production)
- 301 redirects middleware
- Cookie consent banner (GDPR, `hub_cookie_consent` 365-day cookie)
- Branded 404 and 500 error pages
- Mobile responsiveness (44px touch targets, responsive grids)
- Row-level security enabled on all 37 Supabase tables

### Homepage — Complete (New Design)
The homepage (`/`) has been fully rebuilt with a search-first design:

**Section 1 — Hero:**
- Heading: "Search the hub. Or scan the shelves." (with "shelves." in Diligent Red)
- Subheading and search bar (navigates to `/library?q=[term]#resource-library`)
- "TRY:" suggestion pills — 4 randomly selected from a pool of 12 terms on each page load: "AI governance", "Meeting minutes", "Board evaluations", "Cybersecurity", "Director onboarding", "Investor stewardship", "Subsidiary governance", "Audit committee", "Compensation committee", "AI ethics", "ERM", "IPO"

**Section 2 — Organization type selector:**
- Dark bar (`#282E37`) with three columns: Public company, Private company, Nonprofit
- Active selection highlighted in Diligent Red with "✓ VIEWING" badge
- Clicking switches active org type and filters all content widgets below
- Default: Public company

**Section 3 — Most popular widget:**
- Bordered box with pink-tinted left panel
- "ACROSS THE HUB" eyebrow, red star badge, "Most popular" heading
- Content type filter tabs (Templates, Courses, Videos, Learning paths)
- Horizontally scrollable row of exactly 4 compact content cards
- "See all popular →" link and "See all →" end cap, both navigating to `/library?sort=popular#resource-library`

**Section 4 — Six subject group widgets:**
Each subject group has a bordered box with:
- Gray left panel: red icon badge, subject group name (sentence case), description, sub-topic pills (filter locally within widget), "See all [N] items →" link
- Horizontally scrollable row of compact content cards filtered by subject group + active org type
- "See all →" end cap
- Sub-topic pills filter content within the widget (not navigation links)

Subject groups in order:
1. Board governance — "Tools to help leaders govern effectively"
2. Board meetings & committees — "Guidance for running meetings and committees"
3. AI & technology — "Governance of AI, technology and cyber risk"
4. Risk management — "Managing risk across your organization"
5. Compliance & policy — "Stay ahead of regulatory obligations"
6. Governance professionals — "For the people who make governance work"

**Section 5 — Educational partners scroller** (existing PartnerLogoScroller component)

**Section 6 — Footer CTA** (DemoRequestForm with 6 fields: First name, Last name, Work email, Phone number, Company name, Country dropdown with US/Canada/UK pinned at top)
- Body: "Unlock unlimited access to the Education & Templates Library — everything your board and governance team needs to stay informed, prepared and ahead of the curve."
- "Got questions? Email certifications@diligent.com" (mailto link)
- Smallprint with Preference Center and Privacy Notice links

### Library Page — Complete
`/library` — the full resource library with:
- Left sidebar filter accordion (Organization type, Subject, Region, Persona)
- Search bar, Content type dropdown ("Sort: Content type"), Sort dropdown ("Sort: Newest") — right-aligned
- 3-column content grid, 15 items per page, numbered pagination
- **Global region logic**: content tagged "Global" automatically appears in all region filters

### Navigation — Complete
`components/hub/SiteHeader.tsx`:
- Diligent logo + "Learning Hub" text (both link to `/`)
- Centre: Home (`/`), Library (`/library`), Certifications (dropdown with Education & Templates Library + 6 certification links with 40x40px badge images)
- No admin link (admins navigate directly to `/admin`)

---

## Content Types

### 1. Courses
- SCORM `.zip` uploaded via admin dashboard — extracted server-side, stored in Vercel Blob
- `scorm-again` handles SCORM 1.2 and 2004 runtime API
- No learner accounts — learners identified by first name, last name, email, organization (form on course page)
- 30-day gate cookie (`hub_gated_access`) — returning visitors skip the form and see "Welcome back" launch button
- Completion data stored in `Attempt` table (status: IN_PROGRESS / COMPLETED / PASSED / FAILED)
- Credly badge issued on COMPLETED/PASSED if `credlyBadgeId` set on course
- Restricted courses: `restricted` boolean + `accessToken` field — token-gated, hidden from library

### 2. Templates
- Downloadable Word (.docx), Excel (.xlsx) or PDF files
- Gate form (first name, last name, work email, organization) before download
- File size and page count auto-detected on upload (pdf-lib for PDFs, jszip for DOCX)
- Generic placeholder image (`/public/template-placeholder.png`) shown in right column
- Gate form replaces placeholder image in right column; disappears after submission revealing placeholder + download button

### 3. Videos
- Vidyard embed (JavaScript embed via `VidyardEmbed` client component — not iframe)
- Can be free or gated

### 4. Learning Paths
- Ordered collection of courses, templates, videos
- Milestones: optional subheadings between items
- Mandatory vs Elective: `isElective` boolean per item — path is complete when all Mandatory items done
- Learner identity captured via name/email form
- Progress tracked in `LearnerProgress` table
- Credly badge issued on completion if `credlyBadgeId` set

---

## Taxonomy

**Organization Type** (mandatory on all content — validated on save, shown first in Taxonomy section):
- Public company, Private company, Nonprofit

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

---

## Access Tiers
1. **Free**: No gate — learner identity still captured for SCORM tracking (name, email, organization)
2. **Gated**: Gate form before access — 30-day `hub_gated_access` cookie
3. **Premium**: Demo CTA only — "Request a demo" button

---

## SCORM Integration

### How it works
1. Admin uploads `.zip` → hub extracts → Vercel Blob storage
2. Learner fills name/email/org form → `/api/scorm/launch` creates Attempt + HMAC token
3. `ScormEmbed` initialises `scorm-again` BEFORE iframe src is set (critical)
4. Course runs in fullscreen overlay — files served via `/api/scorm/content/[...path]` proxy
5. `scorm-again` POSTs CMI data to `/api/scorm/tracking/:attemptId`
6. Tracking endpoint normalises SCORM 1.2/2004 CMI (nested object, not dot-notation) → updates Attempt table
7. On completion: Credly badge issued if `credlyBadgeId` set

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

## Homepage API

`GET /api/hub/content` — public endpoint for client-side content fetching:
- `orgType` — subject ID (cuid) for org type filter
- `subject` — subject ID for subject filter
- `sort` — `popular` | `newest`
- `type` — `COURSE` | `TEMPLATE` | `VIDEO` | `LEARNING_PATH`
- `limit` — number (default 12)

---

## Brand Guidelines

### Typography
- **Primary typeface**: Plus Jakarta Sans (max 2 weights, 140% word spacing)

### Colors
- **Diligent Red**: `#EE312E`
- **Grays**: Gray1 `#F3F3F3`, Gray2 `#DADADA`, Gray3 `#A0A2A5`, Gray4 `#6F7377`, Gray5 `#282E37`
- **Secondary** (data viz only): Blue3 `#0B4CCE` (hyperlinks), others for charts only
- **Hyperlinks**: Blue3 `#0B4CCE`, no underline
- **CTAs**: Diligent Red, sentence case, medium weight

### Icons
- Material Symbols Sharp, Fill 0, Weight 400, Grade 0, Optical 48px

---

## Rich Text Fields

Tiptap rich text (H2, H3, bold, italic, lists, hyperlinks, text colour) used in:
- Hub Settings: `heroHeading`, `heroSubheading`, `heroOverview`, `librarySectionBody`, `certificationsSectionBody`, `footerBody`
- Content type description fields (all four types)

Rendered via `SafeHtml` component (DOMPurify). List styling via `.rich-text` CSS class.

---

## Remaining To Build

1. **Amplitude analytics** — awaiting API key from team
2. **Marketo integration** — gate form stores locally; awaiting credentials
3. **Reporting dashboard** (`/admin/reporting`) — currently 404
4. **Feedback system** — post-completion star rating + monthly email digest
5. **Structured data / JSON-LD** — partially done; needs completion
6. **Accessibility audit** — WCAG 2.1 AA
7. **Credly learning path testing** — completion flow not yet verified end-to-end

---

## Pending Team Decisions

- Navigation bar: possible Topics dropdown, Profile → "Request a demo" CTA
- Content re-tagging with new taxonomy (manual work via admin dashboard)
- Homepage: further design refinements ongoing

---

## Key File Locations

| File | Purpose |
|---|---|
| `app/(hub)/page.tsx` | Homepage |
| `app/(hub)/library/page.tsx` | Full resource library |
| `components/hub/HomepageContent.tsx` | Client wrapper for org type state |
| `components/hub/PopularWidget.tsx` | Most popular widget |
| `components/hub/SubjectGroupWidget.tsx` | Per-subject-group widget |
| `components/hub/HorizontalCardScroller.tsx` | Reusable horizontal card row |
| `components/hub/subjectGroupConfig.ts` | Icon/description config |
| `components/hub/SiteHeader.tsx` | Navigation bar |
| `components/hub/SiteFooter.tsx` | Dark footer |
| `components/hub/ContentCard.tsx` | Content card (standard + compact variants) |
| `components/hub/ResourceLibrary.tsx` | Filterable content grid |
| `components/hub/FilterSidebar.tsx` | Left sidebar filter accordion |
| `components/hub/DemoRequestForm.tsx` | Footer CTA demo form |
| `components/hub/FooterCTASection.tsx` | Footer CTA section |
| `components/hub/GateForm.tsx` | Gate form (templates, videos) |
| `components/hub/TemplateRightColumn.tsx` | Template right column state |
| `components/hub/HomepageHero.tsx` | Search hero section |
| `components/hub/OrgTypeSelector.tsx` | Org type selector bar |
| `components/content/ScormEmbed.tsx` | SCORM course overlay |
| `components/content/VidyardEmbed.tsx` | Vidyard player |
| `components/admin/RichTextEditor.tsx` | Tiptap editor |
| `components/admin/TaxonomySelect.tsx` | Taxonomy with org type validation |
| `lib/credly.ts` | Credly badge helper |
| `lib/content.ts` | Shared content mapping |
| `lib/gate-session.ts` | Gate cookie helpers |
| `lib/learner-session.ts` | Learner cookie helpers |
| `lib/related-items.ts` | Related items helper |
| `lib/scorm/` | Manifest parser, tokens, extractor |
| `prisma/seed.ts` | Database seed |
