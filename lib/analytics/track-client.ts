// Client-side helper for sending analytics events to /api/track.
// Uses sendBeacon so events survive page navigation (e.g. download clicks).

export type TrackPayload =
  | { event: 'page_view'; path: string }
  | { event: 'template_download'; contentId: string }

export function sendTrackingEvent(payload: TrackPayload): void {
  try {
    const body = JSON.stringify(payload)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
      return
    }
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Analytics is non-critical
  }
}
