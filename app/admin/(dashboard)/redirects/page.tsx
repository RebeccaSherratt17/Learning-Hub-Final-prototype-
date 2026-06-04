import { prisma } from '@/lib/db'
import RedirectsManager from '@/components/admin/RedirectsManager'

export default async function RedirectsPage() {
  const redirects = await prisma.redirect.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 font-bold text-diligent-gray-5">
          Redirects
        </h1>
        <p className="mt-1 text-diligent-gray-4">
          Use this page to forward old or broken URLs to a new address. For example, if a page has moved, you can set up a redirect so anyone visiting the old link is automatically sent to the correct page — no dead ends for your visitors.
        </p>
      </div>

      <RedirectsManager
        initialRedirects={redirects.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
