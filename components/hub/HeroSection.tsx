import { ContentTypeSignpost } from '@/components/hub/ContentTypeSignpost'

const ETL_URL = 'https://www.diligent.com/solutions/board-education'

interface HeroSectionProps {
  heading: string | null
  subheading: string | null
  overview: string | null
}

export function HeroSection({ heading, subheading, overview }: HeroSectionProps) {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <h1 className="text-display-1 font-bold text-diligent-gray-5">
          {heading ?? 'Diligent Learning Hub'}
        </h1>
        {subheading && (
          <p className="mt-4 max-w-3xl text-lg text-diligent-gray-4">
            {subheading}
          </p>
        )}
        {overview && (
          <p className="mt-6 max-w-3xl text-diligent-gray-4">
            {overview.includes('Education & Templates Library') ? (
              <>
                {overview.split('Education & Templates Library')[0]}
                <a href={ETL_URL} className="font-medium">
                  Education &amp; Templates Library
                </a>
                {overview.split('Education & Templates Library')[1]}
              </>
            ) : (
              overview
            )}
          </p>
        )}
        <ContentTypeSignpost />
      </div>
    </section>
  )
}
