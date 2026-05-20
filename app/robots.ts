import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://learning.diligent.com'
const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'

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
