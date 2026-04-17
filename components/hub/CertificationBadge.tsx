import Image from 'next/image'
import type { Image as SanityImage } from 'sanity'
import { urlForImage } from '@/sanity/lib/image'

interface CertificationBadgeProps {
  title: string | null
  image: {
    asset?: { _ref: string; _type: 'reference' } | null
    alt?: string | null
    [key: string]: unknown
  } | null
  url: string | null
}

export function CertificationBadge({
  title,
  image,
  url,
}: CertificationBadgeProps) {
  if (!image?.asset) return null

  const src = urlForImage(image as SanityImage).width(200).url()

  const img = (
    <Image
      src={src}
      alt={image.alt ?? title ?? 'Certification badge'}
      width={200}
      height={200}
      className="h-auto w-full"
    />
  )

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline transition hover:opacity-80 hover:no-underline"
      >
        {img}
      </a>
    )
  }

  return <div>{img}</div>
}
