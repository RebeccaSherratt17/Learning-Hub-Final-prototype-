import { SiteHeader } from '@/components/hub/SiteHeader'
import { SiteFooter } from '@/components/hub/SiteFooter'
import { CookieConsentProvider } from '@/components/hub/CookieConsentProvider'
import { CookieConsentBanner } from '@/components/hub/CookieConsentBanner'

export default function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CookieConsentProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CookieConsentBanner />
      </div>
    </CookieConsentProvider>
  )
}
