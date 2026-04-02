# Learning Hub: Project Scaffold & Sanity Schemas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js 14 + Sanity v3 project, define all Sanity schemas (4 content types, taxonomy, utility documents), and configure Sanity Studio with organized desk structure, singleton support, archived badges, and validation warnings.

**Architecture:** Next.js App Router with embedded Sanity Studio at `/studio`. Sanity schemas define 4 content types (course, template, video, learningPath), 3 taxonomy types (persona, region, subject), and utility documents (hubSettings singleton, educationalPartner, certificationBadge, redirect, feedback). The Studio desk structure groups these logically with singleton handling.

**Tech Stack:** Next.js 14 (App Router), Sanity v3 (`sanity@^3.99.0`), `next-sanity@^9.12.3`, TypeScript, Tailwind CSS, `@sanity/image-url`, `@sanity/vision`, `styled-components@^6.1`

---

## File Structure

```
/
├── app/
│   ├── (hub)/
│   │   └── layout.tsx                    # Hub layout shell (minimal for now)
│   │   └── page.tsx                      # Hub homepage placeholder
│   ├── (studio)/
│   │   └── studio/[[...tool]]/
│   │       └── page.tsx                  # Sanity Studio embed
│   ├── layout.tsx                        # Root layout
│   └── globals.css                       # Tailwind imports
├── sanity/
│   ├── env.ts                            # Sanity env var helpers
│   ├── lib/
│   │   ├── client.ts                     # Sanity client instance
│   │   └── image.ts                      # Image URL builder
│   ├── schemas/
│   │   ├── index.ts                      # Schema barrel export
│   │   ├── documents/
│   │   │   ├── course.ts
│   │   │   ├── template.ts
│   │   │   ├── video.ts
│   │   │   ├── learningPath.ts
│   │   │   ├── hubSettings.ts
│   │   │   ├── educationalPartner.ts
│   │   │   ├── certificationBadge.ts
│   │   │   ├── redirect.ts
│   │   │   └── feedback.ts
│   │   └── taxonomy/
│   │       ├── persona.ts
│   │       ├── region.ts
│   │       └── subject.ts
│   ├── structure.ts                      # Studio desk structure
│   └── badges.ts                         # Custom document badges
├── sanity.config.ts                      # Sanity Studio config (root)
├── sanity.cli.ts                         # Sanity CLI config (root)
├── .env.local.example                    # Env var template
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/globals.css`, `app/(hub)/layout.tsx`, `app/(hub)/page.tsx`, `.env.local.example`, `.gitignore`, `next.config.ts`

- [ ] **Step 1: Create the Next.js project**

Run from the parent directory of `learning-hub` (or in-place if the folder is empty aside from existing files):

```bash
npx create-next-app@14 learning-hub --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

If the directory already exists with files, run inside it:

```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Expected: A Next.js 14 project scaffolded with App Router, TypeScript, Tailwind CSS, ESLint.

- [ ] **Step 2: Verify the scaffold works**

```bash
cd learning-hub
npm run dev
```

Expected: Dev server starts at `http://localhost:3000` without errors. Stop the server after confirming.

- [ ] **Step 3: Create the environment variables template**

Create `.env.local.example`:

```env
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-06-01
SANITY_API_TOKEN=
SANITY_WEBHOOK_SECRET=

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

- [ ] **Step 4: Update .gitignore**

Ensure `.gitignore` includes:

```
.env.local
.env*.local
```

(This should already be present from `create-next-app`, but verify.)

- [ ] **Step 5: Create hub route group layout**

Create `app/(hub)/layout.tsx`:

```typescript
export default function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
```

Create `app/(hub)/page.tsx`:

```typescript
export default function HubHomePage() {
  return (
    <main>
      <h1>Diligent Learning Hub</h1>
      <p>Coming soon.</p>
    </main>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js 14 project with App Router, TypeScript, Tailwind"
```

---

### Task 2: Install Sanity Dependencies and Configure Client

**Files:**
- Create: `sanity/env.ts`, `sanity/lib/client.ts`, `sanity/lib/image.ts`, `sanity.config.ts`, `sanity.cli.ts`

- [ ] **Step 1: Install Sanity packages**

```bash
npm install next-sanity@^9.12.3 sanity@^3.99.0 @sanity/image-url @sanity/vision styled-components@^6.1
```

Expected: Packages install without peer dependency errors.

- [ ] **Step 2: Create Sanity environment helper**

Create `sanity/env.ts`:

```typescript
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-06-01'

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET'
)

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID'
)

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }
  return v
}
```

- [ ] **Step 3: Create Sanity client**

Create `sanity/lib/client.ts`:

```typescript
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})
```

- [ ] **Step 4: Create image URL builder**

Create `sanity/lib/image.ts`:

```typescript
import createImageUrlBuilder from '@sanity/image-url'
import type { Image } from 'sanity'
import { dataset, projectId } from '../env'

