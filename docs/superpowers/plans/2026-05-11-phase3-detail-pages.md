# Phase 3: Public Hub Content Detail Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public-facing template, video and learning path detail pages with gate forms, Vidyard embeds, progress tracking, related items widget, and admin preview mode. Course page deferred pending SCORM decision.

**Architecture:** Server-rendered detail pages at `/(hub)/[type]/[slug]` with Prisma queries. Client components for interactivity (gate form, Vidyard embed, learning path progress). Gate form submissions stored locally (Marketo wired later). Preview mode via short-lived tokens generated from admin forms.

**Tech Stack:** Next.js 14 App Router, Prisma, Tailwind CSS, Vidyard JS embed API, cookies for session/learner state.

---

### Task 1: Prisma schema additions (GateSubmission, PreviewToken) + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add GateSubmission model**

Add after the Feedback model:

```prisma
model GateSubmission {
  id           String      @id @default(cuid())
  firstName    String
  lastName     String
  email        String
  organization String
  jobTitle     String
  contentType  ContentType
  contentId    String
  createdAt    DateTime    @default(now())

  @@index([email])
  @@index([createdAt])
  @@map("gate_submissions")
}
```

- [ ] **Step 2: Add PreviewToken model**

Add after GateSubmission:

```prisma
model PreviewToken {
  id          String      @id @default(cuid())
  token       String      @unique
  contentType ContentType
  contentId   String
  expiresAt   DateTime
  createdAt   DateTime    @default(now())

  @@map("preview_tokens")
}
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name add-gate-submissions-and-preview-tokens
```

- [ ] **Step 4: Regenerate Prisma client and verify**

```bash
npx prisma generate
```

---

### Task 2: Shared utilities (Breadcrumb, view count, PreviewBanner)

**Files:**
- Create: `components/hub/Breadcrumb.tsx`
- Create: `components/hub/PreviewBanner.tsx`
- Create: `lib/view-count.ts`

- [ ] **Step 1: Create Breadcrumb component**

Semantic nav with aria-label, chevron separators, last item plain text (not linked).

- [ ] **Step 2: Create PreviewBanner component**

Fixed-top yellow banner with "PREVIEW — NOT PUBLISHED" text.

- [ ] **Step 3: Create incrementViewCount utility**

Fire-and-forget Prisma update for viewCount on the appropriate content model.

- [ ] **Step 4: Commit**

---

### Task 3: RelatedItems widget

**Files:**
- Modify: `lib/related-items.ts` — extend to return full ContentItem data
- Create: `components/hub/RelatedItems.tsx` — server component rendering up to 3 ContentCards

- [ ] **Step 1: Extend getRelatedItems to return full card data**

Fetch thumbnailUrl, thumbnailAlt, slug, accessTier, description, subjects for each related item so ContentCard can render them.

- [ ] **Step 2: Create RelatedItems server component**

Accepts sourceType + sourceId, calls extended getRelatedItems, renders 3-column grid of ContentCards. Hidden if no items.

- [ ] **Step 3: Commit**

---

### Task 4: Gate form + API route + cookie logic

**Files:**
- Create: `components/hub/GateForm.tsx` — client component
- Create: `app/api/gate/submit/route.ts` — API route
- Create: `lib/gate-session.ts` — cookie helpers

- [ ] **Step 1: Create gate-session helpers**

`hasGateSession()` reads `hub_gated_access` cookie. `setGateSession()` sets 30-day cookie.

- [ ] **Step 2: Create /api/gate/submit route**

Validates payload, stores GateSubmission in DB, sets cookie, returns success + downloadUrl (for templates).

- [ ] **Step 3: Create GateForm client component**

Fields: firstName, lastName, email, organization, jobTitle. Submits to API. On success: triggers download (if template), redirects back to learning path (if `from` param). Shows form only if no gate session cookie.

- [ ] **Step 4: Commit**

---

