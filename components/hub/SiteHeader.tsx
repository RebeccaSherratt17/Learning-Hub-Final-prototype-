'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@/components/ui/Icon'
import { toSentenceCase } from '@/lib/toSentenceCase'

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

const contentTypes = [
  { label: 'Courses', href: '/library?type=COURSE#resource-library', icon: 'school', description: 'Short, structured eLearning modules' },
  { label: 'Templates', href: '/library?type=TEMPLATE#resource-library', icon: 'article', description: 'Ready-to-use governance documents' },
  { label: 'Videos', href: '/library?type=VIDEO#resource-library', icon: 'play_circle', description: 'Expert interviews and explainer videos' },
  { label: 'Learning paths', href: '/library?type=LEARNING_PATH#resource-library', icon: 'route', description: 'Curated multi-step learning journeys' },
]

const topicIcons: Record<string, string> = {
  'board-governance': 'gavel',
  'board-meetings-committees': 'groups',
  'ai-technology': 'smart_toy',
  'risk-management': 'security',
  'compliance-policy': 'verified',
  'governance-professionals': 'badge',
}

const topicDescriptions: Record<string, string> = {
  'board-governance': 'Tools to help leaders govern effectively',
  'board-meetings-committees': 'Guidance for running meetings and committees',
  'ai-technology': 'Governance of AI, technology and cyber risk',
  'risk-management': 'Managing risk across your organization',
  'compliance-policy': 'Stay ahead of regulatory obligations',
  'governance-professionals': 'For the people who make governance work',
}

interface SubjectGroupNav {
  name: string
  slug: string
  subjectIds: string[]
}

function buildTopicHref(subjectIds: string[]): string {
  const params = new URLSearchParams()
  subjectIds.forEach((id) => params.append('subject', id))
  return `/library?${params.toString()}#resource-library`
}

// ---------------------------------------------------------------------------
// SiteHeader
// ---------------------------------------------------------------------------

interface SiteHeaderProps {
  subjectGroups?: SubjectGroupNav[]
}

