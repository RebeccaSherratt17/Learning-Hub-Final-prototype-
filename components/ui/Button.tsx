import Link from 'next/link'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-diligent-red text-white hover:bg-diligent-red-2 focus-visible:bg-diligent-red-2',
  secondary:
    'border border-diligent-red text-diligent-red bg-white hover:bg-diligent-gray-1 focus-visible:bg-diligent-gray-1',
  ghost:
    'bg-transparent text-current hover:bg-diligent-gray-1 focus-visible:bg-diligent-gray-1',
}

export interface ButtonProps {
  children: React.ReactNode
  variant?: ButtonVariant
  href?: string
  className?: string
  type?: 'button' | 'submit'
  onClick?: () => void
}

export function Button({
  children,
  variant = 'primary',
  href,
  className,
  type = 'button',
  onClick,
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-sm px-6 py-3 text-sm font-medium no-underline transition hover:no-underline focus-visible:no-underline',
    variantStyles[variant],
    className,
  )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} onClick={onClick}>
      {children}
    </button>
  )
}
