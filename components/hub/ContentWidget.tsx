import { ContentCard } from '@/components/hub/ContentCard'
import type { ContentItem } from '@/types/content'

interface ContentWidgetProps {
  title: string
  items: ContentItem[]
}

export function ContentWidget({ title, items }: ContentWidgetProps) {
  if (items.length === 0) return null

  return (
    <div>
      <h3 className="mb-4 text-heading-3 font-semibold text-diligent-gray-5">
        {title}
      </h3>
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item._id}>
            <ContentCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  )
}
