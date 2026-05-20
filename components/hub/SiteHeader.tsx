'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const certifications = [
  {
    label: 'Cyber Risk & Strategy Certification',
    href: 'https://www.diligent.com/platform/cyber-risk-strategy-leadership-certification',
    badge: '/badges/Cyber Risk & Strategy badge.png',
  },
  {
    label: 'AI Ethics & Board Oversight Certification',
    href: 'https://www.diligent.com/platform/ai-ethics-board-oversight-certification',
    badge: '/badges/AI Ethics & Board Oversight badge.png',
  },
  {
    label: 'Enterprise Risk Management Certification',
    href: 'https://www.diligent.com/platform/enterprise-risk-management-certification',
    badge: '/badges/Enterprise Risk Management badge.png',
  },
  {
    label: 'Company Secretary Certification',
    href: null,
    badge: '/badges/Company Secretary Certification badge.png',
  },
  {
    label: 'Climate & Sustainability Strategy Certification',
    href: 'https://www.diligent.com/platform/climate-and-sustainability-strategy-certification',
    badge: '/badges/Climate & Sustainability Strategy badge.png',
  },
  {
    label: 'Human Capital, Compensation & Culture Certification',
    href: 'https://www.diligent.com/platform/human-capital-compensation-and-culture-certificate',
    badge: '/badges/Human Capital Compensation & Culture badge.png',
  },
]

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileUpgradeOpen, setMobileUpgradeOpen] = useState(false)
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLLIElement>(null)
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDesktopDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleMouseEnter() {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current)
      closeTimeout.current = null
    }
    setDesktopDropdownOpen(true)
  }

  function handleMouseLeave() {
    closeTimeout.current = setTimeout(() => {
      setDesktopDropdownOpen(false)
    }, 150)
  }

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

        {/* Desktop nav — centred, hidden on mobile */}
        <nav
          aria-label="Primary"
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
        >
          <ul className="flex gap-8 text-sm font-medium">
            <li>
              <Link
                href="/"
                className="text-diligent-gray-5 no-underline hover:text-diligent-red hover:no-underline"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/library"
                className="text-diligent-gray-5 no-underline hover:text-diligent-red hover:no-underline"
              >
                Library
              </Link>
            </li>
            <li
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href="/upgrade"
                className="text-diligent-gray-5 no-underline hover:text-diligent-red hover:no-underline"
              >
                Upgrade
              </Link>

              {/* Desktop dropdown */}
              {desktopDropdownOpen && (
                <div className="absolute left-1/2 top-full z-50 min-w-[360px] -translate-x-1/2 pt-2">
                  <div className="rounded-lg border border-diligent-gray-2 bg-white py-2 shadow-lg">
                    <a
                      href="https://www.diligent.com/solutions/board-education"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2.5 text-sm text-diligent-gray-5 no-underline hover:bg-diligent-gray-1 hover:text-diligent-red hover:no-underline"
                    >
                      The Education & Templates Library
                    </a>

                    <div className="mx-4 my-1 border-t border-diligent-gray-2" />

                    <span className="block px-4 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-diligent-gray-3">
                      Professional certifications
                    </span>

                    {certifications.map((cert) =>
                      cert.href ? (
                        <a
                          key={cert.label}
                          href={cert.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-diligent-gray-5 no-underline hover:bg-diligent-gray-1 hover:text-diligent-red hover:no-underline"
                        >
                          <Image
                            src={cert.badge}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0"
                          />
                          {cert.label}
                        </a>
                      ) : (
                        <span
                          key={cert.label}
                          className="flex cursor-default items-center gap-3 px-4 py-2.5 text-sm text-diligent-gray-3"
                        >
                          <Image
                            src={cert.badge}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 opacity-60"
                          />
                          {cert.label}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </li>
          </ul>
        </nav>

        {/* Mobile hamburger button */}
        <button
          type="button"
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-md text-diligent-gray-5 hover:bg-diligent-gray-1 lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-diligent-gray-2 bg-white px-6 py-4 lg:hidden"
        >
          <ul className="flex flex-col gap-1 text-sm font-medium">
            <li>
              <Link
                href="/"
                className="block rounded-md px-3 py-2.5 text-diligent-gray-5 no-underline hover:bg-diligent-gray-1 hover:text-diligent-red hover:no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/library"
                className="block rounded-md px-3 py-2.5 text-diligent-gray-5 no-underline hover:bg-diligent-gray-1 hover:text-diligent-red hover:no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Library
              </Link>
            </li>
            <li>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-diligent-gray-5 hover:bg-diligent-gray-1 hover:text-diligent-red"
                onClick={() => setMobileUpgradeOpen(!mobileUpgradeOpen)}
                aria-expanded={mobileUpgradeOpen}
              >
                Upgrade
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${mobileUpgradeOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {mobileUpgradeOpen && (
                <ul className="mt-1 flex flex-col gap-0.5 pl-4">
                  <li>
                    <Link
                      href="/upgrade"
                      className="block rounded-md px-3 py-2 text-sm text-diligent-gray-5 no-underline hover:bg-diligent-gray-1 hover:text-diligent-red hover:no-underline"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Upgrade overview
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://www.diligent.com/solutions/board-education"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md px-3 py-2 text-sm text-diligent-gray-5 no-underline hover:bg-diligent-gray-1 hover:text-diligent-red hover:no-underline"
                    >
                      The Education & Templates Library
                    </a>
                  </li>

                  <li className="mx-3 my-1 border-t border-diligent-gray-2" />

                  <li>
                    <span className="block px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-diligent-gray-3">
                      Professional certifications
                    </span>
                  </li>

                  {certifications.map((cert) => (
                    <li key={cert.label}>
                      {cert.href ? (
                        <a
                          href={cert.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-diligent-gray-5 no-underline hover:bg-diligent-gray-1 hover:text-diligent-red hover:no-underline"
                        >
                          <Image
                            src={cert.badge}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0"
                          />
                          {cert.label}
                        </a>
                      ) : (
                        <span className="flex cursor-default items-center gap-3 px-3 py-2 text-sm text-diligent-gray-3">
                          <Image
                            src={cert.badge}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 opacity-60"
                          />
                          {cert.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
