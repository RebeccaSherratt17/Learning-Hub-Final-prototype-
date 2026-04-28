# Claude Code Prompt: Diligent Learning Hub

## Overview
Build a Learning Hub web application for Diligent (diligent.com), a governance technology organization. This is a publicly accessible resource hub that hosts free and gated educational content about corporate governance, risk and compliance (GRC) best practices. It targets governance professionals including company secretaries, board directors, executives and general counsel.

The hub will live as a separate but connected space under www.diligent.com as a subdomain (learning.diligent.com). This project uses a fully custom backend with no dependency on any third-party CMS. All content is stored in PostgreSQL and managed via a custom admin dashboard built into the Next.js application.

---

## Tech Stack
- **Frontend**: Next.js 14+ (App Router)
- **Database**: PostgreSQL via Supabase (free tier)
- **ORM**: Prisma (TypeScript-friendly database toolkit)
- **File storage**: Vercel Blob (for template file uploads and images)
- **Admin interface**: Custom `/admin` dashboard built in Next.js (replaces any third-party CMS)
- **Admin authentication**: NextAuth.js (email/password — admins log in at `/admin/login`)
- **SCORM hosting**: SCORM Cloud (courses uploaded via SCORM Cloud dashboard; embedded in hub via launch URL iframe)
- **Styling**: Tailwind CSS
- **Language**: TypeScript throughout
- **Lead management**: Marketo (REST API, server-side proxy)
- **Digital badges**: Credly (REST API, server-side proxy — for select learning paths)
- **Deployment target**: Vercel

**Important architecture note**: This project uses a fully custom backend — no third-party CMS (e.g. Sanity, Contentful, Storyblok) is used. All content is stored in PostgreSQL and managed via the custom `/admin` dashboard. This gives Diligent complete ownership and control of all data with no dependency on external CMS platforms.

---

## Content Types

Build database models (Prisma schema) and frontend templates for four content types:

### 1. Courses
- Each course is a single self-contained SCORM file, uploaded to SCORM Cloud via their dashboard (not via the admin dashboard)
- In the admin dashboard, admins store the course metadata and the SCORM Cloud course ID — the hub uses this ID at launch time to generate an embed link via the SCORM Cloud API
- The learner never leaves the hub site and never sees SCORM Cloud — the full experience is branded and on-domain (see the SCORM Integration section below for the complete technical flow)
- SCORM completion data (completion status, score, time spent) is posted back to the hub automatically by SCORM Cloud when a learner finishes — used for analytics reporting only at this stage
- Fields: title, slug, description, SCORM Cloud course ID, thumbnail image (with alt text), subject tags, persona tags, region tags, access tier (free/gated/premium), author, published date, estimated duration, related items, restricted (boolean), access token (generated in admin dashboard), restricted access note (internal), status (draft/scheduled/published/archived), scheduled publish date, SEO meta title, SEO meta description, Open Graph image

### 2. Templates
- Downloadable files: Word (.docx), Excel (.xlsx) and PDF formats
- Always gated — before downloading, the learner must submit a form (name, email, organization, job title) which is sent to Marketo via the same server-side proxy route used for all other gated content; the file download is only served after a successful Marketo submission
- Fields: title, slug, description, file asset (stored in Vercel Blob), subject tags, persona tags, region tags, access tier, thumbnail image (with alt text, stored in Vercel Blob), related items, status (draft/scheduled/published/archived), scheduled publish date, SEO meta title, SEO meta description, Open Graph image

### 3. Videos
- Embedded Vidyard videos (not hosted locally — embed by Vidyard share URL or embed code)
- Can be free or gated
- Fields: title, slug, Vidyard embed URL/ID, description, subject tags, persona tags, region tags, access tier, duration, thumbnail image (with alt text, stored in Vercel Blob), related items, status (draft/scheduled/published/archived), scheduled publish date, SEO meta title, SEO meta description, Open Graph image

### 4. Learning Paths
- Curated collections linking to a mix of content types (courses, templates, videos) on a shared topic, manually assembled by admins in the admin dashboard
- Example: "ESG Essentials" might link to an ESG course, then an ESG template, then an ESG video — presented as an ordered list on a single focused page
- Completion tracking is a core requirement, not a nice-to-have: the hub must track which individual learners have started and completed each item in a learning path, tying progress to a named, identified learner (captured via name and email at the point they begin the path) rather than recording anonymous aggregate counts only
- When a learner starts a learning path, capture their name and email (if not already captured via a gate form for that session) and associate all subsequent item completions in that path with their identity
- Item completion should be inferred per content type: for courses, completion comes from the SCORM Cloud postback; for templates, completion is recorded on successful download; for videos, completion is recorded when the Vidyard player signals the video has ended
- Fields: title, slug, description, ordered list of content item references, subject tags, persona tags, region tags, access tier, estimated completion time, related items, Credly badge template ID (optional — only populate for paths that should award a badge), status (draft/scheduled/published/archived), scheduled publish date, SEO meta title, SEO meta description, Open Graph image

---

## Taxonomy / Filtering System

All content items should be taggable with the following filter dimensions. Build these as relational database tables in Prisma:

**Content Type** (auto-derived): Course, Template, Video, Learning Path

**Persona**:
- Board Director
- Executive Management
- Company Secretary
- General Counsel
- Practitioner
- Risk
- Legal

**Region**:
- Global
- USA
- UK
- EU
- APAC

**Subject** (grouped):
- Board Leadership & Operations: Board governance, meetings, structure, agendas, board committees, evaluations, director onboarding, compensation, financials, meeting minutes
- Risk: ERM, cybersecurity, AI, ESG, market risk
- Regulations & Compliance: Compliance, ESG
- Entity Management: Entity management, subsidiaries
- Organization Type: Public company, private company, nonprofit

---

## Access Tiers

Three content tiers must be supported:

