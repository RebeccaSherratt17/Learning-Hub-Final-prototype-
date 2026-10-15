/**
 * Canonical public address of the hub, without a trailing slash.
 *
 * Used for absolute URLs in the sitemap, robots.txt, structured data and
 * Open Graph metadata. Set NEXT_PUBLIC_SITE_URL in Vercel (e.g. when moving
 * to a custom domain); the fallback is the current production domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://learning-hub-final-prototype.vercel.app'
).replace(/\/+$/, '')
