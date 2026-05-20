# Cookie Consent Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GDPR-compliant cookie consent banner that lets visitors accept or decline non-essential cookies (analytics/tracking). Consent state is persisted in a cookie for 12 months so the banner doesn't reappear. A React context exposes the consent state so GA4 (when wired up later) can check it before firing.

**Architecture:** Three pieces: (1) a `CookieConsentProvider` context that reads/writes the consent cookie and exposes `hasConsented` to the component tree, (2) a `CookieConsentBanner` client component that renders the accept/decline UI, and (3) integration into the hub layout so the banner appears on all public pages. The two existing functional cookies (gate session, learner identity) are essential cookies and are not affected by consent — only future analytics cookies are gated.

**Tech Stack:** React context, client component, `js-cookie` (or raw `document.cookie`) for client-side cookie access

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/hub/CookieConsentProvider.tsx` | Context provider — reads/writes consent cookie, exposes state |
| Create | `components/hub/CookieConsentBanner.tsx` | Banner UI — accept/decline buttons, privacy policy link |
| Modify | `app/(hub)/layout.tsx` | Wrap children with provider, render banner |

---

### Task 1: Create the consent context provider

**Files:**
- Create: `components/hub/CookieConsentProvider.tsx`

This is a client component that:
- On mount, reads a `hub_cookie_consent` cookie to check if the visitor has already made a choice
- Exposes `consentState` (`'undecided' | 'accepted' | 'declined'`) and `acceptCookies` / `declineCookies` functions via context
- When the visitor accepts or declines, sets a cookie with a 365-day expiry
- The context value `hasAnalyticsConsent` is a simple boolean that future GA4 integration will check

- [ ] **Step 1: Create the provider**

```tsx
// components/hub/CookieConsentProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type ConsentState = 'undecided' | 'accepted' | 'declined'

interface CookieConsentContextValue {
  consentState: ConsentState
  hasAnalyticsConsent: boolean
  acceptCookies: () => void
  declineCookies: () => void
}

const CookieConsentContext = createContext<CookieConsentContextValue>({
  consentState: 'undecided',
  hasAnalyticsConsent: false,
  acceptCookies: () => {},
  declineCookies: () => {},
})

export function useCookieConsent() {
  return useContext(CookieConsentContext)
}

const COOKIE_NAME = 'hub_cookie_consent'
const MAX_AGE_DAYS = 365

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, days: number) {
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consentState, setConsentState] = useState<ConsentState>('undecided')

  useEffect(() => {
    const stored = getCookie(COOKIE_NAME)
    if (stored === 'accepted') setConsentState('accepted')
    else if (stored === 'declined') setConsentState('declined')
  }, [])

  const acceptCookies = useCallback(() => {
    setCookie(COOKIE_NAME, 'accepted', MAX_AGE_DAYS)
    setConsentState('accepted')
  }, [])

  const declineCookies = useCallback(() => {
    setCookie(COOKIE_NAME, 'declined', MAX_AGE_DAYS)
    setConsentState('declined')
  }, [])

  return (
    <CookieConsentContext.Provider
      value={{
        consentState,
        hasAnalyticsConsent: consentState === 'accepted',
        acceptCookies,
        declineCookies,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/hub/CookieConsentProvider.tsx
git commit -m "feat: cookie consent context provider with 12-month persistence"
```

---

### Task 2: Create the cookie consent banner

**Files:**
- Create: `components/hub/CookieConsentBanner.tsx`

A fixed-bottom banner that appears when `consentState` is `'undecided'`. Contains:
- Explanatory text about cookies and tracking
- A link to the Diligent privacy policy (URL placeholder — to be confirmed by legal team)
- "Accept" button (Diligent Red, primary CTA)
- "Decline" button (secondary/outline style)

The banner must:
- Not block other page content (fixed bottom with z-index below modals but above page content)
- Be keyboard accessible and screen-reader announced
- Respect `prefers-reduced-motion` for any entrance animation
- Meet 44px minimum touch target on buttons

- [ ] **Step 1: Create the banner component**

```tsx
// components/hub/CookieConsentBanner.tsx
'use client'

import { useCookieConsent } from './CookieConsentProvider'

export function CookieConsentBanner() {
  const { consentState, acceptCookies, declineCookies } = useCookieConsent()

  if (consentState !== 'undecided') return null

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-diligent-gray-2 bg-white px-6 py-5 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] motion-safe:animate-[slideUp_0.3s_ease-out]"
    >
      <div className="mx-auto flex max-w-[var(--max-content-width)] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-diligent-gray-4">
          We use cookies to analyse site usage and improve your experience. Essential
          cookies are always active.{' '}
          <a
            href="https://www.diligent.com/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:underline"
          >
            Privacy policy
          </a>
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={declineCookies}
            className="rounded-lg border border-diligent-gray-2 px-6 py-3 text-sm font-medium text-diligent-gray-5 transition-colors hover:border-diligent-gray-3"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={acceptCookies}
            className="rounded-lg bg-diligent-red px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add the slideUp keyframe to Tailwind config**

In `tailwind.config.ts`, add the `slideUp` keyframe to the `extend.keyframes` object:

```
slideUp: {
  '0%': { transform: 'translateY(100%)' },
  '100%': { transform: 'translateY(0)' },
},
```

If the `keyframes` section already exists (it likely does for the marquee animation), add `slideUp` alongside it.

- [ ] **Step 3: Commit**

```bash
git add components/hub/CookieConsentBanner.tsx tailwind.config.ts
git commit -m "feat: cookie consent banner with accept/decline and privacy policy link"
```

---

### Task 3: Wire into the hub layout

**Files:**
- Modify: `app/(hub)/layout.tsx`

Wrap the layout children with `CookieConsentProvider` and render `CookieConsentBanner` inside it.

- [ ] **Step 1: Update the hub layout**

```tsx
// app/(hub)/layout.tsx
import { SiteHeader } from '@/components/hub/SiteHeader'
import { SiteFooter } from '@/components/hub/SiteFooter'
import { CookieConsentProvider } from '@/components/hub/CookieConsentProvider'
import { CookieConsentBanner } from '@/components/hub/CookieConsentBanner'

export default function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CookieConsentProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CookieConsentBanner />
      </div>
    </CookieConsentProvider>
  )
}
```

- [ ] **Step 2: Verify the banner appears**

1. Clear cookies for localhost
2. Visit `http://localhost:3000` — banner should appear at bottom
3. Click "Accept" — banner disappears, `hub_cookie_consent=accepted` cookie is set
4. Refresh — banner should not reappear
5. Delete the cookie, refresh — banner reappears
6. Click "Decline" — banner disappears, `hub_cookie_consent=declined` cookie is set

- [ ] **Step 3: Commit**

```bash
git add "app/(hub)/layout.tsx"
git commit -m "feat: wire cookie consent banner into hub layout"
```
