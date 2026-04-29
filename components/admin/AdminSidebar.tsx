'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navSections = [
  {
    label: 'Content',
    links: [
      { href: '/admin', icon: 'dashboard', label: 'Dashboard' },
      { href: '/admin/courses', icon: 'school', label: 'Courses' },
      { href: '/admin/templates', icon: 'description', label: 'Templates' },
      { href: '/admin/videos', icon: 'play_circle', label: 'Videos' },
      { href: '/admin/learning-paths', icon: 'route', label: 'Learning Paths' },
    ],
  },
  {
    label: 'Configuration',
    links: [
      { href: '/admin/taxonomy', icon: 'label', label: 'Taxonomy' },
      { href: '/admin/partners', icon: 'handshake', label: 'Partners' },
      { href: '/admin/badges', icon: 'workspace_premium', label: 'Badges' },
      { href: '/admin/redirects', icon: 'directions', label: 'Redirects' },
    ],
  },
  {
    label: 'System',
    links: [
      { href: '/admin/reporting', icon: 'bar_chart', label: 'Reporting' },
      { href: '/admin/settings', icon: 'settings', label: 'Settings' },
    ],
  },
]

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-lg transition-transform duration-200 ease-in-out md:static md:z-auto md:translate-x-0 md:shadow-none md:border-r md:border-diligent-gray-2 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-diligent-gray-2 px-6">
          <span className="text-lg font-bold text-diligent-gray-5">
            Learning Hub Admin
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
          {navSections.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">
                {section.label}
              </p>
              <ul>
                {section.links.map((link) => {
                  const active = isActive(link.href)
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? 'border-l-[3px] border-diligent-red bg-diligent-gray-1 text-diligent-gray-5'
                            : 'border-l-[3px] border-transparent text-diligent-gray-4 hover:bg-diligent-gray-1 hover:text-diligent-gray-5'
                        }`}
                      >
                        <span className="material-symbols-sharp text-[20px]">
                          {link.icon}
                        </span>
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-diligent-gray-2 p-3">
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-diligent-gray-4 transition-colors hover:bg-diligent-gray-1 hover:text-diligent-gray-5"
          >
            <span className="material-symbols-sharp text-[20px]">logout</span>
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
