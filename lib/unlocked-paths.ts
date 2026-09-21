import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

const COOKIE_NAME = 'hub_unlocked_paths'
const MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

/**
 * Read unlocked learning path IDs from the session cookie (server-side).
 * Returns empty array if the cookie is not set or invalid.
 */
export async function getUnlockedPathIds(): Promise<string[]> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)

  if (!cookie?.value) return []

  try {
    const parsed = JSON.parse(decodeURIComponent(cookie.value))
    if (Array.isArray(parsed)) {
      return parsed.filter((id) => typeof id === 'string')
    }
  } catch {
    // Invalid JSON — return empty array
  }

  return []
}

/**
 * Returns Set-Cookie header value to store unlocked learning path IDs.
 * Used in API route responses.
 */
export function unlockedPathsCookieHeader(pathIds: string[]): string {
  const value = JSON.stringify(pathIds)
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`
}

/**
 * Check if a content item belongs to any of the unlocked learning paths.
 * Returns true if the item is in at least one unlocked path.
 */
export async function isItemUnlocked(
  contentType: 'COURSE' | 'TEMPLATE' | 'VIDEO',
  contentId: string,
  unlockedPathIds: string[],
): Promise<boolean> {
  if (unlockedPathIds.length === 0) return false

  const item = await prisma.learningPathItem.findFirst({
    where: {
      contentType,
      contentId,
      learningPathId: { in: unlockedPathIds },
    },
  })

  return !!item
}