const builder = createImageUrlBuilder({ projectId, dataset })

export function urlForImage(source: Image) {
  return builder.image(source)
}
```

- [ ] **Step 5: Create sanity.cli.ts**

Create `sanity.cli.ts` in the project root:

```typescript
import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
})
```

- [ ] **Step 6: Create initial sanity.config.ts**

Create `sanity.config.ts` in the project root (schemas will be empty for now — we'll add them in Task 4):

```typescript
'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

export default defineConfig({
  basePath: '/studio',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  schema: {
    types: schemaTypes,
  },
  plugins: [
    structureTool(),
    visionTool({ defaultApiVersion: '2024-06-01' }),
  ],
})
```

- [ ] **Step 7: Create empty schema barrel file**

Create `sanity/schemas/index.ts`:

```typescript
import type { SchemaTypeDefinition } from 'sanity'

export const schemaTypes: SchemaTypeDefinition[] = []
```

- [ ] **Step 8: Create the Studio route**

Create directory `app/(studio)/studio/[[...tool]]/` and file `page.tsx`:

```typescript
import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

export const dynamic = 'force-static'

export { metadata, viewport } from 'next-sanity/studio'

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

- [ ] **Step 9: Commit**

```bash
git add sanity/ sanity.config.ts sanity.cli.ts "app/(studio)"
git commit -m "chore: add Sanity v3 client, config, and Studio route at /studio"
```

---

### Task 3: Define Taxonomy Schemas (Persona, Region, Subject)

**Files:**
- Create: `sanity/schemas/taxonomy/persona.ts`, `sanity/schemas/taxonomy/region.ts`, `sanity/schemas/taxonomy/subject.ts`
- Modify: `sanity/schemas/index.ts`

- [ ] **Step 1: Create Persona schema**

Create `sanity/schemas/taxonomy/persona.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'persona',
  title: 'Persona',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
  ],
})
```

- [ ] **Step 2: Create Region schema**

Create `sanity/schemas/taxonomy/region.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'region',
  title: 'Region',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
  ],
})
```

- [ ] **Step 3: Create Subject schema**

Create `sanity/schemas/taxonomy/subject.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'subject',
  title: 'Subject',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'group',
      title: 'Group',
      type: 'string',
      description: 'The category group this subject belongs to (e.g. "Board Leadership & Operations", "Risk Management")',
      options: {
        list: [
          { title: 'Board Leadership & Operations', value: 'board-leadership-operations' },
          { title: 'Risk Management', value: 'risk-management' },
          { title: 'Regulations & Compliance', value: 'regulations-compliance' },
          { title: 'Entity Management', value: 'entity-management' },
          { title: 'Organization Type', value: 'organization-type' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
  ],
})
```

- [ ] **Step 4: Register taxonomy schemas in barrel file**

Update `sanity/schemas/index.ts`:

```typescript
import type { SchemaTypeDefinition } from 'sanity'

import persona from './taxonomy/persona'
import region from './taxonomy/region'
import subject from './taxonomy/subject'

export const schemaTypes: SchemaTypeDefinition[] = [
  persona,
  region,
  subject,
]
```

- [ ] **Step 5: Commit**

```bash
git add sanity/schemas/
git commit -m "feat: add taxonomy schemas (persona, region, subject)"
```

---

### Task 4: Define Course Schema

**Files:**
- Create: `sanity/schemas/documents/course.ts`
- Modify: `sanity/schemas/index.ts`

- [ ] **Step 1: Create Course schema**

