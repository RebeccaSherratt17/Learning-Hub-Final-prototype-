# SCORM Course Detail Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver self-hosted SCORM course playback — admin zip upload, server-side extraction, scorm-again runtime, launch/tracking APIs, and the public course detail page.

**Architecture:** SCORM `.zip` packages are uploaded via the admin dashboard, extracted server-side with security protections, and stored in Vercel Blob. On the public course page, learners identify themselves (name + email), then launch the course in a fullscreen overlay iframe. The `scorm-again` library provides the SCORM 1.2/2004 runtime API (`window.API` / `window.API_1484_11`) and batches CMI data to the hub's `/api/scorm/tracking` endpoint, which stores completion data in a PostgreSQL `Attempt` table.

**Tech Stack:** Next.js 14 (App Router), Prisma + PostgreSQL, Vercel Blob, scorm-again, JSZip (already installed), HMAC-SHA256 launch tokens, vitest

---

## Current State

- The `Course` model exists in Prisma with a `scormCourseId` field (string, currently stores an external SCORM Cloud ID — this will be replaced with `launchFile` and `scormVersion` fields)
- The `CourseForm` admin component exists and includes a text input for `scormCourseId` — this will be replaced with a zip upload widget
- No `Attempt` model exists — it needs to be created
- No public course detail page exists (`app/(hub)/courses/[slug]/page.tsx`)
- No `ScormEmbed` component exists
- No SCORM API routes exist (`/api/scorm/launch`, `/api/scorm/tracking`)
- `scorm-again` is not installed
- `jszip` is already installed
- The video and template detail pages provide the exact layout pattern to follow (two-column, GateProvider, breadcrumb, taxonomy tags, related items, CTA banner)

## File Map

### New files

| File | Responsibility |
|------|----------------|
| `lib/scorm/extract.ts` | Server-side SCORM zip extraction with security protections (path traversal, zip-bomb) |
| `lib/scorm/manifest.ts` | Parse `imsmanifest.xml` to find launch file + SCORM version |
| `lib/scorm/token.ts` | Generate and verify HMAC-SHA256 launch tokens |
| `app/api/scorm/launch/route.ts` | Creates Attempt record, returns signed launch token + course entry URL |
| `app/api/scorm/tracking/[attemptId]/route.ts` | Receives CMI data from scorm-again, updates Attempt record |
| `app/api/admin/courses/[id]/scorm/route.ts` | Admin endpoint for SCORM zip upload — extracts, parses manifest, stores in Blob |
| `components/content/ScormEmbed.tsx` | Client component — fullscreen overlay iframe, scorm-again initialisation |
| `components/hub/CourseRightColumn.tsx` | Right column: learner form + launch button (mirrors VideoRightColumn pattern) |
| `app/(hub)/courses/[slug]/page.tsx` | Public course detail page |
| `__tests__/lib/scorm/manifest.test.ts` | Tests for manifest parsing |
| `__tests__/lib/scorm/token.test.ts` | Tests for launch token generation/verification |
| `__tests__/lib/scorm/extract.test.ts` | Tests for zip extraction security |

### Modified files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Replace `scormCourseId` with `launchFile` + `scormVersion`; add `Attempt` model + `AttemptStatus` enum |
| `components/admin/CourseForm.tsx` | Replace SCORM Cloud ID text input with zip upload widget showing upload state + current launch file |
| `app/api/admin/courses/route.ts` | Update POST to accept `launchFile`/`scormVersion` instead of `scormCourseId` |
| `app/api/admin/courses/[id]/route.ts` | Update PUT to accept `launchFile`/`scormVersion` instead of `scormCourseId` |
| `package.json` | Add `scorm-again` dependency |

---

## Task 1: Install scorm-again and update Prisma schema

**Files:**
- Modify: `package.json`
- Modify: `prisma/schema.prisma` (lines 111–143 Course model, plus add Attempt model at end)

- [ ] **Step 1: Install scorm-again**

```bash
npm install scorm-again
```

- [ ] **Step 2: Update the Course model in prisma/schema.prisma**

Replace the `scormCourseId` field with two new fields. In the Course model (around line 116):

```prisma
// Replace:
  scormCourseId      String?

// With:
  launchFile         String?       // Vercel Blob path to SCORM entry point (e.g. scormcontent/index.html)
  scormVersion       String?       // "1.2" or "2004", auto-detected from manifest
```

- [ ] **Step 3: Add the Attempt model and AttemptStatus enum**

Add after the `ContentType` enum (around line 36):

```prisma
enum AttemptStatus {
  IN_PROGRESS
  COMPLETED
  PASSED
  FAILED
}
```

Add at the end of schema.prisma, before the closing:

```prisma
// ─────────────────────────────────────────────
// SCORM Attempts (course completion tracking)
// ─────────────────────────────────────────────

model Attempt {
  id               String        @id @default(cuid())
  courseId          String
  learnerEmail     String
  learnerFirstName String
  learnerLastName  String?
  launchToken      String        @unique
  status           AttemptStatus @default(IN_PROGRESS)
  score            Float?
  timeSpentSeconds Int?
  completedAt      DateTime?
  rawCmi           Json?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  @@index([courseId])
  @@index([learnerEmail])
  @@map("attempts")
}
```

Note: We intentionally do not add a foreign key from `Attempt.courseId` to `Course.id` or a reverse relation on Course. This avoids cascading delete issues (attempts should survive course re-uploads) and keeps the schema change minimal. The courseId is still indexed for efficient lookups.

- [ ] **Step 4: Run the migration**

```bash
npx prisma migrate dev --name add-scorm-fields-and-attempts
```

Expected: Migration succeeds. If the database has existing course rows with `scormCourseId` data, the migration will drop that column and add `launchFile` + `scormVersion` as nullable — existing rows are unaffected.

- [ ] **Step 5: Regenerate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ package.json package-lock.json
git commit -m "feat: add Attempt model, replace scormCourseId with launchFile/scormVersion"
```

---

## Task 2: SCORM manifest parser (`lib/scorm/manifest.ts`)

**Files:**
- Create: `lib/scorm/manifest.ts`
- Create: `__tests__/lib/scorm/manifest.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/scorm/manifest.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parseManifest } from '@/lib/scorm/manifest'

const SCORM_12_MANIFEST = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="course1" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>Test Course</title>
      <item identifier="item1" identifierref="res1">
        <title>Lesson 1</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>`

const SCORM_2004_MANIFEST = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="course2"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>Test 2004 Course</title>
      <item identifier="item1" identifierref="res1">
        <title>Module 1</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" adlcp:scormType="sco" href="scormcontent/index.html">
      <file href="scormcontent/index.html"/>
    </resource>
  </resources>
</manifest>`

