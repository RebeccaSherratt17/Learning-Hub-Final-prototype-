import { prisma } from '@/lib/db'
import type { ContentType, Prisma } from '@/lib/generated/prisma'

/** Event types written to the analytics_events table. */
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  TEMPLATE_DOWNLOAD: 'template_download',
  LEARNING_PATH_ENROL: 'learning_path_enrol',
} as const

export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

interface RecordEventInput {
  eventType: AnalyticsEventType
  contentType?: ContentType | null
  contentId?: string | null
  metadata?: Prisma.InputJsonObject
}

/**
 * Write an analytics event. Never throws — analytics is non-critical and
 * must not break the request that triggered it.
 */
export async function recordEvent(input: RecordEventInput): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType: input.eventType,
        contentType: input.contentType ?? null,
        contentId: input.contentId ?? null,
        metadata: input.metadata,
      },
    })
  } catch (err) {
    console.error('Failed to record analytics event:', err)
  }
}
