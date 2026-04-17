import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="border-b border-diligent-gray-2 bg-white">
      <div className="mx-auto flex max-w-[var(--max-content-width)] items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-bold text-diligent-gray-5 no-underline hover:no-underline"
        >
          Diligent Learning Hub
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex gap-6 text-sm font-medium text-diligent-gray-4">
            <li>
              <Link href="/" className="text-diligent-gray-4 hover:text-diligent-gray-5">
                Home
              </Link>
            </li>
            <li>
              <a
                href="https://www.diligent.com"
                className="text-diligent-gray-4 hover:text-diligent-gray-5"
              >
                diligent.com
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
