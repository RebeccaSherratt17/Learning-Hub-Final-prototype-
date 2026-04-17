interface QuestionsSectionProps {
  heading: string | null
  body: string | null
}

export function QuestionsSection({ heading, body }: QuestionsSectionProps) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6 text-center">
        <h2 className="text-heading-1 font-bold text-diligent-gray-5">
          {heading ?? 'Got questions?'}
        </h2>
        {body ? (
          <p className="mt-4 text-diligent-gray-4">
            {body.includes('certifications@diligent.com') ? (
              <>
                {body.split('certifications@diligent.com')[0]}
                <a
                  href="mailto:certifications@diligent.com"
                  className="font-medium"
                >
                  certifications@diligent.com
                </a>
                {body.split('certifications@diligent.com')[1]}
              </>
            ) : (
              body
            )}
          </p>
        ) : (
          <p className="mt-4 text-diligent-gray-4">
            We&apos;re here to help! If you have any questions about our
            educational resources, email{' '}
            <a
              href="mailto:certifications@diligent.com"
              className="font-medium"
            >
              certifications@diligent.com
            </a>
          </p>
        )}
      </div>
    </section>
  )
}