Create `sanity/schemas/documents/course.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
      description: 'URL-friendly identifier. Changing this will break existing links unless a redirect is set up.',
    }),
    defineField({
      name: 'previousSlug',
      title: 'Previous Slug',
      type: 'string',
      readOnly: true,
      description: 'Automatically stored when the slug is changed, used for redirects.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'scormCourseId',
      title: 'SCORM Cloud Course ID',
      type: 'string',
      description: 'The course ID from SCORM Cloud. The course file is uploaded via the SCORM Cloud dashboard, not via Sanity.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Recommended: 1200x675px (16:9 aspect ratio). Use the hotspot tool to set the focal point.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required().warning('Alt text is required for accessibility.'),
        }),
      ],
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      description: 'Set a future date to schedule publication. Content will not be visible until this date.',
    }),
    defineField({
      name: 'estimatedDuration',
      title: 'Estimated Duration',
      type: 'string',
      description: 'e.g. "45 minutes", "1.5 hours"',
    }),
    defineField({
      name: 'accessTier',
      title: 'Access Tier',
      type: 'string',
      options: {
        list: [
          { title: 'Free', value: 'free' },
          { title: 'Gated', value: 'gated' },
          { title: 'Premium', value: 'premium' },
        ],
        layout: 'radio',
      },
      initialValue: 'free',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subjects',
      title: 'Subject Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'subject' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'personas',
      title: 'Persona Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'persona' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'regions',
      title: 'Region Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'region' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'relatedItems',
      title: 'Related Items',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'course' },
            { type: 'template' },
            { type: 'video' },
            { type: 'learningPath' },
          ],
        },
      ],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: 'restricted',
      title: 'Restrict Access',
      type: 'boolean',
      description: 'Restrict access to specific learners via a token URL. Restricted courses are hidden from the public library.',
      initialValue: false,
    }),
    defineField({
      name: 'accessToken',
      title: 'Access Token',
      type: 'string',
      readOnly: true,
      description: 'Generated via the "Generate Token" action. Share the token URL with intended learners.',
      hidden: ({ document }) => !document?.restricted,
    }),
    defineField({
      name: 'restrictedAccessNote',
      title: 'Restricted Access Note',
      type: 'text',
      rows: 2,
      description: 'Internal note: who is this course for? (e.g. "Acme Corp board directors"). Not shown publicly.',
      hidden: ({ document }) => !document?.restricted,
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      description: 'Archived courses are removed from the public hub but remain in Studio.',
      initialValue: false,
    }),
    defineField({
      name: 'viewCount',
      title: 'View Count',
      type: 'number',
      readOnly: true,
      initialValue: 0,
      description: 'Automatically incremented on page load. Used for popularity sorting.',
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Meta Title',
      type: 'string',
      description: 'Overrides the display title for search engines. Leave blank to use the content title.',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Meta Description',
      type: 'text',
      rows: 3,
      description: 'Overrides the display description for search engines.',
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      description: 'Image displayed when this page is shared on social media. Falls back to thumbnail if not set.',
      group: 'seo',
    }),
  ],
  groups: [
    { name: 'seo', title: 'SEO', default: false },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'thumbnail',
      archived: 'archived',
      restricted: 'restricted',
    },
    prepare({ title, media, archived, restricted }) {
      const subtitles: string[] = []
      if (archived) subtitles.push('Archived')
      if (restricted) subtitles.push('Restricted')
      return {
        title,
        subtitle: subtitles.join(' | ') || 'Course',
        media,
      }
    },
  },
})
```

- [ ] **Step 2: Register course schema**

Update `sanity/schemas/index.ts` — add the import and push to the array:

```typescript
import type { SchemaTypeDefinition } from 'sanity'

import persona from './taxonomy/persona'
import region from './taxonomy/region'
import subject from './taxonomy/subject'
import course from './documents/course'

export const schemaTypes: SchemaTypeDefinition[] = [
  persona,
  region,
  subject,
  course,
]
```

- [ ] **Step 3: Commit**

```bash
git add sanity/schemas/
git commit -m "feat: add course document schema with all fields"
```

---

### Task 5: Define Template Schema

**Files:**
- Create: `sanity/schemas/documents/template.ts`
- Modify: `sanity/schemas/index.ts`

- [ ] **Step 1: Create Template schema**

Create `sanity/schemas/documents/template.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'template',
  title: 'Template',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
      description: 'URL-friendly identifier. Changing this will break existing links unless a redirect is set up.',
    }),
    defineField({
      name: 'previousSlug',
      title: 'Previous Slug',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'file',
      title: 'Downloadable File',
      type: 'file',
      description: 'Upload the template file (.docx, .xlsx, or .pdf)',
      options: {
        accept: '.docx,.xlsx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Recommended: 1200x675px (16:9 aspect ratio).',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required().warning('Alt text is required for accessibility.'),
        }),
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
    }),
    defineField({
      name: 'accessTier',
      title: 'Access Tier',
      type: 'string',
      options: {
        list: [
          { title: 'Free', value: 'free' },
          { title: 'Gated', value: 'gated' },
          { title: 'Premium', value: 'premium' },
        ],
        layout: 'radio',
      },
      initialValue: 'gated',
      description: 'Templates are gated by default — a lead form is shown before download.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subjects',
      title: 'Subject Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'subject' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'personas',
      title: 'Persona Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'persona' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'regions',
      title: 'Region Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'region' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'relatedItems',
      title: 'Related Items',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'course' },
            { type: 'template' },
            { type: 'video' },
            { type: 'learningPath' },
          ],
        },
      ],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'viewCount',
      title: 'View Count',
      type: 'number',
      readOnly: true,
      initialValue: 0,
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Meta Title',
      type: 'string',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Meta Description',
      type: 'text',
      rows: 3,
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      group: 'seo',
    }),
  ],
  groups: [
    { name: 'seo', title: 'SEO', default: false },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'thumbnail',
      archived: 'archived',
    },
    prepare({ title, media, archived }) {
      return {
        title,
        subtitle: archived ? 'Archived' : 'Template',
        media,
      }
    },
  },
})
```

