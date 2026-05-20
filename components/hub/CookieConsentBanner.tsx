'use client'

import { useEffect, useState } from 'react'
import { useCookieConsent } from './CookieConsentProvider'

export function CookieConsentBanner() {
  const { consentState, acceptCookies, declineCookies } = useCookieConsent()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || consentState !== 'undecided') return null

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
