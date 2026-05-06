'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { FallbackThumbnail } from '@/components/hub/FallbackThumbnail'
import { Icon } from '@/components/ui/Icon'
import {
  type ContentItem,
  type ContentType,
  contentTypeLabels,
  accessTierLabels,
} from '@/types/content'

const routePrefix: Record<ContentType, string> = {
  course: '/courses',
  template: '/templates',
  video: '/videos',
  learningPath: '/learning-paths',
}

function badgeVariantForType(t: ContentType): BadgeVariant {
  return t
}

function badgeVariantForTier(tier: ContentItem['accessTier']): BadgeVariant {
  if (tier === 'gated') return 'gated'
  if (tier === 'premium') return 'premium'
  return 'free'
}

interface ContentWidgetProps {
  title: string
  items: ContentItem[]
  seeAllHref?: string
}

export function ContentWidget({ title, items, seeAllHref = '#resource-library' }: ContentWidgetProps) {
  const router = useRouter()

  function handleSeeAll(e: React.MouseEvent) {
    e.preventDefault()
    // Extract query string from href (e.g. "/?sort=popular#resource-library" → "/?sort=popular")
    const url = seeAllHref.split('#')[0] || '/'
    router.push(url, { scroll: false })
    setTimeout(() => {
      document
        .getElementById('resource-library')
        ?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  if (items.length === 0) return null

  return (
    <div>
      {/* Widget header */}
      <div className="mb-6 flex items-center justify-between border-b border-diligent-gray-5 pb-4">
        <h3 className="text-xl font-semibold text-diligent-gray-5">{title}</h3>
        <a
          href={seeAllHref}
          onClick={handleSeeAll}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-diligent-gray-5 no-underline hover:text-diligent-red hover:no-underline"
        >
          See all
          <Icon name="arrow_forward" className="text-[14px]" />
        </a>
      </div>

      {/* Item list */}
      <div className="flex flex-col">
        {items.map((item, index) => {
          const href = `${routePrefix[item._type]}/${item.slug ?? ''}`
          const thumbUrl = item.thumbnailUrl ?? null
          const isLast = index === items.length - 1

          return (
            <Link
              key={item._id}
              href={href}
              className={`group grid grid-cols-[140px_1fr] gap-5 py-5 no-underline hover:no-underline ${
                isLast ? '' : 'border-b border-diligent-gray-1'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative w-[140px] bg-white" style={{ aspectRatio: '16 / 10' }}>
                {thumbUrl ? (
                  <Image
                    src={thumbUrl}
                    alt={item.thumbnailAlt ?? item.title ?? ''}
                    fill
                    sizes="140px"
                    className={item._type === 'learningPath' ? 'object-contain' : 'object-cover'}
                  />
                ) : (
                  <FallbackThumbnail alt={item.title ?? 'Diligent Learning Hub'} />
                )}
              </div>

              {/* Text content */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <Badge variant={badgeVariantForType(item._type)}>
                    {contentTypeLabels[item._type]}
                  </Badge>
                </div>
                <h4 className="mt-2 text-lg font-semibold leading-snug text-diligent-gray-5 transition-colors group-hover:text-diligent-red">
                  {item.title}
                </h4>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