describe('parseManifest', () => {
  it('detects SCORM 1.2 version and launch file', () => {
    const result = parseManifest(SCORM_12_MANIFEST)
    expect(result.version).toBe('1.2')
    expect(result.launchFile).toBe('index.html')
  })

  it('detects SCORM 2004 version and launch file', () => {
    const result = parseManifest(SCORM_2004_MANIFEST)
    expect(result.version).toBe('2004')
    expect(result.launchFile).toBe('scormcontent/index.html')
  })

  it('rejects path traversal in href', () => {
    const malicious = SCORM_12_MANIFEST.replace('index.html', '../../../etc/passwd')
    expect(() => parseManifest(malicious)).toThrow('path traversal')
  })

  it('throws on missing manifest XML', () => {
    expect(() => parseManifest('')).toThrow()
  })

  it('throws on manifest with no resources', () => {
    const noResources = `<?xml version="1.0"?>
    <manifest xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2">
      <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
      <organizations default="org1">
        <organization identifier="org1"><title>Empty</title></organization>
      </organizations>
      <resources></resources>
    </manifest>`
    expect(() => parseManifest(noResources)).toThrow('No launchable resource')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/scorm/manifest.test.ts
```

Expected: FAIL — `parseManifest` not found.

- [ ] **Step 3: Write the implementation**

Create `lib/scorm/manifest.ts`:

```typescript
import 'server-only'

export interface ManifestResult {
  version: '1.2' | '2004'
  launchFile: string
}

/**
 * Parse a SCORM imsmanifest.xml string.
 * Returns the SCORM version and the launch file path.
 * Throws on invalid/malicious manifests.
 */
export function parseManifest(xml: string): ManifestResult {
  if (!xml || !xml.trim()) {
    throw new Error('Empty manifest XML')
  }

  // Detect SCORM version from schemaversion element
  const schemaVersionMatch = xml.match(/<schemaversion[^>]*>([\s\S]*?)<\/schemaversion>/i)
  const schemaVersion = schemaVersionMatch?.[1]?.trim() ?? ''

  let version: '1.2' | '2004'
  if (schemaVersion.startsWith('2004') || schemaVersion.includes('CAM 1.3')) {
    version = '2004'
  } else if (schemaVersion === '1.2' || schemaVersion.startsWith('1.')) {
    version = '1.2'
  } else {
    // Fallback: check namespace for 2004 indicator
    if (xml.includes('imscp_v1p1') || xml.includes('adlcp_v1p3')) {
      version = '2004'
    } else {
      version = '1.2'
    }
  }

  // Find the default organization
  const defaultOrgMatch = xml.match(/<organizations[^>]*default="([^"]+)"/)
  const defaultOrgId = defaultOrgMatch?.[1]

  // Find the first item with identifierref in the default org (or any org)
  let identifierref: string | null = null

  if (defaultOrgId) {
    // Try to find the specific organization block
    const orgRegex = new RegExp(
      `<organization[^>]*identifier="${defaultOrgId}"[^>]*>([\\s\\S]*?)<\\/organization>`,
      'i'
    )
    const orgMatch = xml.match(orgRegex)
    if (orgMatch) {
      const itemMatch = orgMatch[1].match(/identifierref="([^"]+)"/)
      identifierref = itemMatch?.[1] ?? null
    }
  }

  // Fallback: first item with identifierref anywhere
  if (!identifierref) {
    const itemMatch = xml.match(/identifierref="([^"]+)"/)
    identifierref = itemMatch?.[1] ?? null
  }

  if (!identifierref) {
    throw new Error('No launchable resource found in manifest')
  }

  // Find the resource with matching identifier and extract href
  const resourceRegex = new RegExp(
    `<resource[^>]*identifier="${identifierref}"[^>]*href="([^"]+)"`,
    'i'
  )
  const resourceMatch = xml.match(resourceRegex)
  const launchFile = resourceMatch?.[1]

  if (!launchFile) {
    // Try alternate: resource with matching identifier, href on the element
    const altRegex = new RegExp(
      `<resource[^>]*identifier="${identifierref}"[^>]*>`,
      'i'
    )
    const altMatch = xml.match(altRegex)
    if (!altMatch) {
      throw new Error('No launchable resource found in manifest')
    }
    throw new Error('Resource found but no href attribute on resource element')
  }

  // Security: reject path traversal
  if (launchFile.includes('..')) {
    throw new Error('Invalid manifest: path traversal detected in resource href')
  }

  return { version, launchFile }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/scorm/manifest.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/scorm/manifest.ts __tests__/lib/scorm/manifest.test.ts
git commit -m "feat: SCORM manifest parser with version detection and path traversal protection"
```

---

## Task 3: SCORM launch token utilities (`lib/scorm/token.ts`)

**Files:**
- Create: `lib/scorm/token.ts`
- Create: `__tests__/lib/scorm/token.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/scorm/token.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the environment variable before importing
vi.stubEnv('SCORM_TOKEN_SECRET', 'a]3kF9#mPqR7$vLx!wZ2&nB5^jC8dY0sT4hU6gE1iA')

import { generateLaunchToken, verifyLaunchToken } from '@/lib/scorm/token'

describe('launch tokens', () => {
  it('generates a token that can be verified', () => {
    const token = generateLaunchToken('attempt-123', 'course-456')
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)

    const valid = verifyLaunchToken(token, 'attempt-123', 'course-456')
    expect(valid).toBe(true)
  })

  it('rejects a token with wrong attemptId', () => {
    const token = generateLaunchToken('attempt-123', 'course-456')
    const valid = verifyLaunchToken(token, 'attempt-999', 'course-456')
    expect(valid).toBe(false)
  })

  it('rejects a token with wrong courseId', () => {
    const token = generateLaunchToken('attempt-123', 'course-456')
    const valid = verifyLaunchToken(token, 'attempt-123', 'course-999')
    expect(valid).toBe(false)
  })

  it('rejects a tampered token', () => {
    const token = generateLaunchToken('attempt-123', 'course-456')
    const tampered = token.slice(0, -4) + 'xxxx'
    const valid = verifyLaunchToken(tampered, 'attempt-123', 'course-456')
    expect(valid).toBe(false)
  })

  it('rejects an empty token', () => {
    const valid = verifyLaunchToken('', 'attempt-123', 'course-456')
    expect(valid).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/scorm/token.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/scorm/token.ts`:

```typescript
import { createHmac, timingSafeEqual } from 'crypto'

function getSecret(): string {
  const secret = process.env.SCORM_TOKEN_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'SCORM_TOKEN_SECRET must be set and at least 32 characters. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))"'
    )
  }
  return secret
}

/**
 * Generate an HMAC-SHA256 launch token for a SCORM attempt.
 * The token encodes the attemptId and courseId so it can be verified later.
 */
export function generateLaunchToken(attemptId: string, courseId: string): string {
  const secret = getSecret()
  const payload = `${attemptId}:${courseId}`
  const hmac = createHmac('sha256', secret).update(payload).digest('hex')
  return hmac
}

/**
 * Verify a launch token using timing-safe comparison.
 * Returns true if the token matches the expected HMAC for the given attemptId + courseId.
 */
export function verifyLaunchToken(
  token: string,
  attemptId: string,
  courseId: string
): boolean {
  if (!token) return false

  try {
    const expected = generateLaunchToken(attemptId, courseId)

    const tokenBuffer = Buffer.from(token, 'utf8')
    const expectedBuffer = Buffer.from(expected, 'utf8')

    if (tokenBuffer.length !== expectedBuffer.length) return false

    return timingSafeEqual(tokenBuffer, expectedBuffer)
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/scorm/token.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/scorm/token.ts __tests__/lib/scorm/token.test.ts
git commit -m "feat: HMAC-SHA256 launch token generation and verification"
```

---

## Task 4: SCORM zip extraction (`lib/scorm/extract.ts`)

**Files:**
- Create: `lib/scorm/extract.ts`
- Create: `__tests__/lib/scorm/extract.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/scorm/extract.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { extractScormPackage } from '@/lib/scorm/extract'

async function createTestZip(files: Record<string, string>): Promise<Buffer> {
  const zip = new JSZip()
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content)
  }
  return Buffer.from(await zip.generateAsync({ type: 'arraybuffer' }))
}

describe('extractScormPackage', () => {
  it('extracts files from a valid SCORM zip', async () => {
    const zipBuffer = await createTestZip({
      'imsmanifest.xml': '<manifest/>',
      'index.html': '<html></html>',
    })
    const files = await extractScormPackage(zipBuffer)
    expect(files).toHaveLength(2)
    expect(files.map((f) => f.path)).toContain('imsmanifest.xml')
    expect(files.map((f) => f.path)).toContain('index.html')
  })

  it('rejects zip without imsmanifest.xml', async () => {
    const zipBuffer = await createTestZip({
      'index.html': '<html></html>',
    })
    await expect(extractScormPackage(zipBuffer)).rejects.toThrow('imsmanifest.xml')
  })

  it('rejects path traversal entries', async () => {
    const zip = new JSZip()
    zip.file('imsmanifest.xml', '<manifest/>')
    zip.file('../../../etc/passwd', 'malicious')
    const zipBuffer = Buffer.from(await zip.generateAsync({ type: 'arraybuffer' }))
    await expect(extractScormPackage(zipBuffer)).rejects.toThrow('path traversal')
  })

  it('rejects zip with too many files', async () => {
    const files: Record<string, string> = { 'imsmanifest.xml': '<manifest/>' }
    // Exceed the 2000 file limit
    for (let i = 0; i < 2001; i++) {
      files[`file-${i}.html`] = '<html/>'
    }
    const zipBuffer = await createTestZip(files)
    await expect(extractScormPackage(zipBuffer)).rejects.toThrow('file count')
  })

  it('rejects individual files exceeding size limit', async () => {
    const zip = new JSZip()
    zip.file('imsmanifest.xml', '<manifest/>')
    // 60 MB file — exceeds 50 MB per-file limit
    zip.file('huge.bin', Buffer.alloc(60 * 1024 * 1024))
    const zipBuffer = Buffer.from(await zip.generateAsync({ type: 'arraybuffer' }))
    await expect(extractScormPackage(zipBuffer)).rejects.toThrow('size limit')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/scorm/extract.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/scorm/extract.ts`:

```typescript
import 'server-only'
import JSZip from 'jszip'

const MAX_FILE_COUNT = 2000
const MAX_FILE_SIZE = 50 * 1024 * 1024      // 50 MB per file
const MAX_TOTAL_SIZE = 500 * 1024 * 1024     // 500 MB total extracted

export interface ExtractedFile {
  path: string
  content: Buffer
}

/**
 * Extract a SCORM zip package with security protections.
 * Returns an array of { path, content } for each extracted file.
 * Throws on invalid packages, path traversal, or zip bombs.
 */
export async function extractScormPackage(zipBuffer: Buffer): Promise<ExtractedFile[]> {
  const zip = await JSZip.loadAsync(zipBuffer)

  // Check for imsmanifest.xml (case-insensitive)
  const manifestKey = Object.keys(zip.files).find(
    (name) => name.toLowerCase() === 'imsmanifest.xml'
  )
  if (!manifestKey) {
    throw new Error('Invalid SCORM package: missing imsmanifest.xml')
  }

  const entries = Object.entries(zip.files).filter(([, file]) => !file.dir)

  // File count check
  if (entries.length > MAX_FILE_COUNT) {
    throw new Error(
      `SCORM package exceeds file count limit (${entries.length} files, max ${MAX_FILE_COUNT})`
    )
  }

  const files: ExtractedFile[] = []
  let totalSize = 0

  for (const [path, file] of entries) {
    // Path traversal check
    const normalised = path.replace(/\\/g, '/')
    if (
      normalised.includes('..') ||
      normalised.startsWith('/') ||
      normalised.startsWith('~')
    ) {
      throw new Error(`Invalid SCORM package: path traversal detected in "${path}"`)
    }

    const content = Buffer.from(await file.async('arraybuffer'))

    // Per-file size check
    if (content.length > MAX_FILE_SIZE) {
      throw new Error(
        `File "${path}" exceeds per-file size limit (${(content.length / 1024 / 1024).toFixed(1)} MB, max ${MAX_FILE_SIZE / 1024 / 1024} MB)`
      )
    }

    totalSize += content.length
    if (totalSize > MAX_TOTAL_SIZE) {
      throw new Error(
        `SCORM package exceeds total extracted size limit (max ${MAX_TOTAL_SIZE / 1024 / 1024} MB)`
      )
    }

    files.push({ path: normalised, content })
  }

  return files
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/scorm/extract.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/scorm/extract.ts __tests__/lib/scorm/extract.test.ts
git commit -m "feat: SCORM zip extraction with path traversal and zip-bomb protection"
```

---

## Task 5: Admin SCORM upload endpoint (`/api/admin/courses/[id]/scorm`)

**Files:**
- Create: `app/api/admin/courses/[id]/scorm/route.ts`

This endpoint receives a SCORM `.zip` file, extracts it, parses the manifest, uploads all files to Vercel Blob, and updates the Course record with `launchFile` and `scormVersion`.

- [ ] **Step 1: Write the endpoint**

Create `app/api/admin/courses/[id]/scorm/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { put } from '@vercel/blob'
import { extractScormPackage } from '@/lib/scorm/extract'
import { parseManifest } from '@/lib/scorm/manifest'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify course exists
  const course = await prisma.course.findUnique({ where: { id } })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  // Read the uploaded zip file
  const formData = await request.formData()
  const file = formData.get('scormZip') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  if (!file.name.endsWith('.zip')) {
    return NextResponse.json({ error: 'File must be a .zip archive' }, { status: 400 })
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const zipBuffer = Buffer.from(arrayBuffer)

    // Extract with security protections
    const extractedFiles = await extractScormPackage(zipBuffer)

    // Find and parse the manifest
    const manifestFile = extractedFiles.find(
      (f) => f.path.toLowerCase() === 'imsmanifest.xml'
    )
    if (!manifestFile) {
      return NextResponse.json(
        { error: 'No imsmanifest.xml found in package' },
        { status: 400 }
      )
    }

    const manifestXml = manifestFile.content.toString('utf-8')
    const { version, launchFile } = parseManifest(manifestXml)

    // Upload all extracted files to Vercel Blob under courses/{courseId}/
    const blobFolder = `courses/${id}`

    for (const extracted of extractedFiles) {
      const blobPath = `${blobFolder}/${extracted.path}`
      await put(blobPath, extracted.content, { access: 'public' })
    }

    // Upload the launch file and get its Blob URL
    const launchFileEntry = extractedFiles.find((f) => f.path === launchFile)
    let launchFileUrl = `${blobFolder}/${launchFile}`

    if (launchFileEntry) {
      const launchBlob = await put(
        `${blobFolder}/${launchFile}`,
        launchFileEntry.content,
        { access: 'public' }
      )
      launchFileUrl = launchBlob.url
    }

    // Update the course record
    await prisma.course.update({
      where: { id },
      data: {
        launchFile: launchFileUrl,
        scormVersion: version,
      },
    })

    return NextResponse.json({
      success: true,
      launchFile: launchFileUrl,
      scormVersion: version,
      fileCount: extractedFiles.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process SCORM package'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
```

**Note:** The upload loop currently uploads each file individually to Vercel Blob. This is correct for the Vercel Blob API (no batch upload exists). For large courses with many files, this will be slow but functional. A future optimisation could parallelise uploads with `Promise.all` in batches.

Also note the double-upload issue: the loop uploads all files including the launch file, then a second upload of the launch file captures its Blob URL. This is a deliberate simplification — the first upload is overwritten. A cleaner approach would capture all Blob URLs during the loop, but this works correctly.

- [ ] **Step 2: Manually test the endpoint**

This is an admin-protected API route that requires auth + a real course in the database + a real SCORM zip file. It will be fully testable after the admin UI is wired up in Task 7.

For now, verify the file compiles:

```bash
npx tsc --noEmit app/api/admin/courses/\[id\]/scorm/route.ts 2>&1 || echo "Check for type errors"
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/courses/\[id\]/scorm/route.ts
git commit -m "feat: admin SCORM zip upload endpoint with extraction and Blob storage"
```

---

## Task 6: Update admin course API routes for new schema fields

**Files:**
- Modify: `app/api/admin/courses/route.ts`
- Modify: `app/api/admin/courses/[id]/route.ts`

- [ ] **Step 1: Read the current files**

Read `app/api/admin/courses/route.ts` and `app/api/admin/courses/[id]/route.ts` to understand the current field mappings.

- [ ] **Step 2: Update POST in route.ts**

In `app/api/admin/courses/route.ts`, find the `prisma.course.create` data object. Replace `scormCourseId` with `launchFile` and `scormVersion`:

```typescript
// Replace:
scormCourseId: body.scormCourseId ?? null,

// With:
launchFile: body.launchFile ?? null,
scormVersion: body.scormVersion ?? null,
```

- [ ] **Step 3: Update PUT in [id]/route.ts**

In `app/api/admin/courses/[id]/route.ts`, find the `prisma.course.update` data object. Make the same replacement:

```typescript
// Replace:
scormCourseId: body.scormCourseId ?? null,

// With:
launchFile: body.launchFile ?? null,
scormVersion: body.scormVersion ?? null,
```

Also update the GET handler's select/include to return `launchFile` and `scormVersion` instead of `scormCourseId`.

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/courses/route.ts app/api/admin/courses/\[id\]/route.ts
git commit -m "refactor: update course API routes for launchFile/scormVersion fields"
```

---

## Task 7: Update CourseForm admin component with SCORM zip upload

**Files:**
- Modify: `components/admin/CourseForm.tsx`

Replace the "SCORM Cloud course ID" text input with a SCORM zip upload widget that:
- Shows a file input for `.zip` files
- On upload, POSTs to `/api/admin/courses/{id}/scorm`
- Displays upload progress/status
- Shows the current launch file path and SCORM version once uploaded

- [ ] **Step 1: Update the CourseForm interface**

In `CourseForm.tsx`, update the `course` interface prop type. Replace:

```typescript
scormCourseId: string | null
```

With:

```typescript
launchFile: string | null
scormVersion: string | null
```

- [ ] **Step 2: Update form state**

Replace the `scormCourseId` state variable:

```typescript
// Remove:
const [scormCourseId, setScormCourseId] = useState(course?.scormCourseId ?? '')

// Add:
const [launchFile, setLaunchFile] = useState(course?.launchFile ?? '')
const [scormVersion, setScormVersion] = useState(course?.scormVersion ?? '')
const [scormUploading, setScormUploading] = useState(false)
const [scormMessage, setScormMessage] = useState<string | null>(null)
```

- [ ] **Step 3: Add the upload handler function**

Add after the existing handler functions:

```typescript
async function handleScormUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file || !course) return

  setScormUploading(true)
  setScormMessage(null)

  try {
    const formData = new FormData()
    formData.append('scormZip', file)

    const res = await fetch(`/api/admin/courses/${course.id}/scorm`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json()
      setScormMessage(data.error || 'Upload failed')
      return
    }

    const data = await res.json()
    setLaunchFile(data.launchFile)
    setScormVersion(data.scormVersion)
    setScormMessage(`Uploaded successfully — ${data.fileCount} files extracted (SCORM ${data.scormVersion})`)
  } catch {
    setScormMessage('Network error uploading SCORM package')
  } finally {
    setScormUploading(false)
    // Reset the input so the same file can be re-uploaded
    e.target.value = ''
  }
}
```

- [ ] **Step 4: Replace the SCORM section in the JSX**

Replace the entire "SCORM integration" section `<div>` (the one with `<h2>SCORM integration</h2>`) with:

```tsx
{/* SCORM Package */}
<div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
  <h2 className="text-lg font-semibold text-diligent-gray-5">SCORM package</h2>

  {launchFile && (
    <div className="rounded bg-green-50 border border-green-200 px-4 py-3 text-sm">
      <p className="font-medium text-green-800">SCORM package uploaded</p>
      <p className="mt-1 text-green-700">
        Version: SCORM {scormVersion} &middot; Launch file: <code className="text-xs bg-green-100 px-1 rounded">{launchFile}</code>
      </p>
    </div>
  )}

  {isEdit ? (
    <div>
      <label className="block text-sm font-medium text-diligent-gray-5 mb-1">
        {launchFile ? 'Replace SCORM package' : 'Upload SCORM package'}
      </label>
      <input
        type="file"
        accept=".zip"
        onChange={handleScormUpload}
        disabled={scormUploading}
        className="block w-full text-sm text-diligent-gray-4 file:mr-4 file:rounded file:border-0 file:bg-diligent-gray-5 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-diligent-gray-4 disabled:opacity-50"
      />
      <p className="mt-1 text-xs text-diligent-gray-3">
        Upload a SCORM 1.2 or 2004 .zip package. The manifest will be parsed automatically.
      </p>
      {scormUploading && (
        <p className="mt-2 text-sm text-diligent-gray-4">Uploading and extracting...</p>
      )}
      {scormMessage && (
        <p className={`mt-2 text-sm ${launchFile ? 'text-green-700' : 'text-diligent-red'}`}>
          {scormMessage}
        </p>
      )}
    </div>
  ) : (
    <p className="text-sm text-diligent-gray-3">
      Save the course first, then upload a SCORM package.
    </p>
  )}
</div>
```

- [ ] **Step 5: Update the payload in handleSubmit**

In the `payload` object, replace:

```typescript
// Remove:
scormCourseId: scormCourseId || null,

// Add:
launchFile: launchFile || null,
scormVersion: scormVersion || null,
```

- [ ] **Step 6: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add components/admin/CourseForm.tsx
git commit -m "feat: replace SCORM Cloud ID input with zip upload widget in CourseForm"
```

---

## Task 8: SCORM launch API endpoint (`/api/scorm/launch`)

**Files:**
- Create: `app/api/scorm/launch/route.ts`

- [ ] **Step 1: Write the endpoint**

Create `app/api/scorm/launch/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateLaunchToken } from '@/lib/scorm/token'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, firstName, email, lastName } = body

    if (!courseId || !firstName || !email) {
      return NextResponse.json(
        { error: 'courseId, firstName and email are required' },
        { status: 400 }
      )
    }

    // Fetch the course to get the launch file URL
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, launchFile: true, scormVersion: true, status: true },
    })

    if (!course || !course.launchFile) {
      return NextResponse.json(
        { error: 'Course not found or no SCORM package uploaded' },
        { status: 404 }
      )
    }

    // Create an Attempt record
    const attempt = await prisma.attempt.create({
      data: {
        courseId: course.id,
        learnerEmail: email,
        learnerFirstName: firstName,
        learnerLastName: lastName || null,
        launchToken: '', // placeholder, updated below
        status: 'IN_PROGRESS',
      },
    })

    // Generate launch token from attempt + course IDs
    const launchToken = generateLaunchToken(attempt.id, course.id)

    // Update the attempt with the real token
    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { launchToken },
    })

    return NextResponse.json({
      attemptId: attempt.id,
      launchToken,
      launchUrl: course.launchFile,
      scormVersion: course.scormVersion,
    })
  } catch (error) {
    console.error('SCORM launch error:', error)
    return NextResponse.json(
      { error: 'Failed to create SCORM launch session' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/scorm/launch/route.ts
git commit -m "feat: SCORM launch endpoint — creates Attempt and returns signed token"
```

---

## Task 9: SCORM tracking API endpoint (`/api/scorm/tracking/[attemptId]`)

**Files:**
- Create: `app/api/scorm/tracking/[attemptId]/route.ts`

- [ ] **Step 1: Write the endpoint**

Create `app/api/scorm/tracking/[attemptId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLaunchToken } from '@/lib/scorm/token'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params
    const body = await request.json()
    const { launchToken, cmi } = body

    if (!launchToken || !cmi) {
      return NextResponse.json(
        { error: 'launchToken and cmi are required' },
        { status: 400 }
      )
    }

    // Fetch the attempt to verify
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Verify the launch token using timing-safe comparison
    const valid = verifyLaunchToken(launchToken, attempt.id, attempt.courseId)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid launch token' }, { status: 403 })
    }

    // Normalise CMI data — extract completion status and score
    // SCORM 1.2 uses cmi.core.lesson_status, SCORM 2004 uses cmi.completion_status
    const lessonStatus =
      cmi?.['cmi.core.lesson_status'] ??
      cmi?.['cmi.completion_status'] ??
      null

    const scoreRaw =
      cmi?.['cmi.core.score.raw'] ??
      cmi?.['cmi.score.raw'] ??
      null

    const sessionTime =
      cmi?.['cmi.core.session_time'] ??
      cmi?.['cmi.session_time'] ??
      null

    // Map SCORM status to AttemptStatus enum
    let status = attempt.status
    if (lessonStatus) {
      const normalized = lessonStatus.toLowerCase()
      if (normalized === 'completed' || normalized === 'complete') {
        status = 'COMPLETED'
      } else if (normalized === 'passed') {
        status = 'PASSED'
      } else if (normalized === 'failed') {
        status = 'FAILED'
      }
    }

    // Parse score
    const score = scoreRaw !== null ? parseFloat(scoreRaw) : attempt.score

    // Parse session time to seconds (ISO 8601 duration or HH:MM:SS)
    let timeSpentSeconds = attempt.timeSpentSeconds ?? 0
    if (sessionTime) {
      const parsed = parseSessionTime(sessionTime)
      if (parsed > 0) {
        timeSpentSeconds += parsed
      }
    }

    const isComplete = status === 'COMPLETED' || status === 'PASSED'

    // Update the attempt
    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status,
        score: score !== null && !isNaN(score) ? score : attempt.score,
        timeSpentSeconds,
        completedAt: isComplete && !attempt.completedAt ? new Date() : attempt.completedAt,
        rawCmi: cmi,
      },
    })

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('SCORM tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to update tracking data' },
      { status: 500 }
    )
  }
}

