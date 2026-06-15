import { cn } from '@/lib/cn'

export interface IconProps {
  name: string
  className?: string
  /** If provided, icon is announced to screen readers with this label */
  label?: string
  /** Render the filled variant of the icon */
  fill?: boolean
  /** Font variant: 'sharp' (default) or 'rounded' */
  variant?: 'sharp' | 'rounded'
}

export function Icon({ name, className, label, fill, variant = 'sharp' }: IconProps) {
  const decorative = !label
  const fontClass = variant === 'rounded' ? 'material-symbols-rounded' : 'material-symbols-sharp'
  return (
    <span
      className={cn(fontClass, 'select-none', className)}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden={decorative}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
    </span>
  )
}
