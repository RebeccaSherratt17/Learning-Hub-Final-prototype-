import { prisma } from '@/lib/db'
import HubSettingsForm from '@/components/admin/HubSettingsForm'

export default async function SettingsPage() {
  const settings = await prisma.hubSettings.findUnique({
    where: { id: 'hub_settings_singleton' },
  })

  const initialSettings = {
    librarySectionHeading: settings?.librarySectionHeading ?? null,
    librarySectionBody: settings?.librarySectionBody ?? null,
    footerHeading: settings?.footerHeading ?? null,
    footerBody: settings?.footerBody ?? null,
    footerCTAText: settings?.footerCTAText ?? null,
    footerEmail: settings?.footerEmail ?? null,
    defaultSeoTitle: settings?.defaultSeoTitle ?? null,
    defaultSeoDescription: settings?.defaultSeoDescription ?? null,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 font-bold text-diligent-gray-5">
          Settings
        </h1>
        <p className="mt-1 text-diligent-gray-4">
          Control key text across the Learning Hub — including the Resource Library heading and the footer call-to-action section.
        </p>
      </div>

      <HubSettingsForm initialSettings={initialSettings} />
    </div>
  )
}
