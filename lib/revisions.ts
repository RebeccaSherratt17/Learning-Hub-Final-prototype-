import 'server-only'
import { prisma } from '@/lib/db'
import type { ContentType, Prisma, PrismaClient } from '@/lib/generated/prisma'

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

interface CreateRevisionParams {
  contentType: ContentType
  contentId: string
  data: Record<string, unknown>
  changedBy: string | null
}

export async function createRevision(
  params: CreateRevisionParams,
  tx?: PrismaTransaction
): Promise<void> {
  const client = tx || prisma

  const fkField: Partial<Record<ContentType, string>> = {
    COURSE: 'courseId',
    TEMPLATE: 'templateId',
    VIDEO: 'videoId',
    LEARNING_PATH: 'learningPathId',
  }

  const fk = fkField[params.contentType]

  await client.contentRevision.create({
    data: {
      contentType: params.contentType,
      contentId: params.contentId,
      data: params.data as Prisma.InputJsonValue,
      changedBy: params.changedBy,
      ...(fk ? { [fk]: params.contentId } : {}),
    },
  })
}
