'use client'

import Image from 'next/image'
import type { Image as SanityImage } from 'sanity'
import { urlForImage } from '@/sanity/lib/image'

interface Partner {
  _id: string
  name: string | null
  logo: {
    asset?: { _ref: string; _type: 'reference' } | null
    alt?: string | null
    [key: string]: unknown
  } | null
  url: string | null
}

interface PartnerLogoScrollerProps {
  heading: string | null
  partners: Partner[]
}

function PartnerLogo({ partner }: { partner: Partner }) {
  if (!partner.logo?.asset) return null

  const src = urlForImage(partner.logo as SanityImage)
    .height(80)
    .url()

  const img = (
    <Image
      src={src}
      alt={partner.logo.alt ?? partner.name ?? 'Partner logo'}
      width={160}
      height={80}
      className="h-12 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
    />
  )

  if (partner.url) {
    return (
      <a
        href={partner.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 no-underline hover:no-underline"
      >
        {img}
      </a>
    )
  }

  return <span className="flex-shrink-0">{img}</span>
}

export function PartnerLogoScroller({
  heading,
  partners,
}: PartnerLogoScrollerProps) {
  if (partners.length === 0) return null

  // Duplicate list for seamless loop
  const allLogos = [...partners, ...partners]

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <h2 className="mb-8 text-center text-heading-1 font-bold text-diligent-gray-5">
          {heading ?? 'Our educational partners'}
        </h2>
      </div>
      <div className="group relative overflow-hidden">
        <div
          className="flex items-center gap-12 motion-safe:animate-[marquee_30s_linear_infinite] motion-safe:group-hover:[animation-play-state:paused]"
          style={{ width: 'max-content' }}
        >
          {allLogos.map((partner, i) => (
            <PartnerLogo key={`${partner._id}-${i}`} partner={partner} />
          ))}
        </div>
      </div>
    </section>
  )
}
