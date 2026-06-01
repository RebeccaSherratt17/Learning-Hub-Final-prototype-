import { cn } from '@/lib/cn'

export interface IconProps {
  name: string
  className?: string
  /** If provided, icon is announced to screen readers with this label */
  label?: string
  /** Render the filled variant of the icon */
  fill?: boolean
}

export function Icon({ name, className, label, fill }: IconProps) {
  const decorative = !label
  return (
    <span
      className={cn('material-symbols-sharp select-none', className)}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden={decorative}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
    </span>
  )
}