1. **Free**: Accessible to all visitors — no gate
2. **Gated**: Requires a lead capture form before access is granted
3. **Premium**: Requires a Diligent One Platform (D1P) subscription — display a CTA to request a D1P demo for this tier

### Gating & Marketo Integration

For gated assets, display a form (name, email, organization, job title) before granting access. On submission, send the lead data to Marketo via a server-side Next.js API route — never call the Marketo API directly from the browser, as this would expose credentials to the client.

The API route should submit to Marketo using the Marketo REST API. Work with the Diligent marketing ops team before implementation to confirm:
- Marketo instance URL and Munchkin ID
- The correct Marketo form ID
- The Marketo program and list the hub leads should flow into (to be passed as hidden fields on submission)
- API client credentials (client ID and client secret)

All Marketo credentials must be stored as environment variables and never hardcoded:

```
MARKETO_BASE_URL=
MARKETO_CLIENT_ID=
MARKETO_CLIENT_SECRET=
MARKETO_FORM_ID=
MARKETO_PROGRAM_NAME=
MARKETO_LIST_NAME=
```

After a successful Marketo submission, store a session cookie so returning visitors are not re-gated on subsequent visits. The session cookie should have a 30-day expiry — long enough that returning visitors are not repeatedly interrupted by gate forms, while remaining consistent with standard cookie consent and privacy policy disclosures.

---

## Hub Homepage

The hub homepage is structured as a series of distinct sections, in the following order from top to bottom. All copy below is confirmed and should be used verbatim unless marked otherwise.

---

### Section 1: Hero

- **Heading**: Diligent Learning Hub
- **Subheading**: Explore educational courses, ready-to-use templates, and videos to develop your expertise and enhance board effectiveness across key governance, risk, and compliance topics.
- **Overview text**: Our Learning Hub brings together practical tools and expert insights to help business leaders strengthen their governance, risk, and compliance practices. Here, you'll find a curated collection of ready-to-use templates, professionally crafted courses and videos drawn from our premium eLearning platform, the Education & Templates Library.

  Whether you're building foundational frameworks or refining board operations, these resources are designed to save time and improve effectiveness.
- **Content type signpost links** (displayed as four short highlighted items below the overview text, each linking to the relevant filtered view of the content library):
  - Courses → Master essential GRC topics through targeted short courses.
  - Templates → Access professionally crafted and ready-to-use templates that accelerate your governance initiatives.
  - Videos → Watch interviews with industry experts and animated content breaking down complex principles into digestible, memorable formats.
  - Learning Paths → Access curated sets of content on a given topic, helping you build skills with clarity and confidence.

---

### Section 2: Popular & Featured Content

- **Section heading**: Jump in: Popular and featured content
- Two side-by-side widgets displayed here:
  - **Widget 1 — Most popular**: The top 3 most popular content items this month, ranked by total views. Pulled automatically from analytics data — not manually curated
  - **Widget 2 — Newest**: The 3 most recently published content items. Pulled automatically from the database by published date — not manually curated
- Each item in both widgets displays as a content card (thumbnail, content type badge, title, short description)
- Both widgets must update automatically as new content is published or view counts change — no manual admin intervention required

---

### Section 3: Educational Partners

- **Section heading**: Our educational partners
- A slowly auto-scrolling horizontal row of partner organisation logos
- Logos are uploaded via the admin dashboard and stored in Vercel Blob, with an optional link URL per logo, so the team can add, remove or reorder them without developer help
- The row should loop continuously and pause on hover
- Logo image files will be provided separately by the Diligent team

---

### Section 4: Full Resource Library

- **Section heading**: Full resource library
- The complete filterable content library grid, with the following filters:
  - **Search bar**: Keyword search on content item title
  - **Content type**: Template, Course, Video, Learning Path
  - **Persona**: Board Director, Executive Management, Company Secretary, General Counsel, Practitioner, Risk, Legal
  - **Region**: Global, USA, UK, EU, APAC
  - **Subject** (grouped):
    - Board Leadership & Operations: Board governance, meetings, structure, agendas, board committees, evaluations, director onboarding, compensation, financials, minutes
    - Risk Management: ERM, cybersecurity, AI, ESG, market risk
    - Regulations & Compliance: Compliance, ESG, IPO
    - Entity Management: Entity management, subsidiaries
    - Organization Type: Public company, private company, nonprofit
- All filters are multi-select and update results in real time without a page reload
- **Default sort order**: Newest first (by published date) — this ensures fresh content always surfaces at the top and prevents the same popular items dominating the library permanently
- **Sort dropdown**: A visitor-controlled sort control at the top of the library with three options: Newest (default), Most popular (by total views), and A–Z (alphabetical by title). The selected sort persists while the visitor is on the page but resets to Newest on a fresh visit
- The popular content widget in Section 2 of the homepage already surfaces the most-viewed items prominently — the library sort does not need to duplicate this function, which is why Newest is the preferred default
- Content cards display: thumbnail, content type badge, title, short description, access tier indicator (free/gated/premium), subject tags
- Restricted courses (token-gated) must not appear in this library
- **Pagination**: The content library displays 15 items per page, arranged in a 3-column grid. Numbered page navigation is shown below the grid (e.g. 1, 2, 3 ... 12) allowing visitors to jump to any page directly. The current page number should be reflected in the URL (e.g. `?page=2`) so visitors can share or bookmark a specific page, and so the browser back button returns them to the correct page rather than the first. When a visitor changes a filter or sort option, the library resets to page 1

---

### Section 5: Got Questions?

- **Section heading**: Got questions?
- **Body text**: We're here to help! If you have any questions about our educational resources, email certifications@diligent.com
- The email address should be a clickable mailto link

---

### Section 6: Professionally-Accredited Certifications