- [ ] **Step 2: Register template schema**

Update `sanity/schemas/index.ts`:

```typescript
import type { SchemaTypeDefinition } from 'sanity'

import persona from './taxonomy/persona'
import region from './taxonomy/region'
import subject from './taxonomy/subject'
import course from './documents/course'
import template from './documents/template'

export const schemaTypes: SchemaTypeDefinition[] = [
  persona,
  region,
  subject,
  course,
  template,
]
```

- [ ] **Step 3: Commit**

```bash
git add sanity/schemas/
git commit -m "feat: add template document schema with file asset and gating"
```

---

### Task 6: Define Video Schema

**Files:**
- Create: `sanity/schemas/documents/video.ts`
- Modify: `sanity/schemas/index.ts`

- [ ] **Step 1: Create Video schema**

Create `sanity/schemas/documents/video.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'previousSlug',
      title: 'Previous Slug',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'vidyardEmbed',
      title: 'Vidyard Embed URL or ID',
      type: 'string',
      description: 'Paste the Vidyard share URL or embed UUID. Do not use an iframe embed code.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'e.g. "12 minutes", "1 hour"',
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Recommended: 1200x675px (16:9 aspect ratio).',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required().warning('Alt text is required for accessibility.'),
        }),
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
    }),
    defineField({
      name: 'accessTier',
      title: 'Access Tier',
      type: 'string',
      options: {
        list: [
          { title: 'Free', value: 'free' },
          { title: 'Gated', value: 'gated' },
          { title: 'Premium', value: 'premium' },
        ],
        layout: 'radio',
      },
      initialValue: 'free',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subjects',
      title: 'Subject Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'subject' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'personas',
      title: 'Persona Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'persona' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'regions',
      title: 'Region Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'region' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'relatedItems',
      title: 'Related Items',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'course' },
            { type: 'template' },
            { type: 'video' },
            { type: 'learningPath' },
          ],
        },
      ],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'viewCount',
      title: 'View Count',
      type: 'number',
      readOnly: true,
      initialValue: 0,
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Meta Title',
      type: 'string',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Meta Description',
      type: 'text',
      rows: 3,
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      group: 'seo',
    }),
  ],
  groups: [
    { name: 'seo', title: 'SEO', default: false },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'thumbnail',
      archived: 'archived',
    },
    prepare({ title, media, archived }) {
      return {
        title,
        subtitle: archived ? 'Archived' : 'Video',
        media,
      }
    },
  },
})
```

- [ ] **Step 2: Register video schema**

Update `sanity/schemas/index.ts`:

```typescript
import type { SchemaTypeDefinition } from 'sanity'

import persona from './taxonomy/persona'
import region from './taxonomy/region'
import subject from './taxonomy/subject'
import course from './documents/course'
import template from './documents/template'
import video from './documents/video'

export const schemaTypes: SchemaTypeDefinition[] = [
  persona,
  region,
  subject,
  course,
  template,
  video,
]
```

- [ ] **Step 3: Commit**

```bash
git add sanity/schemas/
git commit -m "feat: add video document schema with Vidyard embed"
```

---

### Task 7: Define Learning Path Schema

**Files:**
- Create: `sanity/schemas/documents/learningPath.ts`
- Modify: `sanity/schemas/index.ts`

- [ ] **Step 1: Create Learning Path schema**

