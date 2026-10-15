import type { MetadataRoute } from 'next'
import { SITE_URL as BASE_URL } from '@/lib/site-url'

// On Vercel, only the production deployment may be crawled (previews also run
// with NODE_ENV=production, so it can't be used there)
const isProduction = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === 'production'
  : process.env.NODE_ENV === 'production'

export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