- **Section heading**: Professionally-accredited certifications
- **Body text**: Empower your business to achieve governance excellency. With Diligent One Platform, you can unlock unlimited access to Diligent's Education & Templates Library, featuring 600+ educational courses, templates and videos, alongside six professionally-accredited certifications.
- Six certification badge graphics displayed in a row, each linking to its respective Diligent webpage. Badge image files will be provided by the Diligent team. The six badges and their destination URLs are:
  - Cyber Risk Strategy & Leadership → https://www.diligent.com/platform/cyber-risk-strategy-leadership-certification
  - AI Ethics & Board Oversight → https://www.diligent.com/platform/ai-ethics-board-oversight-certification
  - Climate & Sustainability Strategy → https://www.diligent.com/platform/climate-and-sustainability-strategy-certification
  - Human Capital, Compensation & Culture → https://www.diligent.com/platform/human-capital-compensation-and-culture-certificate
  - Board Leadership (link TBC — to be confirmed by Diligent team)
  - Enterprise Risk Management → https://www.diligent.com/platform/enterprise-risk-management-certification
- Badge images and links must be manageable via the admin dashboard so the team can update URLs or swap images without developer help

---

### Section 7: Footer CTA

- **Section heading**: Upskill your board today
- **Body text**: Empower directors and executives with best practice education, templates and certifications — so every meeting is prepared, compliant and impactful.
- **CTA button**: Request a demo (links to the Diligent demo request URL — to be confirmed by the Diligent team and stored in Hub Settings in the admin dashboard so it can be updated without a code change)

---

### Homepage notes for implementation

- The "Education & Templates Library" text in Sections 1 and 6 should link to https://www.diligent.com/solutions/board-education
- One URL in the certifications section (Board Leadership certification) is TBC — build the badge component to gracefully handle a null/empty URL (e.g. display the badge without a link until the URL is added in the admin dashboard)
- All section headings, body copy and CTA text must be editable via the Hub Settings page in the admin dashboard (`/admin/settings`) — the team should not need a developer to update homepage copy
- The popular content widget pulls from a `viewCount` field stored in the PostgreSQL database, incremented on each content item page load — this is simpler than a GA4 dependency and gives immediate results

---

## Content Item Pages

Each content type needs its own page template:

- **Courses**: Course detail page showing title, description, duration and metadata. Below the metadata, a "Start course" button triggers the SCORM launch flow (see SCORM Integration section). The course opens in a fullscreen overlay or large modal iframe — still on the hub's URL. When the learner exits or completes the course, the overlay closes and the page displays a completion message. Related items widget below
- **Templates**: Preview/description page with a download CTA that triggers the gate flow; file download served via Vercel Blob URL after gate is passed
- **Videos**: Vidyard embed (responsive), description, related items widget
- **Learning Paths**: Focused topic page with an ordered list of content items, each with a checkbox that updates when the learner completes that item. Progress is tied to the learner's identity (name and email captured at path start). A completion message is shown when all items in the path are done

All content pages should include:
- Social sharing buttons (LinkedIn, X/Twitter) — nice-to-have
- Related items widget: 3 items with matching subject tags from the database, or manually selected in the admin dashboard
- A sticky "Request a D1P demo" CTA visible on gated/premium content
- Custom slugs set in the admin dashboard (auto-generated from title but editable)

### Restricted Courses (Token-Based Access)

Some courses may be flagged as restricted — custom content built for a specific client, cohort or organisation that should not be publicly accessible on the hub.

**In the admin dashboard**
- A checkbox on the course edit page: "Restrict access to specific learners"
- A text field for admins to add a note about who this course is for (e.g. "Acme Corp board directors") — for internal reference only
- A "Generate access token" button in the admin dashboard that creates a unique, permanent access token for that course and stores it in the database

**How it works**
- When a course is restricted, its page is not discoverable via the hub index, search or filters — it is only accessible via a direct token URL
- The admin copies the generated token URL (e.g. `/courses/my-course?token=abc123`) and shares it manually with the intended learners via email or another channel
- When a learner lands on the URL, the hub validates the token server-side against the course record. If valid, they are taken straight into the course with no additional form or friction
- Tokens do not expire — they remain valid indefinitely unless manually revoked by an admin in the admin dashboard
- Multiple learners can share the same token link — individual learner tracking is not required for restricted courses
- If the token is missing or invalid, the learner sees a "this link is not valid" message and is not shown any course content

**What needs to be built**
- A `restricted` boolean field and `accessToken` field on the course database model
- A token generation utility (a cryptographically random string) triggered from the course edit page in the admin dashboard
- A `/api/token/validate` server-side endpoint that checks the token in the URL against the course record in the database
- Logic on the course page to gate all content rendering behind a valid token before displaying anything
- A revocation mechanism in the admin dashboard — admins can clear and regenerate a token to invalidate the old link

### Gated Templates Within Learning Paths

When a learning path contains a gated template, the learner will encounter the Marketo gate form mid-path. This is intentional — capturing every individual gate form submission in Marketo is a priority, so the gate is not bypassed even within a learning path context.

To minimise friction, implement the following flow:

1. The learner is progressing through a learning path and clicks on a gated template item
2. They are taken to the template page where the Marketo gate form is displayed as normal
3. The template page must be aware it was accessed from a learning path — pass the learning path slug and the learner's current progress as URL parameters (e.g. `/templates/my-template?from=learning-path-slug`)
4. After a successful Marketo form submission, the file download is triggered automatically
5. The learner is then automatically redirected back to the learning path page (`/learning-paths/learning-path-slug`) with their progress intact and the template item marked as complete
6. If the learner navigates to the template page directly (not from a learning path), the standard gate flow applies with no redirect back to a learning path

The `from` parameter must be validated server-side before being used in a redirect — do not redirect to arbitrary URLs to prevent open redirect vulnerabilities.

### Vidyard Embeds
Vidyard uses a JavaScript embed rather than a standard iframe. Build a dedicated `VidyardEmbed` client component in Next.js that loads the Vidyard embed script dynamically. Do not attempt to embed Vidyard videos via a plain iframe.

---

## SCORM Integration