Create `sanity/schemas/documents/learningPath.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'learningPath',
  title: 'Learning Path',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'previousSlug',
      title: 'Previous Slug',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'items',
      title: 'Content Items',
      type: 'array',
      description: 'Ordered list of content items in this learning path. Drag to reorder.',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'course' },
            { type: 'template' },
            { type: 'video' },
          ],
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'estimatedCompletionTime',
      title: 'Estimated Completion Time',
      type: 'string',
      description: 'e.g. "3 hours", "2 days"',
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Recommended: 1200x675px (16:9 aspect ratio).',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required().warning('Alt text is required for accessibility.'),
        }),
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
    }),
    defineField({
      name: 'accessTier',
      title: 'Access Tier',
      type: 'string',
      options: {
        list: [
          { title: 'Free', value: 'free' },
          { title: 'Gated', value: 'gated' },
          { title: 'Premium', value: 'premium' },
        ],
        layout: 'radio',
      },
      initialValue: 'free',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'credlyBadgeId',
      title: 'Credly Badge Template ID',
      type: 'string',
      description: 'Optional. If set, learners who complete all items will be awarded this Credly badge. Set up the badge template in the Credly dashboard first.',
    }),
    defineField({
      name: 'subjects',
      title: 'Subject Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'subject' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'personas',
      title: 'Persona Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'persona' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'regions',
      title: 'Region Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'region' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'relatedItems',
      title: 'Related Items',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'course' },
            { type: 'template' },
            { type: 'video' },
            { type: 'learningPath' },
          ],
        },
      ],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      initialValue: false,
      validation: (rule) =>
        rule.custom(async (isArchived, context) => {
          if (!isArchived) return true

          const client = context.getClient({ apiVersion: '2024-06-01' })
          const docId = (context.document?._id || '').replace('drafts.', '')
          const referencingPaths = await client.fetch(
            `count(*[_type == "learningPath" && _id != $docId && references($docId)])`,
            { docId }
          )

          if (referencingPaths > 0) {
            return `This learning path is referenced by ${referencingPaths} other document(s). Archiving may affect those references.`
          }
          return true
        }),
    }),
    defineField({
      name: 'viewCount',
      title: 'View Count',
      type: 'number',
      readOnly: true,
      initialValue: 0,
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Meta Title',
      type: 'string',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Meta Description',
      type: 'text',
      rows: 3,
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      group: 'seo',
    }),
  ],
  groups: [
    { name: 'seo', title: 'SEO', default: false },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'thumbnail',
      archived: 'archived',
      item0: 'items.0._ref',
      item1: 'items.1._ref',
      item2: 'items.2._ref',
    },
    prepare({ title, media, archived, item0, item1, item2 }) {
      const itemCount = [item0, item1, item2].filter(Boolean).length
      const suffix = itemCount === 3 ? '3+ items' : `${itemCount} item(s)`
      return {
        title,
        subtitle: archived ? `Archived | ${suffix}` : `Learning Path | ${suffix}`,
        media,
      }
    },
  },
})
```

- [ ] **Step 2: Register learning path schema**

Update `sanity/schemas/index.ts`:

```typescript
import type { SchemaTypeDefinition } from 'sanity'

import persona from './taxonomy/persona'
import region from './taxonomy/region'
import subject from './taxonomy/subject'
import course from './documents/course'
import template from './documents/template'
import video from './documents/video'
import learningPath from './documents/learningPath'

export const schemaTypes: SchemaTypeDefinition[] = [
  persona,
  region,
  subject,
  course,
  template,
  video,
  learningPath,
]
```

- [ ] **Step 3: Commit**

```bash
git add sanity/schemas/
git commit -m "feat: add learning path schema with ordered items and archive warning"
```

---

### Task 8: Define Utility Schemas (Hub Settings, Partners, Badges, Redirects, Feedback)

**Files:**
- Create: `sanity/schemas/documents/hubSettings.ts`, `sanity/schemas/documents/educationalPartner.ts`, `sanity/schemas/documents/certificationBadge.ts`, `sanity/schemas/documents/redirect.ts`, `sanity/schemas/documents/feedback.ts`
- Modify: `sanity/schemas/index.ts`

- [ ] **Step 1: Create Hub Settings singleton schema**

