# 301 Redirects Middleware Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Intercept incoming requests and perform 301 redirects based on redirect rules managed in the admin dashboard.

**Architecture:** A new public API endpoint (`/api/redirects`) returns all redirect rules. The Next.js middleware is rewritten to combine the existing NextAuth admin protection with redirect lookups. Redirects are fetched once per cold start and cached in-memory with a 60-second TTL to avoid a database call on every request. Both relative (`/old-path`) and absolute (`https://example.com`) destinations are supported.

**Tech Stack:** Next.js middleware, NextResponse, in-memory cache

---

### Why not use Prisma directly in middleware?

Next.js Edge Middleware runs in the Edge Runtime, which does not support Node.js APIs that Prisma requires. The middleware must fetch redirects via an HTTP call to a standard API route, which runs in the Node.js runtime and can use Prisma.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `app/api/redirects/route.ts` | Public (no auth) GET endpoint returning all redirect rules |
| Modify | `middleware.ts` | Combine admin auth protection + 301 redirect interception |

---

### Task 1: Create the public redirects API endpoint

**Files:**
- Create: `app/api/redirects/route.ts`

This endpoint is unauthenticated (the middleware itself needs to call it — there's no session in Edge Middleware). It returns the minimal data needed: an array of `{ sourcePath, destinationPath }` objects. It sets `Cache-Control` headers so Vercel's edge cache can also help.

- [ ] **Step 1: Create the endpoint**

```typescript
// app/api/redirects/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const revalidate = 60 // ISR: revalidate every 60 seconds

export async function GET() {
  try {
    const redirects = await prisma.redirect.findMany({
      select: {
        sourcePath: true,
        destinationPath: true,
      },
    })

    return NextResponse.json(redirects, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Failed to fetch redirects:', error)
    return NextResponse.json([], { status: 200 })
  }
}
```

Note: On error, return an empty array (not a 500) so the middleware gracefully skips redirects rather than breaking all requests.

- [ ] **Step 2: Verify the endpoint works**

Run: `curl http://localhost:3000/api/redirects`
Expected: JSON array (empty `[]` if no redirects exist, or existing redirect objects)

- [ ] **Step 3: Commit**

```bash
git add app/api/redirects/route.ts
git commit -m "feat: add public redirects API endpoint for middleware consumption"
```

---

### Task 2: Rewrite middleware to combine auth + redirects

**Files:**
- Modify: `middleware.ts`

The current middleware uses `withAuth` from next-auth and only matches `/admin/*` routes. We need to:

1. Expand the matcher to run on all routes (excluding static files, API routes, and `_next`)
2. For non-admin routes: check the redirect map and 301 if matched
3. For admin routes: enforce NextAuth authentication (preserve existing behaviour)

The redirect map is cached in a module-level variable with a 60-second TTL. The middleware fetches from the internal API endpoint on cache miss.

- [ ] **Step 1: Replace middleware.ts with the combined middleware**

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

type RedirectRule = {
  sourcePath: string
  destinationPath: string
}

let redirectCache: RedirectRule[] = []
let cacheTimestamp = 0
const CACHE_TTL_MS = 60_000 // 60 seconds

async function getRedirects(request: NextRequest): Promise<RedirectRule[]> {
  const now = Date.now()
  if (now - cacheTimestamp < CACHE_TTL_MS && redirectCache.length > 0) {
    return redirectCache
  }

  try {
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || 'localhost:3000'
    const res = await fetch(`${protocol}://${host}/api/redirects`, {
      headers: { 'x-middleware-internal': '1' },
    })

    if (res.ok) {
      redirectCache = await res.json()
      cacheTimestamp = now
    }
  } catch (error) {
    console.error('Failed to fetch redirects in middleware:', error)
    // Return stale cache on error rather than empty
  }

  return redirectCache
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- Admin auth protection ---
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = await getToken({ req: request })
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // --- 301 redirects ---
  const redirects = await getRedirects(request)
  const match = redirects.find(
    (r) => r.sourcePath === pathname
  )

  if (match) {
    const destination = match.destinationPath.startsWith('http')
      ? match.destinationPath
      : new URL(match.destinationPath, request.url).toString()

    return NextResponse.redirect(destination, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public folder assets
     * - API routes (redirects should not intercept API calls)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/).*)',
  ],
}
```

Key design decisions:
- **Admin auth uses `getToken` from next-auth/jwt** instead of `withAuth` wrapper, giving us direct control of the middleware function while preserving the same JWT-based auth check
- **Matcher excludes `/api/` routes** so the redirect lookup endpoint itself is never intercepted
- **Exact pathname match only** — no regex or wildcard matching (matches the admin UI which captures exact source paths)
- **Stale cache on error** — if the fetch fails, serve the last known redirects rather than nothing

- [ ] **Step 2: Test admin auth still works**

1. Visit `http://localhost:3000/admin/courses` while logged out → should redirect to `/admin/login`
2. Log in → should access admin pages normally
3. Visit `http://localhost:3000/admin/login` while logged out → should render the login page (not redirect loop)

- [ ] **Step 3: Test 301 redirects work**

1. In the admin dashboard at `/admin/redirects`, create a test redirect: source `/test-old` → destination `/courses`
2. Wait 60 seconds (or restart dev server to clear cache)
3. Run: `curl -I http://localhost:3000/test-old`
4. Expected: `HTTP/1.1 301 Moved Permanently` with `Location: http://localhost:3000/courses`

Then test an absolute URL redirect:
1. Create redirect: source `/test-external` → destination `https://www.diligent.com`
2. Run: `curl -I http://localhost:3000/test-external`
3. Expected: `HTTP/1.1 301 Moved Permanently` with `Location: https://www.diligent.com`

- [ ] **Step 4: Clean up the test redirects**

Delete the test redirects from `/admin/redirects`.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts
git commit -m "feat: add 301 redirect interception to Next.js middleware"
```

---

### Task 3: Invalidate redirect cache on admin changes

**Files:**
- Modify: `app/api/admin/redirects/route.ts` (POST handler)
- Modify: `app/api/admin/redirects/[id]/route.ts` (PUT and DELETE handlers)

Currently the middleware cache has a 60-second TTL, which means after an admin creates/updates/deletes a redirect, it could take up to 60 seconds to take effect. This is acceptable for production, but we can improve it by calling `revalidatePath('/api/redirects')` after each admin mutation so the ISR cache is also busted.

- [ ] **Step 1: Add revalidation to the POST handler**

In `app/api/admin/redirects/route.ts`, add after the successful `prisma.redirect.create()`:

```typescript
import { revalidatePath } from 'next/cache'

// ... inside the POST handler, after the create succeeds:
    revalidatePath('/api/redirects')
```

- [ ] **Step 2: Add revalidation to the PUT and DELETE handlers**

In `app/api/admin/redirects/[id]/route.ts`, add after each successful mutation:

```typescript
import { revalidatePath } from 'next/cache'

// ... inside PUT handler, after update succeeds:
    revalidatePath('/api/redirects')

// ... inside DELETE handler, after delete succeeds:
    revalidatePath('/api/redirects')
```

- [ ] **Step 3: Test cache invalidation**

1. Create a redirect `/cache-test` → `/courses` in admin
2. Immediately run: `curl -I http://localhost:3000/cache-test`
3. Expected: 301 redirect (should not need to wait 60 seconds)

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/redirects/route.ts app/api/admin/redirects/[id]/route.ts
git commit -m "feat: invalidate redirect cache on admin create/update/delete"
```
