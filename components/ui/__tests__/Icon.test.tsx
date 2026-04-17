import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Icon } from '@/components/ui/Icon'

describe('Icon', () => {
  it('renders the Material Symbols name as text', () => {
    render(<Icon name="menu" />)
    expect(screen.getByText('menu')).toBeInTheDocument()
  })

  it('is aria-hidden by default (decorative)', () => {
    render(<Icon name="menu" />)
    expect(screen.getByText('menu')).toHaveAttribute('aria-hidden', 'true')
  })

  it('exposes an accessible name when label is provided', () => {
    render(<Icon name="search" label="Search" />)
    const icon = screen.getByRole('img', { name: 'Search' })
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('aria-hidden', 'false')
  })

  it('applies the material-symbols-sharp class', () => {
    render(<Icon name="menu" />)
    expect(screen.getByText('menu')).toHaveClass('material-symbols-sharp')
  })
})