Create `sanity/schemas/documents/hubSettings.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'hubSettings',
  title: 'Hub Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteTitle',
      title: 'Site Title',
      type: 'string',
      initialValue: 'Diligent Learning Hub',
    }),
    defineField({
      name: 'siteDescription',
      title: 'Site Meta Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'demoCTAUrl',
      title: 'Demo Request CTA URL',
      type: 'url',
      description: 'The URL for "Request a demo" buttons across the hub.',
    }),
    defineField({
      name: 'heroHeading',
      title: 'Hero Heading',
      type: 'string',
      initialValue: 'Diligent Learning Hub',
    }),
    defineField({
      name: 'heroSubheading',
      title: 'Hero Subheading',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'heroOverview',
      title: 'Hero Overview Text',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'popularSectionHeading',
      title: 'Popular & Featured Section Heading',
      type: 'string',
      initialValue: 'Jump in: Popular and featured content',
    }),
    defineField({
      name: 'partnersSectionHeading',
      title: 'Educational Partners Section Heading',
      type: 'string',
      initialValue: 'Our educational partners',
    }),
    defineField({
      name: 'librarySectionHeading',
      title: 'Full Resource Library Section Heading',
      type: 'string',
      initialValue: 'Full resource library',
    }),
    defineField({
      name: 'questionsSectionHeading',
      title: 'Got Questions Section Heading',
      type: 'string',
      initialValue: 'Got questions?',
    }),
    defineField({
      name: 'questionsSectionBody',
      title: 'Got Questions Section Body',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'certificationsSectionHeading',
      title: 'Certifications Section Heading',
      type: 'string',
      initialValue: 'Professionally-accredited certifications',
    }),
    defineField({
      name: 'certificationsSectionBody',
      title: 'Certifications Section Body',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'footerHeading',
      title: 'Footer CTA Heading',
      type: 'string',
      initialValue: 'Upskill your board today',
    }),
    defineField({
      name: 'footerBody',
      title: 'Footer CTA Body',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'footerCTAText',
      title: 'Footer CTA Button Text',
      type: 'string',
      initialValue: 'Request a demo',
    }),
    defineField({
      name: 'privacyPolicyUrl',
      title: 'Privacy Policy URL',
      type: 'url',
      description: 'Linked from gate forms and cookie consent banner.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Default Open Graph Image',
      type: 'image',
      description: 'Default social share image for the hub homepage.',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Hub Settings' }
    },
  },
})
```

- [ ] **Step 2: Create Educational Partner schema**

Create `sanity/schemas/documents/educationalPartner.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'educationalPartner',
  title: 'Educational Partner',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Partner Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'url',
      title: 'Link URL',
      type: 'url',
      description: 'Optional link when the logo is clicked.',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first in the scrolling row.',
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      media: 'logo',
    },
  },
})
```

- [ ] **Step 3: Create Certification Badge schema**

Create `sanity/schemas/documents/certificationBadge.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'certificationBadge',
  title: 'Certification Badge',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Certification Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Badge Image',
      type: 'image',
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'url',
      title: 'Destination URL',
      type: 'url',
      description: 'Link to the Diligent certification page. Leave blank if URL is TBC.',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      url: 'url',
    },
    prepare({ title, media, url }) {
      return {
        title,
        subtitle: url || 'URL not set',
        media,
      }
    },
  },
})
```

- [ ] **Step 4: Create Redirect schema**

Create `sanity/schemas/documents/redirect.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  fields: [
    defineField({
      name: 'source',
      title: 'Source Path',
      type: 'string',
      description: 'The old URL path (e.g. /courses/old-slug). Must start with /.',
      validation: (rule) =>
        rule.required().custom((value) => {
          if (typeof value === 'string' && !value.startsWith('/')) {
            return 'Source path must start with /'
          }
          return true
        }),
    }),
    defineField({
      name: 'destination',
      title: 'Destination Path',
      type: 'string',
      description: 'The new URL path (e.g. /courses/new-slug). Must start with /.',
      validation: (rule) =>
        rule.required().custom((value) => {
          if (typeof value === 'string' && !value.startsWith('/')) {
            return 'Destination path must start with /'
          }
          return true
        }),
    }),
    defineField({
      name: 'isPermanent',
      title: 'Permanent Redirect (301)',
      type: 'boolean',
      initialValue: true,
      description: 'Use 301 for permanent moves (SEO-friendly). Use 302 for temporary redirects.',
    }),
  ],
  preview: {
    select: {
      source: 'source',
      destination: 'destination',
      isPermanent: 'isPermanent',
    },
    prepare({ source, destination, isPermanent }) {
      return {
        title: `${source} → ${destination}`,
        subtitle: isPermanent ? '301 Permanent' : '302 Temporary',
      }
    },
  },
})
```

- [ ] **Step 5: Create Feedback schema**

Create `sanity/schemas/documents/feedback.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'feedback',
  title: 'Feedback',
  type: 'document',
  fields: [
    defineField({
      name: 'contentItem',
      title: 'Content Item',
      type: 'reference',
      to: [
        { type: 'course' },
        { type: 'template' },
        { type: 'video' },
        { type: 'learningPath' },
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rating',
      title: 'Star Rating',
      type: 'number',
      validation: (rule) => rule.required().min(1).max(5).integer(),
    }),
    defineField({
      name: 'comment',
      title: 'Comment',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      contentTitle: 'contentItem.title',
      rating: 'rating',
      submittedAt: 'submittedAt',
    },
    prepare({ contentTitle, rating, submittedAt }) {
      const stars = rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : ''
      return {
        title: contentTitle || 'Unknown content',
        subtitle: `${stars} | ${submittedAt ? new Date(submittedAt).toLocaleDateString() : 'No date'}`,
      }
    },
  },
})
```

