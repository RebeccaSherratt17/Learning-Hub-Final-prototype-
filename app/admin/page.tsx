import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-heading-1 font-bold text-diligent-gray-5">
        Admin Dashboard
      </h1>
      <p className="mt-2 text-diligent-gray-4">
        Signed in as {session.user.email}
      </p>
    </div>
  )
}
