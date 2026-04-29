'use client'

interface AdminTopbarProps {
  onMenuToggle: () => void
  userName?: string | null
  userEmail?: string | null
}

export default function AdminTopbar({
  onMenuToggle,
  userName,
  userEmail,
}: AdminTopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-diligent-gray-2 bg-white px-4 md:px-6">
      <button
        onClick={onMenuToggle}
        className="inline-flex items-center justify-center rounded-md p-2 text-diligent-gray-4 hover:bg-diligent-gray-1 hover:text-diligent-gray-5 md:hidden"
        aria-label="Toggle navigation menu"
      >
        <span className="material-symbols-sharp text-[24px]">menu</span>
      </button>

      <div className="hidden md:block" />

      <div className="text-right">
        {userName && (
          <p className="text-sm font-medium text-diligent-gray-5">{userName}</p>
        )}
        {userEmail && (
          <p className="text-xs text-diligent-gray-3">{userEmail}</p>
        )}
      </div>
    </header>
  )
}
