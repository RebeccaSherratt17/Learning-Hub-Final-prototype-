'use client'

import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'

interface AdminShellProps {
  userName?: string | null
  userEmail?: string | null
  children: React.ReactNode
}

export default function AdminShell({
  userName,
  userEmail,
  children,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
          userName={userName}
          userEmail={userEmail}
        />

        <main className="flex-1 overflow-y-auto bg-diligent-gray-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
