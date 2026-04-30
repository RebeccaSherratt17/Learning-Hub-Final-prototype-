'use client'

import { useRouter } from 'next/navigation'
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
    filterParam: 'COURSE',
  },
  {
    icon: 'description',
    label: 'Templates',
    description:
      'Access professionally crafted and ready-to-use templates that accelerate your governance initiatives.',
    filterParam: 'TEMPLATE',
  },
  {
    icon: 'play_circle',
    label: 'Videos',
    description:
      'Watch interviews with industry experts and animated content breaking down complex principles into digestible, memorable formats.',
    filterParam: 'VIDEO',
  },
  {
    icon: 'route',
    label: 'Learning Paths',
    description:
      'Access curated sets of content on a given topic, helping you build skills with clarity and confidence.',
    filterParam: 'LEARNING_PATH',
  },
]

export function ContentTypeSignpost() {
  const router = useRouter()

  function handleClick(e: React.MouseEvent, filterParam: string) {
    e.preventDefault()
    router.push(`/?type=${filterParam}`, { scroll: false })
    setTimeout(() => {
      document
        .getElementById('resource-library')
        ?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="mt-16 grid grid-cols-1 gap-px border-y border-diligent-gray-2 bg-diligent-gray-2 sm:grid-cols-2 lg:grid-cols-4">
      {signposts.map((item) => (
        <a
          key={item.filterParam}
          href={`/?type=${item.filterParam}#resource-library`}
          onClick={(e) => handleClick(e, item.filterParam)}
          className="group relative flex flex-col gap-3 bg-white px-6 py-7 no-underline transition-colors hover:bg-diligent-gray-1 hover:no-underline"
        >
          <div className="flex h-10 w-10 items-center justify-center">
            <Icon
              name={item.icon}
              className="text-[32px] text-diligent-red"
            />
          </div>
          <p className="text-lg font-semibold tracking-tight text-diligent-gray-5">
            {item.label}
          </p>
          <p className="text-sm leading-relaxed text-diligent-gray-4">
            {item.description}
          </p>
          <Icon
            name="arrow_outward"
            className="absolute right-6 top-7 text-[18px] text-diligent-gray-3 transition-colors group-hover:text-diligent-red"
          />
        </a>
      ))}
    </div>
  )
}
