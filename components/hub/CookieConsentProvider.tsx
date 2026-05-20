'use client'

import { createContext, useContext, useState, useCallback } from 'react'

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

function getInitialConsent(): ConsentState {
  const stored = getCookie(COOKIE_NAME)
  if (stored === 'accepted') return 'accepted'
  if (stored === 'declined') return 'declined'
  return 'undecided'
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consentState, setConsentState] = useState<ConsentState>(getInitialConsent)

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
