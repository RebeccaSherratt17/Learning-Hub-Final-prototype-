interface StatCardProps {
  icon: string
  label: string
  total: number
  breakdown: string
}

export default function StatCard({ icon, label, total, breakdown }: StatCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-lg bg-white p-5 shadow-sm">
      <span className="material-symbols-sharp text-diligent-gray-4 text-[32px]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-3xl font-bold text-diligent-gray-5">{total}</p>
        <p className="mt-0.5 text-sm font-medium text-diligent-gray-5">{label}</p>
        <p className="mt-1 text-xs text-diligent-gray-4">{breakdown}</p>
      </div>
    </div>
  )
}
