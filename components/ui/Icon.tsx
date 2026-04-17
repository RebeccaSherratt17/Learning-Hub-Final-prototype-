import { cn } from '@/lib/cn'

export interface IconProps {
  name: string
  className?: string
  /** If provided, icon is announced to screen readers with this label */
  label?: string
}

export function Icon({ name, className, label }: IconProps) {
  const decorative = !label
  return (
    <span
      className={cn('material-symbols-sharp select-none', className)}
      aria-hidden={decorative}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
    </span>
  )
}
