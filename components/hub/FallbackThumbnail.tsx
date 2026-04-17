import Image from 'next/image'
import { cn } from '@/lib/cn'

export interface FallbackThumbnailProps {
  className?: string
  alt?: string
}

export function FallbackThumbnail({
  className,
  alt = 'Diligent Learning Hub',
}: FallbackThumbnailProps) {
  return (
    <Image
      src="/images/fallback-thumbnail.svg"
      alt={alt}
      width={1200}
      height={675}
      className={cn('h-full w-full object-cover', className)}
    />
  )
}
