import { Button } from '@/components/ui/Button'

interface FooterCTASectionProps {
  heading: string | null
  body: string | null
  ctaText: string | null
  ctaUrl: string | null
}

export function FooterCTASection({
  heading,
  body,
  ctaText,
  ctaUrl,
}: FooterCTASectionProps) {
  return (
    <section className="bg-diligent-gray-5 py-16">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6 text-center">
        <h2 className="text-heading-1 font-bold text-white">
          {heading ?? 'Upskill your board today'}
        </h2>
        {body && <p className="mx-auto mt-4 max-w-2xl text-diligent-gray-3">{body}</p>}
        {ctaUrl && (
          <div className="mt-8">
            <Button href={ctaUrl}>
              {ctaText ?? 'Request a demo'}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
