import Link from 'next/link'
import CourseList from '@/components/admin/CourseList'

export default function CoursesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-diligent-gray-5">Courses</h1>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 rounded bg-diligent-red px-4 py-2.5 text-sm font-medium text-white hover:bg-diligent-red-2"
        >
          <span className="material-symbols-sharp text-[20px]">add</span>
          Create course
        </Link>
      </div>
      <div className="mt-6">
        <CourseList />
      </div>
    </div>
  )
}