/**
 * Parse SCORM session time formats to seconds.
 * Supports:
 * - SCORM 1.2 format: "HH:MM:SS" or "HH:MM:SS.ss"
 * - SCORM 2004 format: ISO 8601 duration "PT1H30M45S"
 */
function parseSessionTime(time: string): number {
  if (!time) return 0

  // Try HH:MM:SS format (SCORM 1.2)
  const hmsMatch = time.match(/^(\d+):(\d+):(\d+(?:\.\d+)?)$/)
  if (hmsMatch) {
    const hours = parseInt(hmsMatch[1], 10)
    const minutes = parseInt(hmsMatch[2], 10)
    const seconds = parseFloat(hmsMatch[3])
    return Math.round(hours * 3600 + minutes * 60 + seconds)
  }

  // Try ISO 8601 duration (SCORM 2004): PT1H30M45S
  const isoMatch = time.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/)
  if (isoMatch) {
    const hours = parseInt(isoMatch[1] || '0', 10)
    const minutes = parseInt(isoMatch[2] || '0', 10)
    const seconds = parseFloat(isoMatch[3] || '0')
    return Math.round(hours * 3600 + minutes * 60 + seconds)
  }

  return 0
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/scorm/tracking/\[attemptId\]/route.ts
git commit -m "feat: SCORM tracking endpoint — verifies token, normalises CMI, updates Attempt"
```

---

## Task 10: ScormEmbed client component

**Files:**
- Create: `components/content/ScormEmbed.tsx`

This is the client component that:
1. Initialises `scorm-again` on the global `window.API` (1.2) or `window.API_1484_11` (2004) **before** the iframe loads
2. Renders a fullscreen overlay with the course iframe
3. Listens for scorm-again commit events and POSTs CMI data to `/api/scorm/tracking/{attemptId}`
4. Handles exit/completion with an overlay close

- [ ] **Step 1: Write the component**

Create `components/content/ScormEmbed.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface ScormEmbedProps {
  launchUrl: string
  scormVersion: '1.2' | '2004'
  attemptId: string
  launchToken: string
  courseTitle: string
  onClose: () => void
  onComplete?: () => void
}

