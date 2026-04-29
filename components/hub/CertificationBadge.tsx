import Image from 'next/image'

interface CertificationBadgeProps {
  title: string | null
  imageUrl: string | null
  imageAlt: string | null
  url: string | null
}

export function CertificationBadge({
  title,
  imageUrl,
  imageAlt,
  url,
}: CertificationBadgeProps) {
  if (!imageUrl) return null

  const img = (
    <Image
      src={imageUrl}
      alt={imageAlt ?? title ?? 'Certification badge'}
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
