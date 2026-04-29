import type { ContentStatus } from '@/lib/generated/prisma'

interface StatusBadgeProps {
  status: ContentStatus
}

const statusStyles: Record<ContentStatus, string> = {
  DRAFT: 'bg-diligent-gray-2 text-diligent-gray-5',
  SCHEDULED: 'bg-amber-100 text-amber-800',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  ARCHIVED: 'bg-diligent-gray-1 text-diligent-gray-4',
}

const statusLabels: Record<ContentStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  )
}
