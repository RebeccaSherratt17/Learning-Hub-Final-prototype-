import Link from 'next/link'
import { cn } from '@/lib/cn'

interface BreadcrumbProps {
  items: { label: string; href?: string }[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-diligent-gray-3" aria-hidden="true">
                  ›
                </span>
              )}
              {item.href && !isLast ? (
                <Link href={item.href} className="text-link hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn('text-diligent-gray-4 font-medium')}
                  aria-current="page"
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
