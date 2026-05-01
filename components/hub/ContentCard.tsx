import Link from 'next/link'
import Image from 'next/image'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { FallbackThumbnail } from '@/components/hub/FallbackThumbnail'
import {
  type ContentItem,
  type ContentType,
  contentTypeLabels,
  accessTierLabels,
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

function badgeVariantForTier(
  tier: ContentItem['accessTier'],
): BadgeVariant {
  if (tier === 'gated') return 'gated'
  if (tier === 'premium') return 'premium'
  return 'free'
}

export interface ContentCardProps {
  item: ContentItem
  className?: string
}

export function ContentCard({ item, className }: ContentCardProps) {
  const href = `${routePrefix[item._type]}/${item.slug ?? ''}`
  const thumbUrl = item.thumbnailUrl ?? null

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-md border border-diligent-gray-2 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-diligent-gray-3 hover:shadow-md',
        className,
      )}
    >
      <Link href={href} className="block no-underline hover:no-underline">
        <div className="relative aspect-[16/9] w-full bg-diligent-gray-1">
          {thumbUrl ? (
            <Image
              src={thumbUrl}
              alt={item.thumbnailAlt ?? item.title ?? ''}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className={item._type === 'learningPath' ? 'object-contain' : 'object-cover'}
            />
          ) : (
            <FallbackThumbnail alt={item.title ?? 'Diligent Learning Hub'} />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <Badge variant={badgeVariantForType(item._type)}>
              {contentTypeLabels[item._type]}
            </Badge>
            {item.accessTier && (
              <Badge variant={badgeVariantForTier(item.accessTier)}>
                {accessTierLabels[item.accessTier as keyof typeof accessTierLabels]}
              </Badge>
            )}
          </div>
          <h3 className="text-heading-3 font-semibold text-diligent-gray-5">
            {item.title}
          </h3>
          {item.description && (
            <p className="line-clamp-3 text-sm text-diligent-gray-4">
              {item.description}
            </p>
          )}
        </div>
      </Link>
    </article>
  )
}
