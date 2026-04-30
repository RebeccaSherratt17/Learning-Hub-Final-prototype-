import Image from 'next/image'
import { ContentTypeSignpost } from '@/components/hub/ContentTypeSignpost'
import { SafeHtml } from '@/components/hub/SafeHtml'

interface HeroSectionProps {
  heading: string | null
  subheading: string | null
  overview: string | null
  ctaText: string | null
  ctaUrl: string | null
}

export function HeroSection({ heading, subheading, overview, ctaText, ctaUrl }: HeroSectionProps) {
  return (
    <section className="border-b border-diligent-gray-2 bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          {/* Left column — text content */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-diligent-gray-5">
              Diligent Learning Hub
            </p>
            {heading ? (
              <SafeHtml
                html={heading}
                as="h1"
                className="text-display-1 font-bold text-diligent-gray-5 prose"
              />
            ) : (
              <h1 className="text-display-1 font-bold text-diligent-gray-5">
                Diligent Learning Hub
              </h1>
            )}
            {subheading && (
              <SafeHtml
                html={subheading}
                className="mt-4 max-w-3xl text-lg text-diligent-gray-4 prose prose-lg"
              />
            )}
            {overview && (
              <SafeHtml
                html={overview}
                className="mt-6 max-w-3xl text-diligent-gray-4 prose"
              />
            )}
            {ctaText && (
              <a
                href={ctaUrl ?? '#resource-library'}
                className="mt-8 inline-block rounded bg-diligent-red px-6 py-3 text-sm font-medium text-white hover:bg-diligent-red-2"
              >
                {ctaText}
              </a>
            )}
          </div>

          {/* Right column — hero image */}
          <div className="relative hidden lg:block">
            <div className="relative w-full" style={{ aspectRatio: '3 / 2' }}>
              <Image
                src="/hero-image.jpg"
                alt="Governance professionals in a modern office environment"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 45vw, 0px"
                priority
              />
            </div>
          </div>
        </div>

        {/* Signposts span full width below the grid */}
        <ContentTypeSignpost />
      </div>
    </section>
  )
}
