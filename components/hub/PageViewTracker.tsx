'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { sendTrackingEvent } from '@/lib/analytics/track-client'

/**
 * Sends an anonymous page view to /api/track on every route change.
 * Admin previews are skipped. No cookies are set.
 */
export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    if (new URLSearchParams(window.location.search).has('preview')) return
    sendTrackingEvent({ event: 'page_view', path: pathname })
  }, [pathname])

  return null
}
