import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Called from Sanity Studio preview URLs, e.g.
 *   /api/draft-mode/enable?secret=<SANITY_PREVIEW_SECRET>&slug=/courses/my-course
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  const slug = url.searchParams.get('slug') ?? '/'

  if (!process.env.SANITY_PREVIEW_SECRET) {
    return new Response('Preview secret not configured', { status: 500 })
  }
  if (secret !== process.env.SANITY_PREVIEW_SECRET) {
    return new Response('Invalid secret', { status: 401 })
  }
  // Only allow relative paths — prevents open-redirect.
  if (!slug.startsWith('/') || slug.startsWith('//')) {
    return new Response('Invalid slug', { status: 400 })
  }

  draftMode().enable()
  redirect(slug)
}
