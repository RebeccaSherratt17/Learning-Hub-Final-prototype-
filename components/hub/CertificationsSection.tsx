import { CertificationBadge } from '@/components/hub/CertificationBadge'

const ETL_URL = 'https://www.diligent.com/solutions/board-education'

interface Badge {
  _id: string
  title: string | null
  imageUrl: string | null
  imageAlt: string | null
  url: string | null
}

interface CertificationsSectionProps {
  heading: string | null
  body: string | null
  badges: Badge[]
}

export function CertificationsSection({
  heading,
  body,
  badges,
}: CertificationsSectionProps) {
  return (
    <section className="bg-diligent-gray-1 py-16">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6 text-center">
        <h2 className="text-heading-1 font-bold text-diligent-gray-5">
          {heading ?? 'Professionally-accredited certifications'}
        </h2>
        {body && (
          <p className="mx-auto mt-4 max-w-3xl text-diligent-gray-4">
            {body.includes('Education & Templates Library') ? (
              <>
                {body.split('Education & Templates Library')[0]}
                <a href={ETL_URL} className="font-medium">
                  Education &amp; Templates Library
                </a>
                {body.split('Education & Templates Library')[1]}
              </>
            ) : (
              body
            )}
          </p>
        )}
        {badges.length > 0 && (
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {badges.map((badge) => (
              <CertificationBadge
                key={badge._id}
                title={badge.title}
                imageUrl={badge.imageUrl}
                imageAlt={badge.imageAlt}
                url={badge.url}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
