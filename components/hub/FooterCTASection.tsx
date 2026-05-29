import { SafeHtml } from '@/components/hub/SafeHtml'
import { DemoRequestForm } from '@/components/hub/DemoRequestForm'

interface FooterCTASectionProps {
  heading: string | null
  body: string | null
  ctaText: string | null
  ctaUrl: string | null
}

export function FooterCTASection({
  heading,
  body,
}: FooterCTASectionProps) {
  return (
    <section id="footer-cta" className="bg-diligent-gray-5 py-10">
      <div className="mx-auto grid max-w-[var(--max-content-width)] grid-cols-1 items-start gap-12 px-6 lg:grid-cols-2">
        {/* Left column — heading and body text */}
        <div>
          <h2 className="text-heading-1 font-semibold text-white">
            {heading ?? 'Upskill your board today'}
          </h2>
          <p className="mt-4 max-w-xl text-diligent-gray-3">
            Unlock unlimited access to the Education &amp; Templates Library
            &mdash; everything your board and governance team needs to stay
            informed, prepared and ahead of the curve.
          </p>
          <p className="mt-3 max-w-xl text-diligent-gray-3">
            Got questions? Email{' '}
            <a
              href="mailto:certifications@diligent.com"
              className="text-white no-underline hover:underline"
            >
              certifications@diligent.com
            </a>
          </p>
        </div>

        {/* Right column — demo request form */}
        <div>
          <DemoRequestForm />
        </div>
      </div>
    </section>
  )
}