- [ ] **Step 6: Register all utility schemas**

Update `sanity/schemas/index.ts`:

```typescript
import type { SchemaTypeDefinition } from 'sanity'

import persona from './taxonomy/persona'
import region from './taxonomy/region'
import subject from './taxonomy/subject'
import course from './documents/course'
import template from './documents/template'
import video from './documents/video'
import learningPath from './documents/learningPath'
import hubSettings from './documents/hubSettings'
import educationalPartner from './documents/educationalPartner'
import certificationBadge from './documents/certificationBadge'
import redirect from './documents/redirect'
import feedback from './documents/feedback'

export const schemaTypes: SchemaTypeDefinition[] = [
  // Taxonomy
  persona,
  region,
  subject,
  // Content
  course,
  template,
  video,
  learningPath,
  // Utility
  hubSettings,
  educationalPartner,
  certificationBadge,
  redirect,
  feedback,
]
```

- [ ] **Step 7: Commit**

```bash
git add sanity/schemas/
git commit -m "feat: add utility schemas (hub settings, partners, badges, redirects, feedback)"
```

---

### Task 9: Configure Sanity Studio Desk Structure

**Files:**
- Create: `sanity/structure.ts`, `sanity/badges.ts`
- Modify: `sanity.config.ts`

- [ ] **Step 1: Create custom document badges**

Create `sanity/badges.ts`:

```typescript
import type { DocumentBadgeComponent } from 'sanity'

export const ArchivedBadge: DocumentBadgeComponent = (props) => {
  const doc = props.draft || props.published
  if (!(doc as any)?.archived) {
    return null
  }
  return {
    label: 'Archived',
    title: 'This content has been archived and is not visible on the public hub.',
    color: 'warning',
  }
}

export const RestrictedBadge: DocumentBadgeComponent = (props) => {
  const doc = props.draft || props.published
  if (!(doc as any)?.restricted) {
    return null
  }
  return {
    label: 'Restricted',
    title: 'This course is only accessible via a token URL.',
    color: 'danger',
  }
}
```

- [ ] **Step 2: Create Studio desk structure**

Create `sanity/structure.ts`:

```typescript
import type { StructureResolver } from 'sanity/structure'

const singletonListItem = (
  S: Parameters<StructureResolver>[0],
  typeName: string,
  title: string
) =>
  S.listItem()
    .title(title)
    .id(typeName)
    .child(S.document().schemaType(typeName).documentId(typeName))

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Learning Hub')
    .items([
      // Settings singleton
      singletonListItem(S, 'hubSettings', 'Hub Settings'),

      S.divider(),

      // Content
      S.listItem()
        .title('Content')
        .child(
          S.list()
            .title('Content')
            .items([
              S.documentTypeListItem('course').title('Courses'),
              S.documentTypeListItem('template').title('Templates'),
              S.documentTypeListItem('video').title('Videos'),
              S.documentTypeListItem('learningPath').title('Learning Paths'),
            ])
        ),

      S.divider(),

      // Taxonomy
      S.listItem()
        .title('Taxonomy')
        .child(
          S.list()
            .title('Taxonomy')
            .items([
              S.documentTypeListItem('persona').title('Personas'),
              S.documentTypeListItem('region').title('Regions'),
              S.documentTypeListItem('subject').title('Subjects'),
            ])
        ),

      S.divider(),

      // Site content
      S.listItem()
        .title('Site Content')
        .child(
          S.list()
            .title('Site Content')
            .items([
              S.documentTypeListItem('educationalPartner').title('Educational Partners'),
              S.documentTypeListItem('certificationBadge').title('Certification Badges'),
            ])
        ),

      S.divider(),

      // Administration
      S.listItem()
        .title('Administration')
        .child(
          S.list()
            .title('Administration')
            .items([
              S.documentTypeListItem('redirect').title('Redirects'),
              S.documentTypeListItem('feedback').title('Feedback'),
            ])
        ),
    ])
```

- [ ] **Step 3: Update sanity.config.ts with structure, badges, and singleton handling**

Replace the contents of `sanity.config.ts`:

