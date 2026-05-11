import { prisma } from '@/lib/db'
import type { ContentType } from '@/lib/generated/prisma'

/**
 * Fire-and-forget view count increment.
 * Called from detail page server components on each page load.
 * Does not block page rendering — errors are silently caught.
 */
export function incrementViewCount(contentType: ContentType, id: string): void {
  const promise = (async () => {
    switch (contentType) {
      case 'COURSE':
        await prisma.course.update({ where: { id }, data: { viewCount: { increment: 1 } } })
        break
      case 'TEMPLATE':
        await prisma.template.update({ where: { id }, data: { viewCount: { increment: 1 } } })
        break
      case 'VIDEO':
        await prisma.video.update({ where: { id }, data: { viewCount: { increment: 1 } } })
        break
      case 'LEARNING_PATH':
        await prisma.learningPath.update({ where: { id }, data: { viewCount: { increment: 1 } } })
        break
    }
  })()

  // Catch errors silently — view count is non-critical
  promise.catch(() => {})
}