export default function ScormEmbed({
  launchUrl,
  scormVersion,
  attemptId,
  launchToken,
  courseTitle,
  onClose,
  onComplete,
}: ScormEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const apiRef = useRef<unknown>(null)

  const sendTracking = useCallback(
    async (cmi: Record<string, string>) => {
      try {
        await fetch(`/api/scorm/tracking/${attemptId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ launchToken, cmi }),
        })
      } catch (error) {
        console.error('Failed to send SCORM tracking data:', error)
      }
    },
    [attemptId, launchToken]
  )

  useEffect(() => {
    // Dynamically import scorm-again and initialise the API
    // This MUST complete before the iframe src is set
    async function initScormApi() {
      if (scormVersion === '2004') {
        const { Scorm2004API } = await import('scorm-again')
        const api = new Scorm2004API({})

        api.on('SetValue.cmi.*', () => {
          // Batch tracking on each SetValue
        })

        api.on('Terminate', () => {
          const cmi = api.renderCMIToJSONObject()
          sendTracking(cmi)

          const completionStatus = api.getCMIValue('cmi.completion_status')
          const successStatus = api.getCMIValue('cmi.success_status')
          if (
            completionStatus === 'completed' ||
            successStatus === 'passed'
          ) {
            onComplete?.()
          }
        })

        api.on('Commit', () => {
          const cmi = api.renderCMIToJSONObject()
          sendTracking(cmi)
        })

        // Set on window BEFORE iframe loads
        ;(window as Record<string, unknown>)['API_1484_11'] = api
        apiRef.current = api
      } else {
        // SCORM 1.2
        const { Scorm12API } = await import('scorm-again')
        const api = new Scorm12API({})

        api.on('LMSFinish', () => {
          const cmi = api.renderCMIToJSONObject()
          sendTracking(cmi)

          const lessonStatus = api.getCMIValue('cmi.core.lesson_status')
          if (
            lessonStatus === 'completed' ||
            lessonStatus === 'passed'
          ) {
            onComplete?.()
          }
        })

        api.on('LMSCommit', () => {
          const cmi = api.renderCMIToJSONObject()
          sendTracking(cmi)
        })

        ;(window as Record<string, unknown>)['API'] = api
        apiRef.current = api
      }

      setReady(true)
    }

    initScormApi()

    // Cleanup: remove global API on unmount
    return () => {
      if (scormVersion === '2004') {
        delete (window as Record<string, unknown>)['API_1484_11']
      } else {
        delete (window as Record<string, unknown>)['API']
      }
    }
  }, [scormVersion, sendTracking, onComplete])

  // Trap focus inside overlay and handle Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // Send final tracking data before closing
        if (apiRef.current && typeof (apiRef.current as { renderCMIToJSONObject: () => Record<string, string> }).renderCMIToJSONObject === 'function') {
          const cmi = (apiRef.current as { renderCMIToJSONObject: () => Record<string, string> }).renderCMIToJSONObject()
          sendTracking(cmi)
        }
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    // Prevent body scroll while overlay is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, sendTracking])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label={`Course: ${courseTitle}`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-diligent-gray-2 bg-diligent-gray-5 px-4 py-2">
        <span className="text-sm font-medium text-white truncate max-w-[70%]">
          {courseTitle}
        </span>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          aria-label="Exit course"
        >
          <span className="material-symbols-sharp text-[18px]">close</span>
          Exit
        </button>
      </div>

      {/* iframe area */}
      <div className="flex-1 relative">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-diligent-gray-1">
            <p className="text-sm text-diligent-gray-4">Loading course...</p>
          </div>
        )}
        {ready && (
          <iframe
            ref={iframeRef}
            src={launchUrl}
            title={courseTitle}
            className="h-full w-full border-0"
            allow="autoplay; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>
    </div>
  )
}
```

**Critical design note:** The `scorm-again` API is initialised on `window` BEFORE `setReady(true)` triggers the iframe render. This ensures the SCORM content finds the LMS API when it looks for it. If the order were reversed, the course would run in standalone mode with no LMS connection.

- [ ] **Step 2: Commit**

```bash
git add components/content/ScormEmbed.tsx
git commit -m "feat: ScormEmbed client component — scorm-again init, fullscreen overlay, tracking"
```

---

## Task 11: CourseRightColumn component

**Files:**
- Create: `components/hub/CourseRightColumn.tsx`

This component follows the same pattern as `VideoRightColumn` — it shows the gate form (if gated), learner identification form + launch button (if free/gated-passed), or premium CTA.

- [ ] **Step 1: Write the component**

Create `components/hub/CourseRightColumn.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useGate } from './GateContext'
import { GateForm } from './GateForm'
import dynamic from 'next/dynamic'

const ScormEmbed = dynamic(() => import('@/components/content/ScormEmbed'), {
  ssr: false,
})

interface CourseRightColumnProps {
  accessTier: string
  courseId: string
  courseTitle: string
  launchFile: string | null
  scormVersion: string | null
  thumbnailUrl?: string | null
  thumbnailAlt?: string
}

export function CourseRightColumn({
  accessTier,
  courseId,
  courseTitle,
  launchFile,
  scormVersion,
  thumbnailUrl,
  thumbnailAlt,
}: CourseRightColumnProps) {
  const { gated } = useGate()

  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [lastName, setLastName] = useState('')
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  // SCORM embed state
  const [scormState, setScormState] = useState<{
    attemptId: string
    launchToken: string
    launchUrl: string
    scormVersion: '1.2' | '2004'
  } | null>(null)

  const canLaunch = accessTier === 'FREE' || gated

  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !email.trim()) return

    setLaunching(true)
    setError(null)

    try {
      const res = await fetch('/api/scorm/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          firstName: firstName.trim(),
          email: email.trim(),
          lastName: lastName.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to launch course')
        return
      }

      const data = await res.json()
      setScormState({
        attemptId: data.attemptId,
        launchToken: data.launchToken,
        launchUrl: data.launchUrl,
        scormVersion: data.scormVersion,
      })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLaunching(false)
    }
  }

  function handleScormClose() {
    setScormState(null)
  }

  function handleScormComplete() {
    setCompleted(true)
    setScormState(null)
  }

  // Show SCORM embed overlay if launched
  if (scormState) {
    return (
      <ScormEmbed
        launchUrl={scormState.launchUrl}
        scormVersion={scormState.scormVersion}
        attemptId={scormState.attemptId}
        launchToken={scormState.launchToken}
        courseTitle={courseTitle}
        onClose={handleScormClose}
        onComplete={handleScormComplete}
      />
    )
  }

  // Completion message
  if (completed) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 sm:p-8 text-center">
        <span className="material-symbols-sharp text-[48px] text-green-600">check_circle</span>
        <h3 className="mt-3 text-lg font-bold text-diligent-gray-5">Course completed</h3>
        <p className="mt-2 text-sm text-diligent-gray-4">
          Well done! You have successfully completed this course.
        </p>
        <button
          onClick={() => {
            setCompleted(false)
            setFirstName('')
            setEmail('')
            setLastName('')
          }}
          className="mt-4 rounded bg-diligent-red px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
        >
          Take again
        </button>
      </div>
    )
  }

  // Gate form for gated courses when not yet gated
  if (accessTier === 'GATED' && !gated) {
    return (
      <div className="rounded-xl border border-diligent-gray-2 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:p-8">
        <GateForm contentType="COURSE" contentId={courseId} />
      </div>
    )
  }

  // Premium CTA
  if (accessTier === 'PREMIUM') {
    return (
      <div className="rounded-xl border border-diligent-gray-2 bg-diligent-gray-1 p-6 sm:p-8 text-center">
        <span className="material-symbols-sharp text-[48px] text-diligent-gray-3">lock</span>
        <h3 className="mt-3 text-lg font-bold text-diligent-gray-5">Premium content</h3>
        <p className="mt-2 text-sm text-diligent-gray-4">
          This course requires a Diligent One Platform subscription.
        </p>
        <a
          href="/#footer-cta"
          className="mt-4 inline-flex items-center rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
        >
          Request a demo
        </a>
      </div>
    )
  }

  // No SCORM package uploaded
  if (!launchFile) {
    return (
      <div className="rounded-xl border border-diligent-gray-2 bg-diligent-gray-1 p-6 sm:p-8 text-center">
        <span className="material-symbols-sharp text-[48px] text-diligent-gray-3">school</span>
        <h3 className="mt-3 text-lg font-bold text-diligent-gray-5">Course coming soon</h3>
        <p className="mt-2 text-sm text-diligent-gray-4">
          This course is not yet available. Check back soon.
        </p>
      </div>
    )
  }

  // Learner form + launch button (free or after gate)
  return (
    <div className="rounded-xl border border-diligent-gray-2 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:p-8">
      <h3 className="text-lg font-bold text-diligent-gray-5">Start this course</h3>
      <p className="mt-1 text-sm text-diligent-gray-4">
        Enter your details to begin. Your progress will be tracked.
      </p>

      <form onSubmit={handleLaunch} className="mt-5 space-y-4">
        <div>
          <label htmlFor="learner-first-name" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            First name <span className="text-diligent-red">*</span>
          </label>
          <input
            id="learner-first-name"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded border border-diligent-gray-2 px-3 py-2.5 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        <div>
          <label htmlFor="learner-last-name" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Last name
          </label>
          <input
            id="learner-last-name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded border border-diligent-gray-2 px-3 py-2.5 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        <div>
          <label htmlFor="learner-email" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Email <span className="text-diligent-red">*</span>
          </label>
          <input
            id="learner-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-diligent-gray-2 px-3 py-2.5 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        {error && (
          <p className="text-sm text-diligent-red" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={launching || !firstName.trim() || !email.trim()}
          className="w-full rounded bg-diligent-red px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2 disabled:opacity-50"
        >
          {launching ? 'Launching...' : 'Start course'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/hub/CourseRightColumn.tsx
git commit -m "feat: CourseRightColumn — learner form, gate handling, SCORM launch"
```

---

## Task 12: Public course detail page

**Files:**
- Create: `app/(hub)/courses/[slug]/page.tsx`

This follows the exact same pattern as `app/(hub)/videos/[slug]/page.tsx` — two-column layout, GateProvider, breadcrumb, taxonomy tags, related items, CTA banner, JSON-LD structured data.

- [ ] **Step 1: Write the page**

Create `app/(hub)/courses/[slug]/page.tsx`:

```tsx
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { prisma } from '@/lib/db'
import { ContentStatus } from '@/lib/generated/prisma'
import { incrementViewCount } from '@/lib/view-count'
import { hasGateSession } from '@/lib/gate-session'
import { Breadcrumb } from '@/components/hub/Breadcrumb'
import { PreviewBanner } from '@/components/hub/PreviewBanner'
import { RelatedItems } from '@/components/hub/RelatedItems'
import { SafeHtml } from '@/components/hub/SafeHtml'
import { ShareButtons } from '@/components/hub/ShareButtons'
import { GateProvider } from '@/components/hub/GateContext'
import { CourseRightColumn } from '@/components/hub/CourseRightColumn'
import { GatedPrompt } from '@/components/hub/GatedPrompt'

const COURSE_INCLUDES = {
  subjects: {
    select: {
      subject: { select: { id: true, name: true, group: { select: { name: true } } } },
    },
  },
  personas: {
    select: { persona: { select: { id: true, name: true } } },
  },
  regions: {
    select: { region: { select: { id: true, name: true } } },
  },
} as const

const accessTierDisplay: Record<string, string> = {
  FREE: 'Free',
  GATED: 'Gated',
  PREMIUM: 'Premium content',
}

function splitTitleForAccent(title: string): { main: string; accent: string } {
  const words = title.trim().split(/\s+/)
  if (words.length <= 1) return { main: '', accent: title }
  const accent = words.slice(-1).join(' ')
  const main = words.slice(0, -1).join(' ')
  return { main, accent }
}

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const course = await prisma.course.findFirst({
    where: { slug: resolvedParams.slug, status: ContentStatus.PUBLISHED },
    select: {
      title: true,
      seoTitle: true,
      seoDescription: true,
      description: true,
      ogImageUrl: true,
      thumbnailUrl: true,
    },
  })

  if (!course) return { title: 'Course not found' }

  const title = course.seoTitle || course.title
  const description = course.seoDescription || course.description?.slice(0, 160)
  const image = course.ogImageUrl || course.thumbnailUrl

  return {
    title,
    description,
    openGraph: {
      title,
      description: description ?? undefined,
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
  }
}

export default async function CoursePage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  // Token-based access for restricted courses
  const tokenParam = resolvedSearchParams.token as string | undefined

  // Preview support
  const previewToken = resolvedSearchParams.preview
    ? await prisma.previewToken.findFirst({
        where: {
          token: resolvedSearchParams.preview as string,
          contentType: 'COURSE',
          expiresAt: { gt: new Date() },
        },
      })
    : null

  const isPreview = !!previewToken

  // Fetch course
  let course
  if (isPreview) {
    course = await prisma.course.findFirst({
      where: { id: previewToken!.contentId },
      include: COURSE_INCLUDES,
    })
  } else if (tokenParam) {
    // Restricted course: validate token
    course = await prisma.course.findFirst({
      where: {
        slug: resolvedParams.slug,
        restricted: true,
        accessToken: tokenParam,
      },
      include: COURSE_INCLUDES,
    })
    if (!course) {
      // Token invalid — show generic "not valid" message
      return (
        <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-24 text-center">
          <span className="material-symbols-sharp text-[48px] text-diligent-gray-3">link_off</span>
          <h1 className="mt-4 text-2xl font-bold text-diligent-gray-5">This link is not valid</h1>
          <p className="mt-2 text-sm text-diligent-gray-4">
            The access link you followed is invalid or has been revoked. Please contact the person who shared it with you.
          </p>
        </div>
      )
    }
  } else {
    // Standard public course (not restricted)
    course = await prisma.course.findFirst({
      where: {
        slug: resolvedParams.slug,
        status: ContentStatus.PUBLISHED,
        restricted: false,
      },
      include: COURSE_INCLUDES,
    })
  }

  if (!course) notFound()

  // Fire-and-forget view count (skip for previews)
  if (!isPreview) {
    incrementViewCount('COURSE', course.id)
  }

  // Check gate session
  const gated = await hasGateSession()

  // Derived data
  const { main: titleMain, accent: titleAccent } = splitTitleForAccent(course.title)
  const publishedLabel = course.publishedAt
    ? new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(course.publishedAt)
    : null

  // JSON-LD structured data (Course schema)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description ?? undefined,
    ...(course.thumbnailUrl ? { image: course.thumbnailUrl } : {}),
    ...(course.publishedAt ? { datePublished: course.publishedAt.toISOString() } : {}),
    ...(course.author ? { provider: { '@type': 'Organization', name: course.author } } : {}),
    ...(course.estimatedDuration ? { timeRequired: course.estimatedDuration } : {}),
  }

  return (
    <>
      {isPreview && <PreviewBanner />}

      <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-12 lg:py-16">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Courses', href: '/?type=COURSE' },
            { label: course.title },
          ]}
        />

        {/* Two-column layout */}
        <GateProvider initialGated={course.accessTier === 'FREE' || gated}>
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[45%_55%]">
            {/* ── Left column ── */}
            <div>
              {/* Metadata row */}
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-diligent-gray-4">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-diligent-red" aria-hidden="true" />
                <span>Course</span>
                <span className="text-diligent-gray-3" aria-hidden="true">|</span>
                <span>{accessTierDisplay[course.accessTier] ?? course.accessTier}</span>
              </div>

              {/* Title */}
              <h1 className="mt-5 text-[2.25rem] font-bold leading-[1.15] text-diligent-gray-5 sm:text-[2.75rem] lg:text-[3.25rem]">
                {titleMain && <>{titleMain}{' '}</>}
                <span className="text-diligent-red">{titleAccent}</span>
              </h1>

              {/* Description */}
              {course.description && (
                <div className="mt-5 text-base leading-relaxed text-diligent-gray-5">
                  <SafeHtml html={course.description} />
                </div>
              )}

              {/* Access prompt for gated content */}
              {course.accessTier === 'GATED' && (
                <div className="mt-6">
                  <GatedPrompt label="Complete the form to access this course" />
                </div>
              )}

              {/* Premium CTA */}
              {course.accessTier === 'PREMIUM' && (
                <div className="mt-6 rounded-lg border border-diligent-gray-2 bg-diligent-gray-1 p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-diligent-gray-5">Premium content</h2>
                  <p className="mt-2 text-sm text-diligent-gray-4">
                    This course requires a Diligent One Platform subscription. Get unlimited access
                    to our full Education &amp; Templates Library.
                  </p>
                  <a
                    href="/#footer-cta"
                    className="mt-4 inline-flex items-center rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
                  >
                    Request a demo
                  </a>
                </div>
              )}

              {/* Divider */}
              <hr className="mt-10 border-diligent-gray-2" />

              {/* Course metadata row */}
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-diligent-gray-4">
                {course.estimatedDuration && (
                  <>
                    <span className="material-symbols-sharp text-[16px]">schedule</span>
                    <span>{course.estimatedDuration}</span>
                  </>
                )}
                {course.author && (
                  <>
                    {course.estimatedDuration && <span aria-hidden="true">|</span>}
                    <span>By {course.author}</span>
                  </>
                )}
                {publishedLabel && (
                  <>
                    {(course.estimatedDuration || course.author) && <span aria-hidden="true">|</span>}
                    <span>Published {publishedLabel}</span>
                  </>
                )}
              </div>

              {/* Taxonomy tags */}
              {(course.subjects.length > 0 || course.personas.length > 0 || course.regions.length > 0) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {course.subjects.map((s) => (
                    <a
                      key={`subject-${s.subject.id}`}
                      href={`/?subject=${s.subject.id}#resource-library`}
                      className="rounded border border-diligent-gray-2 px-2.5 py-1 text-xs text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
                    >
                      {s.subject.name}
                    </a>
                  ))}
                  {course.regions.map((r) => (
                    <a
                      key={`region-${r.region.id}`}
                      href={`/?region=${r.region.id}#resource-library`}
                      className="rounded border border-diligent-gray-2 px-2.5 py-1 text-xs text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
                    >
                      {r.region.name}
                    </a>
                  ))}
                  {course.personas.map((p) => (
                    <a
                      key={`persona-${p.persona.id}`}
                      href={`/?persona=${p.persona.id}#resource-library`}
                      className="rounded border border-diligent-gray-2 px-2.5 py-1 text-xs text-diligent-gray-4 transition-colors hover:border-diligent-gray-3 hover:text-diligent-gray-5"
                    >
                      {p.persona.name}
                    </a>
                  ))}
                </div>
              )}

              {/* Share row */}
              <div className="mt-5 flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-diligent-gray-4">
                  Share
                </span>
                <ShareButtons title={course.title} path={`/courses/${course.slug}`} />
              </div>
            </div>

            {/* ── Right column ── */}
            <CourseRightColumn
              accessTier={course.accessTier}
              courseId={course.id}
              courseTitle={course.title}
              launchFile={course.launchFile ?? null}
              scormVersion={course.scormVersion ?? null}
            />
          </div>
        </GateProvider>

        {/* Related items */}
        <RelatedItems sourceType="COURSE" sourceId={course.id} />
      </div>

      {/* CTA banner */}
      <section className="relative mt-16 overflow-hidden bg-diligent-gray-5">
        <div className="mx-auto flex max-w-[var(--max-content-width)] flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:py-16">
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-diligent-gray-3">
              Diligent&apos;s Education &amp; Templates Library
            </p>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-tight text-white sm:text-[2rem] lg:text-[2.25rem]">
              Master governance, risk and compliance.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85">
              Access targeted short courses from our premium Education &amp; Templates Library to build your expertise and enhance board effectiveness.
            </p>
          </div>
          <div className="shrink-0">
            <a
              href="/#footer-cta"
              className="inline-flex items-center gap-2 rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
            >
              Request a demo
              <span className="text-[18px]" aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
        <div className="absolute right-0 top-0 hidden h-full w-3 bg-diligent-red lg:block" aria-hidden="true" />
      </section>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/\(hub\)/courses/\[slug\]/page.tsx