Courses must be delivered via SCORM Cloud's API-embedded approach. The learner never leaves the hub and never sees SCORM Cloud at any point — the entire experience stays on Diligent's domain and branding.

### What the learner sees
1. They browse the hub and find a course they want to take
2. A form on the course page asks for their name and email (hub design and branding — not a SCORM Cloud page)
3. They click "Start course"
4. The course opens in a fullscreen overlay or modal iframe — the browser URL remains the hub's URL throughout
5. On completion, the overlay closes and the hub displays a completion confirmation message
6. They never see SCORM Cloud at any point

### What happens behind the scenes

The "Start course" button triggers a server-side API route (not a client-side call — SCORM Cloud credentials must never be exposed to the browser). That route makes two calls to the SCORM Cloud REST API:

**Call 1 — Create a registration**

Send the learner's name, email and the course ID to SCORM Cloud:

```json
{
  "courseId": "my_course_id",
  "registrationId": "my_reg_id",
  "learner": {
    "id": "my_learner_id",
    "firstName": "Jane",
    "lastName": "Smith"
  }
}
```

Include a `postbackUrl` pointing to the hub's `/api/scorm/postback` endpoint — SCORM Cloud will POST completion data here when the learner finishes, so the hub receives results without making a separate API call.

Also include a `redirectUrl` pointing back to the course page (or a dedicated completion page) so that when the learner exits the course player, SCORM Cloud returns them to the hub rather than its own interface.

**Call 2 — Get a launch link**

Request a launch URL from SCORM Cloud for the registration just created. SCORM Cloud returns a time-limited URL that opens directly to the course content.

**Critical:** Do not embed the launch URL in the page at load time. Launch URLs are only valid for approximately 15 minutes after generation. Generate the launch URL at the moment the learner clicks "Start course" — not when the page loads — to avoid expiry errors.

Drop the returned URL into the iframe or fullscreen overlay on the page.

### What to build

Four things are needed:

1. **Name/email form on the course page** — collects learner identity before launch; submits to the backend endpoint
2. **`/api/scorm/launch` endpoint** — server-side route that calls the SCORM Cloud API to create a registration and return a launch URL; triggered at click time, not page load
3. **`ScormEmbed` client component** — fullscreen overlay or large modal containing an iframe that loads the launch URL returned by the endpoint; should be dismissible and handle exit gracefully
4. **`/api/scorm/postback` endpoint** — receives the completion POST from SCORM Cloud (completion status, score, time spent) and forwards the data to the analytics layer

### Notes
- All SCORM Cloud API calls must be made server-side. Credentials must never be sent to the browser
- The `registrationId` should be a combination of the learner's ID and the course ID to ensure uniqueness and idempotency (avoid creating duplicate registrations for the same learner/course pair)
- The postback endpoint should verify the request origin before processing (SCORM Cloud supports a shared secret for postback verification)

---

## Credly Badge Integration

Select learning paths can be configured to automatically award a Credly digital badge and PDF certificate of completion to the learner when they finish all items in the path. Not all learning paths will use this — only those explicitly configured by an admin in the admin dashboard.

**What the learner experiences**
When they complete the final item in a badge-enabled learning path, they receive an email from Credly containing their digital badge and a link to their PDF certificate of completion. From the Credly email they can share the badge directly to LinkedIn. They do not need a Credly account to receive or share the badge.

**In the admin dashboard**
- A `credlyBadgeId` field on the learning path edit page — admins paste in the Credly badge template ID for paths that should award a badge; leave blank for paths that do not
- Badge template IDs are set up in the Credly dashboard by an admin before being entered into the admin dashboard — this is a one-time setup step per badge type, done outside the codebase

**What needs to be built**
- A `credlyBadgeId` field on the learning path database model (optional string — if blank, no badge is issued)
- A `/api/credly/issue` server-side endpoint that calls the Credly REST API to issue a badge; accepts a learner email address and badge template ID; Credly credentials must never be exposed to the browser
- Hook the Credly endpoint into the learning path completion event: when all items in a path are completed by an identified learner, check if a `credlyBadgeId` exists for that path — if yes, call `/api/credly/issue`; if no, do nothing
- Ensure the learner's email address captured at learning path start is reliably available and passed to the Credly endpoint at the point of full path completion

**Credly credentials**
Store as environment variables — never hardcode:

```
CREDLY_API_KEY=
CREDLY_ORGANIZATION_ID=
```

**Notes**
- All Credly API calls must be made server-side
- If the Credly API call fails, log the error and retry — do not silently drop badge issuance failures
- Credly handles all badge email delivery, hosting and PDF certificate generation; the hub does not need to build any of this

---

## Admin Dashboard

The hub has a fully custom admin dashboard at `/admin` — a password-protected area of the hub itself where authorised Diligent team members can manage all content and settings without requiring developer involvement. This replaces any third-party CMS.

### Authentication
- Admins log in at `/admin/login` using email and password via NextAuth.js
- Admin accounts are stored securely in the PostgreSQL database with bcrypt-hashed passwords
- Non-authenticated users attempting to access any `/admin` route are redirected to `/admin/login`
- An initial admin account should be seeded via a database seed script so the team can log in immediately after deployment

### Admin dashboard pages
Build the following pages within the `/admin` section:

- **`/admin`** — Dashboard overview showing key stats (total content items by type, recent additions, pending scheduled items)
- **`/admin/courses`** — List, create, edit, publish, archive and delete courses
- **`/admin/templates`** — List, create, edit, publish, archive and delete templates (with file upload via Vercel Blob)
- **`/admin/videos`** — List, create, edit, publish, archive and delete videos
- **`/admin/learning-paths`** — List, create, edit, publish, archive and delete learning paths (with ordered item management)
- **`/admin/taxonomy`** — Manage personas, regions and subjects (create, edit, delete filter values without developer help)
- **`/admin/settings`** — Hub Settings (global copy, CTA URLs, demo link, featured content)
- **`/admin/partners`** — Manage educational partner logos (upload via Vercel Blob, reorder, delete)
- **`/admin/badges`** — Manage certification badge images and links
- **`/admin/redirects`** — Manage 301 redirects (source path → destination path)
- **`/admin/reporting`** — Reporting dashboard (see Reporting & Analytics section)

