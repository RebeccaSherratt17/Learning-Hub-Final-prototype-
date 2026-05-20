'use client'

export default function HubError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-24 text-center">
      <span
        className="material-symbols-sharp text-[64px] text-diligent-gray-3"
        aria-hidden="true"
      >
        error_outline
      </span>
      <h1 className="mt-6 text-3xl font-bold text-diligent-gray-5">
        Something went wrong
      </h1>
      <p className="mt-3 text-base text-diligent-gray-4">
        An unexpected error occurred. Please try again, or return to the
        homepage.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center rounded-lg border border-diligent-gray-2 px-8 py-3.5 text-sm font-medium text-diligent-gray-5 transition-colors hover:border-diligent-gray-3"
        >
          Go to homepage
        </a>
      </div>
    </div>
  )
}
