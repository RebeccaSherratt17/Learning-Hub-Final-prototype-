import Link from 'next/link'
import Image from 'next/image'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-diligent-gray-2 bg-white">
      <div className="relative mx-auto flex h-[72px] max-w-[var(--max-content-width)] items-center px-6">
        {/* Logo */}
        <Link
          href="/"
          className="no-underline hover:no-underline"
          aria-label="Diligent — Home"
        >
          <Image
            src="/diligent-logo.jpg"
            alt="Diligent"
            width={115}
            height={32}
            className="block h-8 w-auto"
            priority
          />
        </Link>

        {/* Centred nav links — hidden on mobile */}
        <nav
          aria-label="Primary"
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
        >
          <ul className="flex gap-8 text-sm font-medium">
            <li>
              <a
                href="https://www.diligent.com/products"
                target="_blank"
                rel="noopener noreferrer"
                className="text-diligent-gray-5 no-underline hover:text-diligent-red hover:no-underline"
              >
                Products
              </a>
            </li>
            <li>
              <a
                href="https://www.diligent.com/solutions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-diligent-gray-5 no-underline hover:text-diligent-red hover:no-underline"
              >
                Solutions
              </a>
            </li>
            <li>
              <a
                href="https://www.diligent.com/resources"
                target="_blank"
                rel="noopener noreferrer"
                className="text-diligent-gray-5 no-underline hover:text-diligent-red hover:no-underline"
              >
                Resources
              </a>
            </li>
          </ul>
        </nav>

        {/* Admin link — right */}
        <Link
          href="/admin"
          className="ml-auto text-sm font-medium text-diligent-gray-4 no-underline hover:text-diligent-gray-5 hover:no-underline"
        >
          Admin
        </Link>
      </div>
    </header>
  )
}