### Task 5: Template detail page

**Files:**
- Create: `app/(hub)/templates/[slug]/page.tsx`

- [ ] **Step 1: Build template detail page**

Server component. Fetches template by slug (PUBLISHED status or valid preview token). Increments view count. Renders breadcrumb, thumbnail, title, description, metadata, gate/download section, related items.

- [ ] **Step 2: Add generateMetadata for SEO**

Uses seoTitle, seoDescription, ogImageUrl. JSON-LD structured data.

- [ ] **Step 3: Commit**

---

### Task 6: VidyardEmbed client component

**Files:**
- Create: `components/content/VidyardEmbed.tsx`

- [ ] **Step 1: Build VidyardEmbed component**

Extracts UUID from Vidyard URL. Dynamically loads Vidyard embed script. Renders responsive 16:9 container with player div.

- [ ] **Step 2: Commit**

---

### Task 7: Video detail page

**Files:**
- Create: `app/(hub)/videos/[slug]/page.tsx`

- [ ] **Step 1: Build video detail page**

Server component. Fetches video by slug. Increments view count. Renders breadcrumb, title, gated/free embed, description, metadata, related items.

- [ ] **Step 2: Add generateMetadata with VideoObject JSON-LD**

- [ ] **Step 3: Commit**

---

### Task 8: Learner identity + progress API routes

**Files:**
- Create: `app/api/learners/identify/route.ts`
- Create: `app/api/learners/progress/route.ts`
- Create: `lib/learner-session.ts`

- [ ] **Step 1: Create learner-session helpers**

`getLearnerIdFromCookie()` and `setLearnerCookie()`.

- [ ] **Step 2: Create /api/learners/identify route**

Creates or finds Learner by email, sets cookie, returns learner ID.

- [ ] **Step 3: Create /api/learners/progress route**

POST: records item completion. GET: returns all progress for a learner + learning path.

- [ ] **Step 4: Commit**

---

### Task 9: LearningPathProgress client component

**Files:**
- Create: `components/content/LearningPathProgress.tsx`

- [ ] **Step 1: Build LearningPathProgress component**

Ordered list of items with checkboxes. Progress bar. Milestone subheadings. Mandatory/elective badges. Completion message. Learner identity form at top if not identified.

- [ ] **Step 2: Commit**

---

### Task 10: Learning path detail page

**Files:**
- Create: `app/(hub)/learning-paths/[slug]/page.tsx`

- [ ] **Step 1: Build learning path detail page**

Server component. Fetches path with items. Resolves item titles/slugs. Renders breadcrumb, title, description, metadata, LearningPathProgress, related items.

- [ ] **Step 2: Add generateMetadata with Article JSON-LD**

- [ ] **Step 3: Commit**

---

### Task 11: Preview mode (API route, token validation, admin form buttons, banner)

**Files:**
- Create: `app/api/admin/preview/route.ts`
- Create: `lib/preview.ts` — token generation + validation helpers
- Modify: `components/admin/CourseForm.tsx` — add Preview button
- Modify: `components/admin/TemplateForm.tsx` — add Preview button
- Modify: `components/admin/VideoForm.tsx` — add Preview button
- Modify: `components/admin/LearningPathForm.tsx` — add Preview button

- [ ] **Step 1: Create preview helpers**

`generatePreviewToken()` creates crypto token, stores in DB with 1-hour expiry. `validatePreviewToken()` checks token, returns content type + ID if valid.

- [ ] **Step 2: Create /api/admin/preview route**

POST: requires admin auth, generates token, returns { token, url }.

- [ ] **Step 3: Add Preview button to all four admin forms**

Button next to Save. Calls preview API, opens new tab with preview URL.

- [ ] **Step 4: Wire preview token validation into all three detail pages**

If `?preview=token` is present, validate and fetch content regardless of status. Show PreviewBanner.

- [ ] **Step 5: Commit**