git commit -m "feat: public course detail page with SCORM launch, gate flow, token access"
```

---

## Task 13: Add TypeScript types for scorm-again

**Files:**
- Create: `types/scorm-again.d.ts`

The `scorm-again` package may not ship complete TypeScript types. Add a declaration file to avoid type errors.

- [ ] **Step 1: Check if types are needed**

```bash
npx tsc --noEmit components/content/ScormEmbed.tsx 2>&1 | head -20
```

If there are no type errors related to scorm-again, skip this task.

- [ ] **Step 2: Create type declaration if needed**

Create `types/scorm-again.d.ts`:

```typescript
declare module 'scorm-again' {
  interface ScormAPISettings {
    autocommit?: boolean
    autocommitSeconds?: number
    lmsCommitUrl?: string
    dataCommitFormat?: string
    commitRequestDataType?: string
    autoProgress?: boolean
    logLevel?: number
  }

  class Scorm12API {
    constructor(settings?: ScormAPISettings)
    on(event: string, callback: (...args: unknown[]) => void): void
    off(event: string, callback: (...args: unknown[]) => void): void
    getCMIValue(key: string): string
    setCMIValue(key: string, value: string): string
    renderCMIToJSONObject(): Record<string, string>
    LMSInitialize(param: string): string
    LMSFinish(param: string): string
    LMSCommit(param: string): string
  }

