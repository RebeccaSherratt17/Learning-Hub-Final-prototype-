import { cn } from '@/lib/cn'

export type BadgeVariant =
  | 'course'
  | 'template'
  | 'video'
  | 'learningPath'
  | 'free'
  | 'gated'
  | 'premium'

const variantStyles: Record<BadgeVariant, string> = {
  course: 'bg-diligent-gray-5 text-white',
  template: 'bg-diligent-gray-2 text-diligent-gray-5',
  video: 'bg-diligent-red-3 text-white',
  learningPath: 'bg-diligent-blue-3 text-white',
  free: 'bg-diligent-gray-1 text-diligent-gray-5 ring-1 ring-diligent-gray-2',
  gated: 'bg-diligent-gray-5 text-white',
  premium: 'bg-diligent-red-3 text-white',
}

export interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
