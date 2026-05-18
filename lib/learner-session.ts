import { cookies } from 'next/headers'

const COOKIE_NAME = 'hub_learner_id'
const MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

/**
 * Read the learner ID from the session cookie (server-side).
 * Returns null if the cookie is not set.
 */
export async function getLearnerIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  return cookie?.value ?? null
}

/**
 * Returns Set-Cookie header value to store the learner's database ID.
 * Used in API route responses.
 */
export function learnerSessionCookieHeader(learnerId: string): string {
  return `${COOKIE_NAME}=${learnerId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`
}