### Content management features
- **Scheduling**: Admins can set a future `publishedAt` date and time on any content item — scheduled items are not publicly visible until their publish time is reached
- **Draft/published state**: All content items have a status field (draft, scheduled, published, archived) — only published items appear on the public hub
- **Archive without delete**: Admins can archive content items to remove them from the public hub without permanently deleting them; archived items remain manageable in the admin dashboard
- **Archive warnings**: When archiving a content item that is referenced by one or more learning paths, display a warning listing the affected learning paths
- **Content preview**: Admins can preview how a content item will look on the hub before publishing via a preview link that opens the hub in draft mode
- **Duplicate/clone**: Admins can clone an existing content item as a starting point for a new one
- **Bulk actions**: Admins can archive, unpublish or change the access tier of multiple content items at once via checkboxes
- **Content relationships**: When viewing a course or other content item, show which learning paths it appears in
- **Media library**: Admins can browse and reuse previously uploaded images and files rather than re-uploading each time
- **Revision history**: Store a revision log for each content item so admins can see previous versions

### Admin UI design
- The admin dashboard should be clean, functional and clearly distinct from the public hub — it does not need to follow the Diligent consumer brand guidelines but should be professional and easy to use
- Use a simple sidebar navigation layout
- All forms should have clear validation, error messages and success confirmations
- Tables of content items should be sortable and searchable
---

## Reporting & Analytics

