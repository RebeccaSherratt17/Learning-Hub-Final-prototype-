import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <AdminShell
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </AdminShell>
  )
}
