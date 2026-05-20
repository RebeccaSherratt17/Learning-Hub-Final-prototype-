# Error States & Empty States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add branded 404 and 500 error pages so every failure state has a designed, intentional response rather than a default Next.js page.

**Architecture:** Next.js App Router uses file conventions for error handling: `not-found.tsx` for 404s, `error.tsx` for runtime errors within a layout, and `global-error.tsx` for errors that escape the root layout. We place a `not-found.tsx` inside the `(hub)` route group so 404s on public pages render within the hub layout (with SiteHeader and SiteFooter). We place `error.tsx` in `(hub)` for runtime errors on public pages. `global-error.tsx` goes at the app root as a last-resort catch-all (it must supply its own `<html>` and `<body>` tags since it replaces the root layout).

**Tech Stack:** Next.js App Router error file conventions, existing Diligent brand tokens

---

## What already exists (no work needed)

These are already handled and do not need changes:

- **Search returns no results** — `ResourceLibrary.tsx` shows "No results found for '[term]'" with a clear-filters button
- **Filter combination yields no results** — Same component shows "No content matches the current filters" with clear-filters button
- **SCORM launch fails** — `CourseRightColumn.tsx` catches errors from `/api/scorm/launch` and displays a message with `role="alert"`
- **Gate form submission fails** — `GateForm.tsx` catches API errors and displays "Something went wrong. Please try again."
- **Token validation fails** — `courses/[slug]/page.tsx` shows "This link is not valid" with a branded icon and explanation
- **Content not found** — All four content detail pages call `notFound()` when the slug doesn't match (which will now render our new branded 404)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `app/(hub)/not-found.tsx` | Branded 404 page within hub layout (header + footer) |
| Create | `app/(hub)/error.tsx` | Runtime error boundary within hub layout |
| Create | `app/global-error.tsx` | Last-resort error boundary (replaces root layout) |
| Create | `app/not-found.tsx` | Root-level 404 for routes outside `(hub)` group |

---

### Task 1: Create the hub 404 page

**Files:**
- Create: `app/(hub)/not-found.tsx`

This renders inside the `(hub)` layout, so SiteHeader and SiteFooter are already present. The page shows a friendly message with a link back to the homepage and a link to browse the full resource library.

- [ ] **Step 1: Create the not-found page**

```tsx
// app/(hub)/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-24 text-center">
      <span
        className="material-symbols-sharp text-[64px] text-diligent-gray-3"
        aria-hidden="true"
      >
        search_off
      </span>
      <h1 className="mt-6 text-3xl font-bold text-diligent-gray-5">
        Page not found
      </h1>
      <p className="mt-3 text-base text-diligent-gray-4">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
        have been moved or no longer exists.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
        >
          Go to homepage
        </Link>
        <Link
          href="/#resource-library"
          className="inline-flex items-center rounded-lg border border-diligent-gray-2 px-8 py-3.5 text-sm font-medium text-diligent-gray-5 transition-colors hover:border-diligent-gray-3"
        >
          Browse resource library
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it renders**

Visit `http://localhost:3000/this-page-does-not-exist` — should show the branded 404 within the hub header/footer.

- [ ] **Step 3: Commit**

```bash
git add "app/(hub)/not-found.tsx"
git commit -m "feat: branded 404 page for public hub"
```

---

### Task 2: Create the hub error boundary

**Files:**
- Create: `app/(hub)/error.tsx`

This catches runtime errors on any public hub page. It must be a client component (`'use client'`). It renders within the hub layout so header/footer are present. It offers a retry button (calls `reset()`) and a homepage link.

- [ ] **Step 1: Create the error page**

```tsx
// app/(hub)/error.tsx
'use client'

export default function HubError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-24 text-center">
      <span
        className="material-symbols-sharp text-[64px] text-diligent-gray-3"
        aria-hidden="true"
      >
        error_outline
      </span>
      <h1 className="mt-6 text-3xl font-bold text-diligent-gray-5">
        Something went wrong
      </h1>
      <p className="mt-3 text-base text-diligent-gray-4">
        An unexpected error occurred. Please try again, or return to the
        homepage.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center rounded-lg border border-diligent-gray-2 px-8 py-3.5 text-sm font-medium text-diligent-gray-5 transition-colors hover:border-diligent-gray-3"
        >
          Go to homepage
        </a>
      </div>
    </div>
  )
}
```

Note: The homepage link uses `<a>` not `<Link>` — a hard navigation is more reliable when recovering from a render error.

- [ ] **Step 2: Commit**

```bash
git add "app/(hub)/error.tsx"
git commit -m "feat: runtime error boundary for public hub pages"
```

---

### Task 3: Create the root-level 404 and global error boundary

**Files:**
- Create: `app/not-found.tsx`
- Create: `app/global-error.tsx`

The root `not-found.tsx` catches 404s for routes outside the `(hub)` group (e.g. a mistyped `/admin/xyz` that doesn't match any admin page). It renders without the hub header/footer since it's outside the `(hub)` layout.

The `global-error.tsx` is the last-resort boundary — it catches errors that escape the root layout. It must provide its own `<html>` and `<body>` tags. It uses inline styles as a fallback since CSS may not have loaded.

- [ ] **Step 1: Create the root not-found page**

```tsx
// app/not-found.tsx
import Link from 'next/link'

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <span
          className="material-symbols-sharp text-[64px] text-diligent-gray-3"
          aria-hidden="true"
        >
          search_off
        </span>
        <h1 className="mt-6 text-3xl font-bold text-diligent-gray-5">
          Page not found
        </h1>
        <p className="mt-3 text-base text-diligent-gray-4">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create the global error boundary**

```tsx
// app/global-error.tsx
'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          backgroundColor: '#ffffff',
          color: '#282E37',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1.5rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: '#6F7377', marginBottom: '2rem' }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: '#EE312E',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.875rem 2rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
```

Note: `global-error.tsx` uses inline styles because when the root layout itself fails, Tailwind CSS classes may not be available. The colour values match the Diligent brand tokens exactly (`#282E37` = Gray 5, `#6F7377` = Gray 4, `#EE312E` = Diligent Red).

- [ ] **Step 3: Commit**

```bash
git add app/not-found.tsx app/global-error.tsx
git commit -m "feat: root-level 404 and global error boundary"
```
