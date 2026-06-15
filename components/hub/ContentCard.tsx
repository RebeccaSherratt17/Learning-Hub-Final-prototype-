import Link from 'next/link'
import Image from 'next/image'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { FallbackThumbnail } from '@/components/hub/FallbackThumbnail'
import {
  type ContentItem,
  type ContentType,
  contentTypeLabels,
} from '@/types/content'
import { cn } from '@/lib/cn'

const routePrefix: Record<ContentType, string> = {
  course: '/courses',
  template: '/templates',
  video: '/videos',
  learningPath: '/learning-paths',
}

function badgeVariantForType(t: ContentType): BadgeVariant {
  return t
}

export interface ContentCardProps {
  item: ContentItem
  className?: string
  showDescription?: boolean
  /** Compact variant: taller thumbnail, smaller title text */
  compact?: boolean
}

/** Strip HTML tags and truncate to ~120 characters at a sentence or word boundary. */
function truncateDescription(raw: string | null | undefined): string | null {
  if (!raw) return null
  const plain = raw.replace(/<[^>]*>/g, '').trim()
  if (!plain) return null
  if (plain.length <= 120) return plain
  // Try to cut at the end of a sentence within 120 chars
  const sentenceEnd = plain.slice(0, 120).lastIndexOf('.')
  if (sentenceEnd > 40) return plain.slice(0, sentenceEnd + 1)
  // Fall back to word boundary
  const wordEnd = plain.slice(0, 120).lastIndexOf(' ')
  return (wordEnd > 0 ? plain.slice(0, wordEnd) : plain.slice(0, 120)) + '…'
}

export function ContentCard({ item, className, showDescription, compact }: ContentCardProps) {
  const href = `${routePrefix[item._type]}/${item.slug ?? ''}`
  const thumbUrl = item.thumbnailUrl ?? null

  return (
    <article
      className={cn(
        'group isolate flex flex-col rounded-xl border border-diligent-gray-2 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-diligent-gray-3 hover:shadow-md',
        className,
      )}
    >
      <Link href={href} className="block no-underline hover:no-underline">
        <div className={cn('relative w-full overflow-hidden rounded-xl bg-white', compact ? 'aspect-[3/2]' : 'aspect-[16/9]')}>
          {thumbUrl ? (
            <Image
              src={thumbUrl}
              alt={item.thumbnailAlt ?? item.title ?? ''}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className={compact ? 'object-contain' : (item._type === 'learningPath' ? 'object-contain' : 'object-cover')}
            />
          ) : (
            <FallbackThumbnail alt={item.title ?? 'Diligent Learning Hub'} />
          )}
        </div>
        <div className="flex min-h-[120px] flex-1 flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <Badge variant={badgeVariantForType(item._type)}>
              {contentTypeLabels[item._type]}
            </Badge>
          </div>
          <h3 className={cn(compact ? 'text-sm font-semibold leading-snug text-diligent-gray-5' : 'text-heading-3 font-semibold text-diligent-gray-5')}>
            {item.title}
          </h3>
          {showDescription && truncateDescription(item.description) && (
            <p className="text-sm text-diligent-gray-4 leading-relaxed">
              {truncateDescription(item.description)}
            </p>
          )}
        </div>
      </Link>
    </article>
  )
}
