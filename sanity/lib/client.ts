import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

/** Public CDN client — anonymous, fast, used for published content. */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
  stega: { studioUrl: '/studio' },
})

/** Server-only client with viewer token — used for draft/preview reads. */
export const draftClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'previewDrafts',
  token: process.env.SANITY_VIEWER_TOKEN,
  stega: { studioUrl: '/studio' },
})
