import Link from 'next/link'
import Image from 'next/image'

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block py-1.5 text-sm text-[#A0A2A5] no-underline hover:text-white hover:no-underline"
    >
      {children}
    </a>
  )
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#3A3F47] text-[#C8CACD] no-underline transition hover:border-white hover:bg-white/[0.04] hover:text-white hover:no-underline"
    >
      {children}
    </a>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t-4 border-diligent-red bg-[#0F1217] pb-8 pt-16">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        {/* Link grid */}
        <div className="grid grid-cols-1 gap-12 border-b border-[#20242B] pb-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo column */}
          <div>
            <Link href="/" className="no-underline hover:no-underline" aria-label="Diligent — Home">
              <Image
                src="/diligent-logo-white.png"
                alt="Diligent"
                width={115}
                height={32}
                className="block h-9 w-auto"
              />
            </Link>
          </div>

          {/* Solutions */}
          <div>
            <p className="mb-4 text-[13px] font-semibold text-white">Solutions</p>
            <FooterLink href="https://www.diligent.com/products/boards">Board Management</FooterLink>
            <FooterLink href="https://www.diligent.com/products/enterprise-risk-management">Enterprise Risk Management</FooterLink>
            <FooterLink href="https://www.diligent.com/products/internal-audit">Audit Management</FooterLink>
            <FooterLink href="https://www.diligent.com/products/market-intelligence">Market Intelligence</FooterLink>
          </div>

          {/* Resources */}
          <div>
            <p className="mb-4 text-[13px] font-semibold text-white">Resources</p>
            <FooterLink href="https://www.diligent.com/resources/blog">Blog</FooterLink>
            <FooterLink href="https://www.diligent.com/resources/research">Research &amp; Reports</FooterLink>
            <FooterLink href="https://www.diligent.com/resources/podcasts">Podcasts</FooterLink>
            <FooterLink href="https://www.diligent.com/resources/guides">Guides</FooterLink>
            <FooterLink href="https://www.diligent.com/newsletter-signup">Newsletter Signup</FooterLink>
          </div>

          {/* Company */}
          <div>
            <p className="mb-4 text-[13px] font-semibold text-white">Company</p>
            <FooterLink href="https://www.diligent.com/company/about-us">About us</FooterLink>
            <FooterLink href="https://www.diligent.com/company/careers">Careers</FooterLink>
            <FooterLink href="https://www.diligent.com/support">Support</FooterLink>
            <FooterLink href="https://www.diligent.com/partners/showcase">Partners</FooterLink>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col-reverse items-center justify-between gap-4 pt-6 sm:flex-row">
          <div className="flex gap-2.5">
            {/* LinkedIn */}
            <SocialIcon href="https://www.linkedin.com/company/diligent-board-member-services" label="LinkedIn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8h4.56v14H.22V8zm7.5 0h4.37v1.91h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 7v7.45h-4.56v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.71-2.54 3.48v6.72H7.72V8z" />
              </svg>
            </SocialIcon>
            {/* X */}
            <SocialIcon href="https://x.com/diligentHQ" label="X">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.967 6.817H1.677l7.73-8.835L1.252 2.25h6.83l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
              </svg>
            </SocialIcon>
            {/* YouTube */}
            <SocialIcon href="https://www.youtube.com/@diligent_hq" label="YouTube">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
              </svg>
            </SocialIcon>
            {/* Facebook */}
            <SocialIcon href="https://www.facebook.com/DiligentCorporation" label="Facebook">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
              </svg>
            </SocialIcon>
          </div>
          <span className="text-[13px] text-[#6F7377]">
            &copy; 2026 Diligent Corporation. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}
