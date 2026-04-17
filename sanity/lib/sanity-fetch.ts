import 'server-only'
import type { QueryParams } from 'next-sanity'
import { client, draftClient } from './client'
import { isDraftMode } from '@/lib/draft-mode'

interface SanityFetchOptions<QueryResponse> {
  query: string
  params?: QueryParams
  /** Cache tags for Next.js ISR invalidation via /api/revalidate */
  tags?: string[]
  /** Cast the return type; set when using defineQuery-typed queries */
  _type?: QueryResponse
}

export async function sanityFetch<QueryResponse>({
  query,
  params = {},
  tags = [],
}: SanityFetchOptions<QueryResponse>): Promise<QueryResponse> {
  const isDraft = isDraftMode()
  const activeClient = isDraft ? draftClient : client
  return activeClient.fetch<QueryResponse>(query, params, {
    // Draft mode bypasses all caching; published fetches use tag-based revalidation
    cache: isDraft ? 'no-store' : 'force-cache',
    next: isDraft ? undefined : { tags },
  })
}
