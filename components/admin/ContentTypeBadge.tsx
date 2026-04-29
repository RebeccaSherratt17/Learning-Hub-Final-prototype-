import type { ContentType } from '@/lib/generated/prisma'

interface ContentTypeBadgeProps {
  type: ContentType
}

const typeLabels: Record<ContentType, string> = {
  COURSE: 'Course',
  TEMPLATE: 'Template',
  VIDEO: 'Video',
  LEARNING_PATH: 'Learning path',
}

export default function ContentTypeBadge({ type }: ContentTypeBadgeProps) {
  return (
    <span className="inline-block rounded-full bg-diligent-gray-1 px-2 py-0.5 text-xs font-medium text-diligent-gray-5">
      {typeLabels[type]}
    </span>
  )
}
