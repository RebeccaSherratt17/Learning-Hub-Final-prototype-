import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('renders as a link when href is provided', () => {
    render(<Button href="/demo">Request a demo</Button>)
    const link = screen.getByRole('link', { name: 'Request a demo' })
    expect(link).toHaveAttribute('href', '/demo')
  })

  it('applies primary variant styles by default', () => {
    render(<Button>CTA</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-diligent-red')
  })

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-diligent-red')
  })

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-transparent')
  })
})