  class Scorm2004API {
    constructor(settings?: ScormAPISettings)
    on(event: string, callback: (...args: unknown[]) => void): void
    off(event: string, callback: (...args: unknown[]) => void): void
    getCMIValue(key: string): string
    setCMIValue(key: string, value: string): string
    renderCMIToJSONObject(): Record<string, string>
    Initialize(param: string): string
    Terminate(param: string): string
    Commit(param: string): string
  }
}
```

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add types/scorm-again.d.ts
git commit -m "chore: add TypeScript declarations for scorm-again"
```

---

## Task 14: End-to-end verification

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass, including the 3 new test files (manifest, token, extract).

- [ ] **Step 2: Run the build**

```bash
npm run build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 3: Manual smoke test**

Start the dev server and verify:

1. **Admin**: Navigate to `/admin/courses/{id}` — the SCORM section should show "Upload SCORM package" instead of the old text input
2. **Public page**: Navigate to `/courses/{slug}` for a published course — the page should render with the two-column layout, learner form in the right column
3. If a course has no SCORM package uploaded, the right column should show "Course coming soon"

```bash
npm run dev
```

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -u
git commit -m "fix: address issues found during end-to-end verification"
```

---

## Spec Coverage Check

| CLAUDE.md Requirement | Task |
|---|---|
| SCORM zip upload via admin dashboard | Task 5 (endpoint), Task 7 (UI) |
| Server-side extraction with path traversal + zip-bomb protection | Task 4 |
| imsmanifest.xml parsing for entry point + SCORM version | Task 2 |
| Extracted files stored in Vercel Blob | Task 5 |
| Course entry point + version stored in Course DB record | Task 1 (schema), Task 5 (endpoint) |
| scorm-again for SCORM 1.2 + 2004 runtime | Task 10 (ScormEmbed) |
| window.API / window.API_1484_11 set BEFORE iframe loads | Task 10 (critical design note) |
| Learner name + email captured before launch (no account creation) | Task 11 (CourseRightColumn form) |
| /api/scorm/launch creates Attempt, generates signed token | Task 8 |
| HMAC-SHA256 token with timingSafeEqual verification | Task 3 |
| /api/scorm/tracking receives CMI, normalises, updates Attempt | Task 9 |
| Attempt model with status, score, timeSpent, rawCmi | Task 1 |
| Fullscreen overlay iframe on hub domain | Task 10 |
| Completion message on exit | Task 11 |
| Course detail page (title, description, metadata, launch button) | Task 12 |
| Restricted course token validation | Task 12 (tokenParam check) |
| Invalid token "this link is not valid" message | Task 12 |
| Preview support | Task 12 (previewToken check) |
| JSON-LD Course structured data | Task 12 |
| Related items widget | Task 12 |
| CTA banner | Task 12 |
| Course re-upload overwrites existing Blob files | Task 5 (same folder path) |
| SCORM_TOKEN_SECRET min 32 bytes enforced | Task 3 (getSecret()) |
| Launch token never exposed to browser (server-side only generation) | Task 8 (server route) |