export function SiteHeader({ subjectGroups = [] }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileCertsOpen, setMobileCertsOpen] = useState(false)
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false)
  const [mobileByTypeOpen, setMobileByTypeOpen] = useState(false)
  const [mobileByTopicOpen, setMobileByTopicOpen] = useState(false)

  const [desktopCertsOpen, setDesktopCertsOpen] = useState(false)
  const [desktopLibraryOpen, setDesktopLibraryOpen] = useState(false)
  const [libraryFlyoutPanel, setLibraryFlyoutPanel] = useState<'type' | 'topic' | null>(null)

  const certsRef = useRef<HTMLLIElement>(null)
  const libraryRef = useRef<HTMLLIElement>(null)
  const certsCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const libraryCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close desktop dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (certsRef.current && !certsRef.current.contains(e.target as Node)) {
        setDesktopCertsOpen(false)
      }
      if (libraryRef.current && !libraryRef.current.contains(e.target as Node)) {
        setDesktopLibraryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Hover helpers — Certifications
  const certsMouseEnter = useCallback(() => {
    if (certsCloseTimeout.current) { clearTimeout(certsCloseTimeout.current); certsCloseTimeout.current = null }
    setDesktopCertsOpen(true)
  }, [])
  const certsMouseLeave = useCallback(() => {
    certsCloseTimeout.current = setTimeout(() => setDesktopCertsOpen(false), 150)
  }, [])

  // Hover helpers — Library
  const libraryMouseEnter = useCallback(() => {
    if (libraryCloseTimeout.current) { clearTimeout(libraryCloseTimeout.current); libraryCloseTimeout.current = null }
    setDesktopLibraryOpen(true)
  }, [])
  const libraryMouseLeave = useCallback(() => {
    libraryCloseTimeout.current = setTimeout(() => setDesktopLibraryOpen(false), 150)
  }, [])

  const closeLibraryDropdown = useCallback(() => {
    setDesktopLibraryOpen(false)
    setLibraryFlyoutPanel(null)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-diligent-gray-2 bg-white">
      <div className="relative mx-auto flex h-[72px] max-w-[var(--max-content-width)] items-center px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center no-underline hover:no-underline"
          aria-label="Diligent Learning Hub — Home"
        >
          <Image
            src="/diligent-logo.jpg"
            alt="Diligent"
            width={115}
            height={32}
            className="block h-8 w-auto"
            priority
          />
          <span className="ml-2 text-lg font-semibold text-diligent-gray-5">
            Learning Hub
          </span>
        </Link>

        {/* Desktop nav — centred, hidden on mobile */}
        <nav
          aria-label="Primary"
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
        >
          <ul className="flex items-center gap-8 text-sm font-medium">
            {/* Library dropdown */}
            <li
              ref={libraryRef}
              className="relative"
              onMouseEnter={libraryMouseEnter}
              onMouseLeave={libraryMouseLeave}
            >
              <button
                type="button"
                className="flex items-center gap-0.5 p-0 leading-normal text-sm font-medium text-diligent-gray-5 hover:text-diligent-red"
                onClick={() => setDesktopLibraryOpen((prev) => !prev)}
              >
                Library
                <Icon
                  name="expand_more"
                  className={`text-[18px] transition-transform ${desktopLibraryOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {desktopLibraryOpen && (
                <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2">
                  <div className="relative w-[280px]">
                    {/* Left panel */}
                    <div className="w-[280px] rounded-lg border border-diligent-gray-2 bg-white py-2 shadow-lg">
                      <Link
                        href="/library"
                        onClick={closeLibraryDropdown}
                        onMouseEnter={() => setLibraryFlyoutPanel(null)}
                        className="flex items-start gap-2.5 px-4 py-3 no-underline hover:bg-diligent-gray-1 hover:no-underline"
                      >
                        <Icon name="library_books" className="mt-0.5 text-[20px] text-diligent-red shrink-0" />
                        <div>
                          <span className="block text-sm text-diligent-gray-5">Resource library</span>
                          <span className="mt-0.5 block text-[11px] leading-snug font-normal text-diligent-gray-4">Browse all courses, templates, videos and learning paths</span>
                        </div>
                      </Link>

                      <div className="mx-4 my-1 border-t border-diligent-gray-2" />

                      <button
                        type="button"
                        onMouseEnter={() => setLibraryFlyoutPanel('type')}
                        className={`flex w-full items-center justify-between px-4 py-3 text-sm ${
                          libraryFlyoutPanel === 'type'
                            ? 'bg-diligent-gray-1 text-diligent-red'
                            : 'text-diligent-gray-5 hover:bg-diligent-gray-1 hover:text-diligent-red'
                        }`}
                      >
                        By content type
                        <Icon
                          name="chevron_right"
                          className={`text-[18px] ${libraryFlyoutPanel === 'type' ? 'text-diligent-red' : ''}`}
                        />
                      </button>

                      <button
                        type="button"
                        onMouseEnter={() => setLibraryFlyoutPanel('topic')}
                        className={`flex w-full items-center justify-between px-4 py-3 text-sm ${
                          libraryFlyoutPanel === 'topic'
                            ? 'bg-diligent-gray-1 text-diligent-red'
                            : 'text-diligent-gray-5 hover:bg-diligent-gray-1 hover:text-diligent-red'
                        }`}
                      >
                        By topic
                        <Icon
                          name="chevron_right"
                          className={`text-[18px] ${libraryFlyoutPanel === 'topic' ? 'text-diligent-red' : ''}`}
                        />
                      </button>
                    </div>

                    {/* Right panel — flyout, absolutely positioned so left panel never shifts */}
                    {libraryFlyoutPanel && (
                      <div className={`absolute left-full top-0 ml-1 rounded-lg border border-diligent-gray-2 bg-white py-2 shadow-lg ${
                        libraryFlyoutPanel === 'topic' ? 'w-[420px]' : 'w-[300px]'
                      }`}>
                        {libraryFlyoutPanel === 'type' &&
                          contentTypes.map((ct) => (
                            <Link
                              key={ct.label}
                              href={ct.href}
                              onClick={closeLibraryDropdown}
                              className="flex items-start gap-2.5 px-4 py-2.5 no-underline hover:bg-diligent-gray-1 hover:no-underline"
                            >
                              <Icon name={ct.icon} className="mt-0.5 text-[20px] text-diligent-red shrink-0" />
                              <div>
                                <span className="block text-sm text-diligent-gray-5">{ct.label}</span>
                                <span className="block text-xs font-normal text-diligent-gray-4">{ct.description}</span>
                              </div>
                            </Link>
                          ))}
                        {libraryFlyoutPanel === 'topic' &&
                          [...subjectGroups].sort((a, b) => a.name.localeCompare(b.name)).map((group) => (
                            <Link
                              key={group.slug}
                              href={buildTopicHref(group.subjectIds)}
                              onClick={closeLibraryDropdown}
                              className="flex items-start gap-2.5 px-4 py-2.5 no-underline hover:bg-diligent-gray-1 hover:no-underline"
                            >
                              <Icon name={topicIcons[group.slug] ?? 'folder'} className="mt-0.5 text-[20px] text-diligent-red shrink-0" />
                              <div>
                                <span className="block whitespace-nowrap text-sm text-diligent-gray-5">{toSentenceCase(group.name)}</span>
                                <span className="block whitespace-nowrap text-xs font-normal text-diligent-gray-4">{topicDescriptions[group.slug] ?? ''}</span>
                              </div>
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>

            {/* Certifications dropdown */}
            <li
              ref={certsRef}
              className="relative"
              onMouseEnter={certsMouseEnter}
              onMouseLeave={certsMouseLeave}
            >
              <button
                type="button"
                className="flex items-center gap-0.5 p-0 leading-normal text-sm font-medium text-diligent-gray-5 hover:text-diligent-red"
                onClick={() => setDesktopCertsOpen((prev) => !prev)}
              >
                Certifications
                <Icon
                  name="expand_more"
                  className={`text-[18px] transition-transform ${desktopCertsOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {desktopCertsOpen && (
                <div className="absolute left-1/2 top-full z-50 min-w-[360px] -translate-x-1/2 pt-2">
                  <div className="rounded-lg border border-diligent-gray-2 bg-white py-2 shadow-lg">
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
            {/* Library accordion */}
            <li>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-diligent-gray-5 hover:bg-diligent-gray-1 hover:text-diligent-red"
                onClick={() => setMobileLibraryOpen(!mobileLibraryOpen)}
                aria-expanded={mobileLibraryOpen}
              >
                Library
                <Icon
                  name="expand_more"
                  className={`text-[18px] transition-transform ${mobileLibraryOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {mobileLibraryOpen && (
                <ul className="mt-1 flex flex-col gap-0.5 pl-4">
                  <li>
                    <Link
                      href="/library"
                      className="block rounded-md px-3 py-2 no-underline hover:bg-diligent-gray-1 hover:no-underline"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="block text-sm text-diligent-gray-5">Resource library</span>
                      <span className="block text-xs font-normal text-diligent-gray-4">Browse all courses, templates, videos and learning paths</span>
                    </Link>
                  </li>

                  {/* By content type */}
                  <li>
                    <button
                      type="button"
                      onClick={() => setMobileByTypeOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-diligent-gray-5 hover:bg-diligent-gray-1 hover:text-diligent-red"
                    >
                      By content type
                      <Icon
                        name="expand_more"
                        className={`text-[16px] transition-transform ${mobileByTypeOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {mobileByTypeOpen && (
                      <ul className="flex flex-col gap-0.5 pl-4">
                        {contentTypes.map((ct) => (
                          <li key={ct.label}>
                            <Link
                              href={ct.href}
                              className="block rounded-md px-3 py-2 text-sm text-diligent-gray-4 no-underline hover:bg-diligent-gray-1 hover:text-diligent-gray-5 hover:no-underline"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {ct.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>

                  {/* By topic */}
                  <li>
                    <button
                      type="button"
                      onClick={() => setMobileByTopicOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-diligent-gray-5 hover:bg-diligent-gray-1 hover:text-diligent-red"
                    >
                      By topic
                      <Icon
                        name="expand_more"
                        className={`text-[16px] transition-transform ${mobileByTopicOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {mobileByTopicOpen && (
                      <ul className="flex flex-col gap-0.5 pl-4">
                        {subjectGroups.map((group) => (
                          <li key={group.slug}>
                            <Link
                              href={buildTopicHref(group.subjectIds)}
                              className="block rounded-md px-3 py-2 text-sm text-diligent-gray-4 no-underline hover:bg-diligent-gray-1 hover:text-diligent-gray-5 hover:no-underline"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {toSentenceCase(group.name)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                </ul>
              )}
            </li>

            {/* Certifications accordion */}
            <li>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-diligent-gray-5 hover:bg-diligent-gray-1 hover:text-diligent-red"
                onClick={() => setMobileCertsOpen(!mobileCertsOpen)}
                aria-expanded={mobileCertsOpen}
              >
                Certifications
                <Icon
                  name="expand_more"
                  className={`text-[18px] transition-transform ${mobileCertsOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {mobileCertsOpen && (
                <ul className="mt-1 flex flex-col gap-0.5 pl-4">
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