```typescript
'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'
import { structure } from './sanity/structure'
import { ArchivedBadge, RestrictedBadge } from './sanity/badges'

const singletonActions = new Set(['publish', 'discardChanges', 'restore'])
const singletonTypes = new Set(['hubSettings'])

const contentTypes = new Set(['course', 'template', 'video', 'learningPath'])

export default defineConfig({
  basePath: '/studio',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,

  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },

  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: '2024-06-01' }),
  ],

  document: {
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(({ action }) => action && singletonActions.has(action))
        : input,

    badges: (prev, context) => {
      if (contentTypes.has(context.schemaType)) {
        return [ArchivedBadge, ...prev]
      }
      if (context.schemaType === 'course') {
        return [RestrictedBadge, ArchivedBadge, ...prev]
      }
      return prev
    },
  },
})
```

- [ ] **Step 4: Commit**

```bash
git add sanity/structure.ts sanity/badges.ts sanity.config.ts
git commit -m "feat: configure Studio desk structure, singleton handling, and custom badges"
```

---

### Task 10: Add Archive Validation Warnings to Content Schemas

**Files:**
- Modify: `sanity/schemas/documents/course.ts`, `sanity/schemas/documents/template.ts`, `sanity/schemas/documents/video.ts`

- [ ] **Step 1: Add archive validation to the course schema**

In `sanity/schemas/documents/course.ts`, update the `archived` field validation:

```typescript
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      description: 'Archived courses are removed from the public hub but remain in Studio.',
      initialValue: false,
      validation: (rule) =>
        rule.custom(async (isArchived, context) => {
          if (!isArchived) return true

          const client = context.getClient({ apiVersion: '2024-06-01' })
          const docId = (context.document?._id || '').replace('drafts.', '')
          const count = await client.fetch(
            `count(*[_type == "learningPath" && references($docId)])`,
            { docId }
          )

          if (count > 0) {
            return `Warning: this course is included in ${count} learning path(s). Archiving it will affect those paths.`
          }
          return true
        }).warning(),
    }),
```

- [ ] **Step 2: Add archive validation to the template schema**

In `sanity/schemas/documents/template.ts`, update the `archived` field the same way:

```typescript
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      initialValue: false,
      validation: (rule) =>
        rule.custom(async (isArchived, context) => {
          if (!isArchived) return true

          const client = context.getClient({ apiVersion: '2024-06-01' })
          const docId = (context.document?._id || '').replace('drafts.', '')
          const count = await client.fetch(
            `count(*[_type == "learningPath" && references($docId)])`,
            { docId }
          )

          if (count > 0) {
            return `Warning: this template is included in ${count} learning path(s). Archiving it will affect those paths.`
          }
          return true
        }).warning(),
    }),
```

- [ ] **Step 3: Add archive validation to the video schema**

In `sanity/schemas/documents/video.ts`, update the `archived` field the same way:

```typescript
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      initialValue: false,
      validation: (rule) =>
        rule.custom(async (isArchived, context) => {
          if (!isArchived) return true

          const client = context.getClient({ apiVersion: '2024-06-01' })
          const docId = (context.document?._id || '').replace('drafts.', '')
          const count = await client.fetch(
            `count(*[_type == "learningPath" && references($docId)])`,
            { docId }
          )

          if (count > 0) {
            return `Warning: this video is included in ${count} learning path(s). Archiving it will affect those paths.`
          }
          return true
        }).warning(),
    }),
```

- [ ] **Step 4: Commit**

```bash
git add sanity/schemas/documents/
git commit -m "feat: add archive validation warnings for content referenced by learning paths"
```

---

### Task 11: Verify Studio Loads

**Files:** None (verification only)

- [ ] **Step 1: Create a .env.local with placeholder Sanity values**

Copy `.env.local.example` to `.env.local` and fill in a Sanity project ID and dataset. If no Sanity project exists yet, create one:

```bash
npx sanity@3 init --create-project "Diligent Learning Hub" --dataset production --output-path /tmp/sanity-temp
```

Copy the project ID from the output into `.env.local`:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_SANITY_DATASET=production
```

- [ ] **Step 2: Start the dev server and verify Studio**

```bash
npm run dev
```

Navigate to `http://localhost:3000/studio`. Verify:
- Studio loads without errors
- The desk structure shows: Hub Settings, Content (Courses/Templates/Videos/Learning Paths), Taxonomy (Personas/Regions/Subjects), Site Content (Educational Partners/Certification Badges), Administration (Redirects/Feedback)
- Hub Settings opens as a single document editor (not a list)
- All content type forms display all expected fields
- SEO field groups work on content types
- The `restricted` field on courses conditionally shows/hides token fields

- [ ] **Step 3: Navigate to the hub homepage**

Navigate to `http://localhost:3000`. Verify the placeholder hub page loads.

- [ ] **Step 4: Commit any adjustments**

If any fixes were needed, commit them:

```bash
git add -A
git commit -m "fix: resolve Studio configuration issues found during verification"
```
