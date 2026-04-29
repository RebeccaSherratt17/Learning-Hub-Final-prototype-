import Link from 'next/link'
import TemplateList from '@/components/admin/TemplateList'

export default function TemplatesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-diligent-gray-5">Templates</h1>
        <Link
          href="/admin/templates/new"
          className="flex items-center gap-2 rounded bg-diligent-red px-4 py-2.5 text-sm font-medium text-white hover:bg-diligent-red-2"
        >
          <span className="material-symbols-sharp text-[20px]">add</span>
          Create template
        </Link>
      </div>
      <div className="mt-6">
        <TemplateList />
      </div>
    </div>
  )
}
