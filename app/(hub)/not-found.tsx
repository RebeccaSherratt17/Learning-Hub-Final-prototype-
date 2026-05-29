import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[var(--max-content-width)] px-6 py-24 text-center">
      <span
        className="material-symbols-sharp text-[64px] text-diligent-gray-3"
        aria-hidden="true"
      >
        search_off
      </span>
      <h1 className="mt-6 text-3xl font-bold text-diligent-gray-5">
        Page not found
      </h1>
      <p className="mt-3 text-base text-diligent-gray-4">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
        have been moved or no longer exists.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
        >
          Go to homepage
        </Link>
        <Link
          href="/library"
          className="inline-flex items-center rounded-lg border border-diligent-gray-2 px-8 py-3.5 text-sm font-medium text-diligent-gray-5 transition-colors hover:border-diligent-gray-3"
        >
          Browse resource library
        </Link>
      </div>
    </div>
  )
}
