import 'server-only'
import { draftMode } from 'next/headers'

export const PREVIEW_COOKIE = '__prerender_bypass'

export function isDraftMode(): boolean {
  const { isEnabled } = draftMode()
  return isEnabled
}
