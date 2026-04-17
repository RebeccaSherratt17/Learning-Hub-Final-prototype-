import { SiteHeader } from '@/components/hub/SiteHeader'
import { SiteFooter } from '@/components/hub/SiteFooter'

export default function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