Implement event tracking ready for Google Analytics 4 (GA4). Track:
- Hub page visits
- Most visited pages across the hub (tracked automatically via GA4)
- Traffic sources — where visitors arrive from (organic search, direct, social, email, referral — tracked automatically via GA4)
- Bounce rate and time on page for hub homepage and content pages (tracked automatically via GA4)
- Return visitor rate — how many visitors return to the hub more than once (tracked automatically via GA4)
- Device type breakdown — desktop vs mobile vs tablet (tracked automatically via GA4)
- Content item clicks (by type: course / template / video / learning path)
- Internal search queries — what terms visitors type into the hub search bar (requires explicit instrumentation: fire a custom GA4 event containing the search term each time a search is performed)
- Filter usage — which filters are applied most frequently in the content library, broken down by filter type (persona, region, subject, content type); requires explicit instrumentation: fire a custom GA4 event each time a filter is applied, capturing the filter type and value selected
- Video page opens (tracked on page load for each video content item)
- Video play events (tracked via the Vidyard player API if Vidyard exposes a play event callback — confirm availability in Vidyard's JavaScript API documentation before implementing; do not block the analytics integration on this if unsupported)
- Video drop-off point (the percentage through the video at which a learner stopped watching — tracked via the Vidyard player API if a progress or seek event callback is available; confirm support in Vidyard's JavaScript API documentation before implementing; do not block the analytics integration on this if unsupported)
- Template page opens (tracked on page load for each template content item)
- Template downloads
- Gate form abandonment on template pages (tracked when the name/email form is displayed but not submitted — i.e. the form renders but no successful Marketo submission follows within the session)
- Demo CTA clicks ("Request a D1P demo")
- Gate form submissions
- Course page opens (tracked on page load for each course content item)
- Gate form abandonment on course pages (tracked when the name/email form is displayed but not submitted — i.e. the form renders but no successful Marketo submission follows within the session)
- Course enrollment events (when an identified learner clicks "Start course" and a SCORM Cloud registration is successfully created — capture learner name, email and course ID)
- Course completion events (received from SCORM Cloud via postback)
- Learning path item completion events (per content type: SCORM postback for courses, download confirmation for templates, Vidyard end event for videos) — all tied to the identified learner's name and email
- Learning path fully completed events (all items in the path checked off by an identified learner)
- Learning path partial completion rate (track the number of items completed per learner per path, so the reporting dashboard can surface what percentage of learners complete some but not all items — calculated from the gap between item completion events and full path completion events)

Use a lightweight analytics abstraction layer so the tracking provider can be swapped without rewriting call sites.

Build a `/admin/reporting` page with two modes:

**Scheduled reporting (monthly digest)**
A summary of the key metrics below is automatically emailed to the hub admin team on the first day of each month, covering the previous month's data. Implement via a Vercel Cron job or equivalent scheduled function.

**On-demand reporting (self-serve dashboard)**
Admins can visit `/admin/reporting` at any time to pull current data without waiting for the monthly digest. The dashboard must include:
- Date range picker — admins can select any custom date range (e.g. last 7 days, last 30 days, a specific month, or a fully custom from/to date) and all metrics on the page update accordingly
- Export to CSV — a button to download the currently displayed data as a CSV file for use in Excel or Google Sheets
- The following metrics, all filterable by the selected date range:
  - Total hub visits
  - Most visited pages
  - Traffic sources breakdown
  - Top 10 content items by views
  - Template downloads
  - Demo CTA clicks
  - Gate form submissions and abandonment rate
  - Course enrollments and completions
  - Learning path partial and full completion rates
  - Internal search queries (most common terms)
  - Filter usage breakdown

All data should pull from the GA4 Data API where available, supplemented by any custom event log stored in the PostgreSQL database for hub-specific events that GA4 does not capture natively.

---

## Feedback System

Upon completion of any content item (course, template, video or learning path), display a pop-up feedback widget to the learner. The widget must include:
- A star rating (1–5)
- A free-text comment box encouraging written feedback

Feedback responses should be collated and automatically emailed to certifications@diligent.com on a monthly cadence. Implement this as a scheduled digest: store each feedback submission in the PostgreSQL database, then use a cron job or scheduled function (e.g. Vercel Cron) to compile all submissions from the past month into a summary email and send it on the first day of each month.

The feedback pop-up should:
- Appear once per content item per learner session — do not show it again if the learner has already submitted feedback for that item in the current session
- Be dismissible — learners should be able to close it without submitting
- Not block access to the related items widget or any other page content

---

## Mobile Accessibility

The hub must be fully responsive and easy to navigate on mobile devices. This is a core requirement, not a nice-to-have. All pages — including the hub homepage, content library grid, filtering UI and all four content item page templates — must be usable on small screens without horizontal scrolling, broken layouts or inaccessible touch targets.

Specific considerations:
- The content library filter bar should collapse into a mobile-friendly drawer or accordion on small screens
- SCORM course iframes should be as large as the viewport allows on mobile, with clear instructions if the learner needs to rotate their device for the best experience
- Vidyard embeds must be responsive
- All tap targets (buttons, links, filter options) must meet minimum touch target size guidelines (at least 44x44px)
- Test layouts at 375px (iPhone SE), 390px (iPhone 14) and 768px (iPad) breakpoints as a minimum

---

## Nice-to-Haves (flag as future phases if not implemented now)


---

## SEO & Discoverability

The hub is a public-facing top-of-funnel asset and must be built with SEO as a core consideration, not an afterthought.

- **Per-item meta fields in admin dashboard**: Every content item (course, template, video, learning path) must have editable SEO fields in the admin dashboard — meta title, meta description, and canonical URL. These should be separate from the display title and description so admins can optimise them independently
- **Open Graph tags**: All content item pages and the hub homepage must include Open Graph and Twitter Card meta tags so that when a page is shared on LinkedIn, X or other platforms, it renders with the correct title, description and thumbnail image
- **Sitemap**: Auto-generate a `sitemap.xml` at `/sitemap.xml` that includes all published content item URLs, updated dynamically as new content is published or unpublished. Submit to Google Search Console
- **Robots.txt**: The `robots.txt` must be environment-aware. On production, allow crawling of all public hub pages and explicitly disallow restricted course pages (token-gated URLs) and the `/admin/` route. On staging, disallow all crawling (`Disallow: /`) — see the Environments section
- **Structured data**: Add JSON-LD structured data markup to content item pages where appropriate — `Course` schema for courses, `VideoObject` for videos, `Article` for learning paths
- **Semantic HTML**: Use correct heading hierarchy (one `h1` per page, logical `h2`/`h3` structure) and semantic HTML elements throughout to support both SEO and accessibility

---

## Error States & Empty States

Every user-facing failure or empty condition must have a designed, intentional response. Do not leave these as blank pages or unhandled errors.

- **Search returns no results**: Display a friendly message with the search term echoed back (e.g. "No results found for 'cybersecurity'") and suggest clearing filters or browsing all content
- **Filter combination yields no results**: Display a message explaining no content matches the current filters, with a prompt to adjust or clear filters
- **SCORM launch fails**: If the SCORM Cloud API call fails or returns an error, display a clear message to the learner explaining the course could not be launched, with a prompt to try again or contact support — do not show a broken iframe or a blank overlay
- **Marketo submission fails**: If the gate form Marketo API call fails, display an error message and allow the learner to retry — do not silently drop the submission or grant access without a successful submission
- **Token validation fails**: If a restricted course token is missing, invalid or does not match the course, display a clear "this link is not valid" message — do not expose any course content or metadata
- **Credly badge issuance fails**: Log the error server-side and retry — do not silently drop badge issuance failures; consider a fallback notification to certifications@diligent.com if retries are exhausted
- **General 404 page**: A branded 404 page for any URL that does not exist on the hub, with a link back to the hub homepage
- **General 500 page**: A branded error page for unexpected server errors

---

## Cookie Consent & Privacy Compliance

The hub collects personal data via gate forms, fires GA4 analytics events, and stores session cookies. Given diligent.com serves a global audience including EU visitors, GDPR compliance is required.

- **Cookie consent banner**: Display a cookie consent banner on first visit that clearly explains what cookies and tracking are used. Visitors must be able to accept or decline non-essential cookies (analytics, tracking) before any GA4 events fire. Do not fire GA4 tracking events until consent is given
- **Consent persistence**: Store the visitor's consent choice in a cookie so the banner does not reappear on subsequent visits within a reasonable window (e.g. 12 months)
- **Consent-aware analytics**: GA4 initialisation must be conditional on cookie consent — use GA4's consent mode or equivalent to ensure tracking only activates after the visitor accepts
- **Privacy policy link**: Every gate form and the cookie consent banner must include a visible link to Diligent's privacy policy (URL to be confirmed with the Diligent legal team)
- **Data minimisation**: Gate forms should collect only what is necessary (name, email, organization, job title) — do not add additional fields without a clear reason
- **Session cookies**: Document which cookies the hub sets, their purpose and their expiry, so this information can be included in Diligent's cookie policy

---

## Content Preview

Admins must be able to preview how a content item will look on the public hub before publishing it.

- Each content item edit page in the admin dashboard must include a "Preview" button
- Clicking Preview opens a new browser tab showing the content item rendered in the public hub layout, clearly labelled with a "PREVIEW — NOT PUBLISHED" banner so admins cannot mistake it for the live page
- Preview works by passing a short-lived preview token in the URL (e.g. `?preview=abc123`) that the hub checks server-side before rendering draft content
- Preview must work for all four content types (courses, templates, videos, learning paths)

---

## Image Handling & Optimisation

All thumbnail images for content cards and content item pages are uploaded via the admin dashboard and stored in Vercel Blob. The following standards apply throughout:

- **Recommended thumbnail dimensions**: 1200x675px (16:9 aspect ratio) — display this as a guideline note on the image upload field in the admin dashboard; store the image dimensions and allow admins to specify a focal point for cropping
- **Next.js Image optimisation**: All images rendered on the hub must use the Next.js `<Image>` component with appropriate `width`, `height` and `sizes` attributes to enable automatic format conversion (WebP), lazy loading and responsive sizing — never use a plain `<img>` tag for content images
- **Vercel Blob URLs**: Images are served directly from Vercel Blob CDN URLs — use these URLs in the Next.js `<Image>` component; add `*.blob.vercel-storage.com` to the allowed image hostnames in `next.config.js`
- **Alt text**: Every image upload field in the admin dashboard must have a corresponding alt text input field, and alt text must be rendered on all `<Image>` components — do not leave alt attributes empty
- **Fallback image**: Define a default fallback thumbnail image for content items that do not have a thumbnail uploaded, so content cards never render with a broken or missing image

---

## Accessibility

The hub must meet WCAG 2.1 AA accessibility standards. This is a core requirement given the audience includes board directors and executives who may be older, and because diligent.com operates in regulated environments where accessibility obligations may apply.

- **Keyboard navigation**: All interactive elements (navigation, filters, buttons, form fields, modals, the SCORM overlay) must be fully operable via keyboard alone, with visible focus indicators at all times
- **Screen reader compatibility**: Use semantic HTML, ARIA labels and ARIA roles where necessary to ensure all content and interactions are accessible to screen reader users. In particular, the filter bar, gate modal, feedback pop-up and SCORM overlay must be correctly announced
- **Colour contrast**: All text must meet WCAG AA contrast ratios against its background — pay particular attention to Diligent's navy (#0C2340) and teal (#00B388) used against white and against each other
- **Form accessibility**: All form fields must have associated `<label>` elements, clear error messages that are announced to screen readers, and no reliance on colour alone to communicate validation state
- **Motion**: Respect the `prefers-reduced-motion` media query — any animations or transitions should be suppressed or reduced for users who have enabled this setting
- **Testing**: Run an automated accessibility audit (e.g. using axe-core or Lighthouse) before considering any page complete, and resolve all WCAG AA violations

---

## Content Archiving & Unpublishing

Admins must be able to take content offline without permanently deleting it. This is particularly important for compliance and regulatory content that may become outdated when laws or regulations change.

- **Archive status**: Add an `archived` boolean field (or use the status field) to all four content type database models. Archived content is immediately removed from the public hub (index, search, filters, related items widgets) but remains in the admin dashboard and can be restored at any time
- **Unpublishing**: Admins must be able to unpublish a content item (revert it to draft state) from Studio without deleting it — this should be clearly distinguished from archiving: unpublished content is a work in progress, archived content is deliberately retired
- **Archived content visibility in Studio**: Archived content items should be visually flagged in the admin dashboard (e.g. with an "Archived" badge) so admins can easily identify and manage them
- **No broken links**: When a content item is archived or unpublished, any learning paths that reference it should display a graceful fallback for that item rather than a broken link — flag this as a Studio warning when an admin archives a content item that is referenced by one or more learning paths

---

## Design & Brand

The hub must adhere to Diligent's official brand guidelines throughout. All design decisions — typography, color, iconography, imagery and CTAs — must follow the standards below precisely.

---

### Typography

- **Primary typeface**: Plus Jakarta Sans — use this exclusively throughout the hub
- **Weights**: Use no more than two contrasting weights in conjunction at any time (e.g. Light and Medium, Light and Bold, or Regular and Bold)
- **Word spacing**: Where possible, set word spacing to 140% to aid clarity and legibility
- **Font loading**: Load Plus Jakarta Sans via Google Fonts or a self-hosted equivalent; do not fall back to system fonts for any visible UI text

---

### Color

**Primary brand color — Diligent Red**
Diligent Red is the dominant brand color and must always be present on the page, but should not be overused. Use it to draw the eye to key elements such as CTAs.
- Diligent Red: `#EE312E`
- Red 2: `#D3222A`
- Red 3: `#AF292E`
- Red 4: `#921A1D`
- Red 5: `#5F091D`

Use reds in progression starting from Diligent Red. Red 5 should be the least used. The additional red shades may be used in lens graphics or to clarify varying levels of information.

**Neutral colors**
Neutrals provide calm and balance. Use for backgrounds, textures, section dividers, type and data visualization.
- Gray 1: `#F3F3F3`
- Gray 2: `#DADADA`
- Gray 3: `#A0A2A5`
- Gray 4: `#6F7377`
- Gray 5: `#282E37`

**Secondary colors — data visualization only**
Secondary colors are reserved exclusively for charts, graphs, tables and other data visualizations. Do not use them for UI elements, backgrounds, buttons or text.
- Blue 1: `#00D3F3`
- Blue 2: `#0086FA`
- Blue 3: `#0B4CCE`
- Purple 1: `#C247FA`
- Purple 2: `#8B4BFA`
- Purple 3: `#642FCF`

When using color to differentiate data in charts or graphs, use secondary colors in progression to establish consistency. Do not use Diligent Red in charts or graphs — as the brand color, red should not be associated with data that could carry negative connotations.

**Approved color combinations for text and headlines**
- White or black headlines on Diligent Red backgrounds
- Black or Diligent Red headlines on white backgrounds
- White or Diligent Red headlines on black (Gray 5) backgrounds

Do not use color combinations outside of these approved pairings for headlines and body text.

**Hyperlinks**
All hyperlinks must be styled in Blue 3 (`#0B4CCE`) with no underline.

---

### CTAs

- CTA button text must always be in sentence case (e.g. "Request a demo", not "Request A Demo" or "REQUEST A DEMO")
- CTA buttons must use medium font weight
- Use Diligent Red for CTA buttons to draw the eye — red CTAs should be used deliberately to signal the primary action on a page
- Do not place multiple red CTAs in close proximity; use hierarchy to distinguish primary from secondary actions

---

### Iconography

All icons used across the hub must follow these exact settings (consistent with Google Material Symbols Sharp style):
- **Style**: Sharp
- **Fill**: 0
- **Weight**: 400
- **Grade**: 0
- **Optical size**: 48px

Do not mix icon styles or use icons from other libraries (e.g. Heroicons, FontAwesome) alongside Material Symbols Sharp.

---

### Imagery

- Imagery should capture a distinctive point of view — overhead, below, or peeking around a corner — conveying the ability to see into every level of an organization
- Subjects should reflect Diligent's audience: business professionals in corporate offices and work-from-home environments
- Activities depicted should show technology improving access to information, enabling collaboration or sparking a moment of insight
- Frame subjects with room around them to allow flexibility in cropping
- Images of industries Diligent serves may also be used and should follow the same principles
- Do not use generic stock photography that does not reflect these principles

---

### White Space

White space is a core design principle for Diligent. It provides a blank canvas with clear focus. Use generous white space between sections, around content cards and within page layouts — do not crowd the page with content or decorative elements.

---

### General design notes

- The hub should feel like a natural, on-brand extension of diligent.com — reference diligent.com for overall visual tone and layout conventions
- Design should be clean and scannable — governance professionals are busy; prioritize clarity over decoration
- All color usage must meet WCAG 2.1 AA contrast requirements (cross-reference with the Accessibility section)

---

## Project Structure

```
/
├── app/                            # Next.js App Router pages
│   ├── (hub)/                      # Public hub-facing routes
│   │   ├── page.tsx                # Hub homepage
│   │   ├── courses/[slug]/         # Course pages
│   │   ├── templates/[slug]/       # Template pages
│   │   ├── videos/[slug]/          # Video pages
│   │   └── learning-paths/[slug]/  # Learning path pages
│   ├── admin/                      # Password-protected admin dashboard
│   │   ├── login/                  # Admin login page (NextAuth.js)
│   │   ├── page.tsx                # Admin dashboard overview
│   │   ├── courses/                # Course management
│   │   ├── templates/              # Template management
│   │   ├── videos/                 # Video management
│   │   ├── learning-paths/         # Learning path management
│   │   ├── taxonomy/               # Persona/region/subject management
│   │   ├── settings/               # Hub Settings
│   │   ├── partners/               # Educational partner management
│   │   ├── badges/                 # Certification badge management
│   │   ├── redirects/              # Redirect management
│   │   └── reporting/              # Reporting dashboard
│   └── api/
│       ├── auth/                   # NextAuth.js authentication routes
│       ├── marketo/                # Marketo lead submission proxy (server-side only)
│       ├── token/
│       │   └── validate/           # Validates restricted course access tokens
│       ├── scorm/
│       │   ├── launch/             # Generates SCORM Cloud registration + launch URL
│       │   └── postback/           # Receives completion data from SCORM Cloud
│       ├── credly/
│       │   └── issue/              # Issues Credly badge on learning path completion
│       ├── revalidate/             # Triggers Next.js ISR cache revalidation
│       ├── gate/                   # Session/cookie gate validation
│       └── analytics/              # Analytics event ingestion
├── prisma/
│   ├── schema.prisma               # Database schema (all content types + taxonomy)
│   └── seed.ts                     # Database seed script (initial admin account + demo data)
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── auth.ts                     # NextAuth.js configuration
│   ├── blob.ts                     # Vercel Blob upload helpers
│   ├── analytics.ts                # Analytics abstraction layer
│   └── session.ts                  # Gate session/cookie helpers
├── components/
│   ├── hub/                        # Public hub UI components
│   ├── admin/                      # Admin dashboard UI components
│   ├── content/                    # Content type-specific components (VidyardEmbed, ScormEmbed)
│   └── ui/                         # Shared primitives (Button, Icon, Badge etc.)
└── types/                          # TypeScript types
```
---

## Environment Variables

Set up a `.env.local` file with the following. Never commit this file.

```
# Database (Supabase PostgreSQL)
DATABASE_URL=
DIRECT_URL=

# Authentication (NextAuth.js)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Vercel Blob (file storage)
BLOB_READ_WRITE_TOKEN=

# Marketo
MARKETO_BASE_URL=
MARKETO_CLIENT_ID=
MARKETO_CLIENT_SECRET=
MARKETO_FORM_ID=
MARKETO_PROGRAM_NAME=
MARKETO_LIST_NAME=

# SCORM Cloud
SCORM_CLOUD_APP_ID=
SCORM_CLOUD_SECRET_KEY=
SCORM_CLOUD_BASE_URL=

# Credly
CREDLY_API_KEY=
CREDLY_ORGANIZATION_ID=

# Analytics
GA4_MEASUREMENT_ID=
GA4_API_SECRET=
```
---

## First Steps

1. Scaffold the Next.js project using `create-next-app` with TypeScript and Tailwind CSS
2. Install and configure Prisma with the Supabase PostgreSQL connection string
3. Define the full Prisma schema covering all four content types, taxonomy, hub settings, partners, badges, redirects, feedback and admin users
4. Run the initial Prisma migration to create the database tables
5. Create a database seed script that creates an initial admin account
6. Set up NextAuth.js with email/password authentication protecting all `/admin` routes
7. Build the admin dashboard shell (sidebar navigation, login page, dashboard overview)
8. Build admin CRUD pages for all four content types
9. Build the public hub homepage and content library pulling data from PostgreSQL via Prisma
10. Build content item page templates for all four types
11. Implement the tiered access/gating system with the Marketo API proxy route
12. Wire up SCORM Cloud API-embedded delivery
13. Wire up Credly badge issuance on learning path completion
14. Wire up analytics event tracking
15. Polish UI to match Diligent brand guidelines

**Start with steps 1–5 and confirm the database schema looks right before building any UI.**

**Important note on reusing existing work**: The Next.js frontend components, brand design system (Tailwind tokens, fonts, colours), page structure and routing built in the previous prototype should be reused wherever possible. The main items being replaced are the Sanity-specific code (schemas, GROQ queries, Studio, `next-sanity`, `@sanity/image-url`) — these are replaced by Prisma models, PostgreSQL queries, the custom admin dashboard and Vercel Blob. Everything else carries forward.
