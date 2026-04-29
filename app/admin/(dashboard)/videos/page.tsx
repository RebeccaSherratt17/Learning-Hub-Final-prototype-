import Link from 'next/link'
import VideoList from '@/components/admin/VideoList'

export default function VideosPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-diligent-gray-5">Videos</h1>
        <Link
          href="/admin/videos/new"
          className="flex items-center gap-2 rounded bg-diligent-red px-4 py-2.5 text-sm font-medium text-white hover:bg-diligent-red-2"
        >
          <span className="material-symbols-sharp text-[20px]">add</span>
          Create video
        </Link>
      </div>
      <div className="mt-6">
        <VideoList />
      </div>
    </div>
  )
}
