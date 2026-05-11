import { cookies } from 'next/headers'

const COOKIE_NAME = 'hub_gated_access'
const MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

/**
 * Check if the visitor has already passed a gate form (server-side).
 */
export async function hasGateSession(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.has(COOKIE_NAME)
}

/**
 * Returns Set-Cookie header value for the gate session.
 * Used in API route responses.
 */
export function gateSessionCookieHeader(): string {
  return `${COOKIE_NAME}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`
}
