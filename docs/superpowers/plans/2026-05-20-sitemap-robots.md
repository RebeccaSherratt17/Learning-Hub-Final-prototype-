# Sitemap & Robots.txt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-generate a `sitemap.xml` containing all published content URLs (excluding restricted courses) and serve an environment-aware `robots.txt` that disallows crawling on staging.

**Architecture:** Next.js App Router has built-in support for `sitemap.ts` and `robots.ts` files in the `app/` directory — these export functions that Next.js calls to generate the XML/text responses. No third-party libraries needed. A `NEXT_PUBLIC_SITE_URL` env var provides the canonical base URL.

**Tech Stack:** Next.js App Router metadata files, Prisma

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `app/sitemap.ts` | Generates sitemap.xml from all published, non-restricted content |
| Create | `app/robots.ts` | Environment-aware robots.txt |

---

### Task 1: Add `NEXT_PUBLIC_SITE_URL` environment variable

This is needed by both sitemap and robots to output absolute URLs.

- [ ] **Step 1: Add to `.env.local`**

Add this line to `.env.local`:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Production value will be `https://learning.diligent.com`. Staging will be the Vercel preview URL.

- [ ] **Step 2: Commit**

No file to commit (`.env.local` is gitignored). Just document the new variable. We'll reference it in the code that follows.

---

### Task 2: Create `sitemap.ts`

**Files:**
- Create: `app/sitemap.ts`

Next.js automatically serves the return value of the default export as `/sitemap.xml`. The function queries Prisma for all published content items (excluding restricted courses) and maps them to sitemap entries.

- [ ] **Step 1: Create the sitemap file**

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://learning.diligent.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, templates, videos, learningPaths] = await Promise.all([
    prisma.course.findMany({
      where: { status: 'PUBLISHED', restricted: false },
      select: { slug: true, updatedAt: true },
    }),
    prisma.template.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.video.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.learningPath.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ]

  const coursePages: MetadataRoute.Sitemap = courses.map((c) => ({
    url: `${BASE_URL}/courses/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const templatePages: MetadataRoute.Sitemap = templates.map((t) => ({
    url: `${BASE_URL}/templates/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const videoPages: MetadataRoute.Sitemap = videos.map((v) => ({
    url: `${BASE_URL}/videos/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const learningPathPages: MetadataRoute.Sitemap = learningPaths.map((lp) => ({
    url: `${BASE_URL}/learning-paths/${lp.slug}`,
    lastModified: lp.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    ...staticPages,
    ...coursePages,
    ...templatePages,
    ...videoPages,
    ...learningPathPages,
  ]
}
```

Key decisions:
- **Restricted courses excluded** via `restricted: false` filter
- **Only PUBLISHED content** — drafts, scheduled, and archived items are excluded
- **Homepage gets priority 1.0**, courses and learning paths 0.8, templates and videos 0.7
- **`updatedAt` used as `lastModified`** so search engines know when content was last changed

- [ ] **Step 2: Verify it works**

Run: `curl http://localhost:3000/sitemap.xml`
Expected: Valid XML with `<urlset>` containing `<url>` entries for the homepage and all published content.

- [ ] **Step 3: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat: auto-generated sitemap.xml for all published content"
```

---

### Task 3: Create `robots.ts`

**Files:**
- Create: `app/robots.ts`

Environment-aware: on production, allow crawling of all public pages and disallow `/admin/`. On staging/preview (detected by `VERCEL_ENV` or absence of production site URL), disallow everything.

- [ ] **Step 1: Create the robots file**

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://learning.diligent.com'
const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'

export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
```

Key decisions:
- **Staging blocks all crawling** (`Disallow: /`) — prevents preview deployments from being indexed
- **Production allows everything except `/admin/` and `/api/`** — restricted course pages are not explicitly disallowed in robots.txt because they are already excluded from the sitemap and require a valid token to render any content (robots.txt disallow is advisory, not security)
- **Sitemap URL included** in production robots.txt so crawlers discover it automatically

- [ ] **Step 2: Verify production behaviour**

Set `NODE_ENV=production` or test in a Vercel preview:
Run: `curl http://localhost:3000/robots.txt`
Expected (production):
```
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://learning.diligent.com/sitemap.xml
```

- [ ] **Step 3: Verify staging behaviour**

In development (default `NODE_ENV=development`):
Run: `curl http://localhost:3000/robots.txt`
Expected:
```
User-Agent: *
Disallow: /
```

- [ ] **Step 4: Commit**

```bash
git add app/robots.ts
git commit -m "feat: environment-aware robots.txt with sitemap reference"
```
