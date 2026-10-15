import { createHmac } from 'node:crypto'

// ---------------------------------------------------------------------------
// Cookieless unique-visitor identification
//
// Each visitor is identified by an HMAC of their IP address + user agent,
// keyed with a secret that changes every UTC day. No cookie is set and the
// raw IP is never stored. The same person on a different day produces a
// different hash, so "unique visitors" are counted once per day.
// ---------------------------------------------------------------------------

const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests/i

/** True for crawlers, uptime monitors and requests without a user agent. */
export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent)
}

/** Best-effort client IP from Vercel / proxy headers. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip')?.trim() ?? ''
}

function hashSecret(): string {
  const secret = process.env.ANALYTICS_HASH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('ANALYTICS_HASH_SECRET or NEXTAUTH_SECRET must be set')
  return secret
}

/** Daily-rotating anonymous visitor hash. */
export function visitorHash(
  ip: string,
  userAgent: string,
  date: Date = new Date(),
  secret: string = hashSecret(),
): string {
  const day = date.toISOString().slice(0, 10)
  return createHmac('sha256', `${secret}:${day}`)
    .update(`${ip}|${userAgent}`)
    .digest('hex')
    .slice(0, 32)
}
