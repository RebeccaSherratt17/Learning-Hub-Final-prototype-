import Link from 'next/link'

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
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
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  )
}
