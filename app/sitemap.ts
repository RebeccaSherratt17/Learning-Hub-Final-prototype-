import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://learning.diligent.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, templates, videos, learningPaths] = await Promise.all([
    prisma.course.findMany({
      where: { status: 'PUBLISHED', restricted: false },
      select: { slug: true, updatedAt: true },
    }),
    prisma.template.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.video.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.learningPath.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ]

  const coursePages: MetadataRoute.Sitemap = courses.map((c) => ({
    url: `${BASE_URL}/courses/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const templatePages: MetadataRoute.Sitemap = templates.map((t) => ({
    url: `${BASE_URL}/templates/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const videoPages: MetadataRoute.Sitemap = videos.map((v) => ({
    url: `${BASE_URL}/videos/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const learningPathPages: MetadataRoute.Sitemap = learningPaths.map((lp) => ({
    url: `${BASE_URL}/learning-paths/${lp.slug}`,
    lastModified: lp.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    ...staticPages,
    ...coursePages,
    ...templatePages,
    ...videoPages,
    ...learningPathPages,
  ]
}
