import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

interface SignpostItem {
  icon: string
  label: string
  description: string
  filterParam: string
}

const signposts: SignpostItem[] = [
  {
    icon: 'school',
    label: 'Courses',
    description:
      'Master essential GRC topics through targeted short courses.',
    filterParam: 'course',
  },
  {
    icon: 'description',
    label: 'Templates',
    description:
      'Access professionally crafted and ready-to-use templates that accelerate your governance initiatives.',
    filterParam: 'template',
  },
  {
    icon: 'play_circle',
    label: 'Videos',
    description:
      'Watch interviews with industry experts and animated content breaking down complex principles into digestible, memorable formats.',
    filterParam: 'video',
  },
  {
    icon: 'route',
    label: 'Learning Paths',
    description:
      'Access curated sets of content on a given topic, helping you build skills with clarity and confidence.',
    filterParam: 'learningPath',
  },
]

export function ContentTypeSignpost() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {signposts.map((item) => (
        <Link
          key={item.filterParam}
          href={`/#library?type=${item.filterParam}`}
          className="group flex items-start gap-3 rounded-md border border-diligent-gray-2 p-4 no-underline transition hover:border-diligent-gray-3 hover:no-underline"
        >
          <Icon
            name={item.icon}
            className="mt-0.5 text-[28px] text-diligent-red"
          />
          <div>
            <p className="font-semibold text-diligent-gray-5">{item.label}</p>
            <p className="mt-1 text-sm text-diligent-gray-4">
              {item.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
