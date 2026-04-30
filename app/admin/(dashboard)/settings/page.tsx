import { prisma } from '@/lib/db'
import HubSettingsForm from '@/components/admin/HubSettingsForm'

export default async function SettingsPage() {
  const settings = await prisma.hubSettings.findUnique({
    where: { id: 'hub_settings_singleton' },
  })

  const initialSettings = {
    heroHeading: settings?.heroHeading ?? null,
    heroSubheading: settings?.heroSubheading ?? null,
    heroOverview: settings?.heroOverview ?? null,
    heroCTAText: settings?.heroCTAText ?? null,
    heroCTAUrl: settings?.heroCTAUrl ?? null,
    popularSectionHeading: settings?.popularSectionHeading ?? null,
    partnersSectionHeading: settings?.partnersSectionHeading ?? null,
    librarySectionHeading: settings?.librarySectionHeading ?? null,
    librarySectionBody: settings?.librarySectionBody ?? null,
    certificationsSectionHeading: settings?.certificationsSectionHeading ?? null,
    certificationsSectionBody: settings?.certificationsSectionBody ?? null,
    footerHeading: settings?.footerHeading ?? null,
    footerBody: settings?.footerBody ?? null,
    footerCTAText: settings?.footerCTAText ?? null,
    demoCTAUrl: settings?.demoCTAUrl ?? null,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 font-bold text-diligent-gray-5">
          Settings
        </h1>
        <p className="mt-1 text-diligent-gray-4">
          Manage homepage copy and global settings.
        </p>
      </div>

      <HubSettingsForm initialSettings={initialSettings} />
    </div>
  )
}
