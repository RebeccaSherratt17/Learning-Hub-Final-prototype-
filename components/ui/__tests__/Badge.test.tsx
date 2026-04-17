import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge variant="course">Course</Badge>)
    expect(screen.getByText('Course')).toBeInTheDocument()
  })

  it('applies variant-specific classes', () => {
    const { rerender } = render(<Badge variant="course">Course</Badge>)
    expect(screen.getByText('Course')).toHaveClass('bg-diligent-gray-5')

    rerender(<Badge variant="premium">Premium</Badge>)
    expect(screen.getByText('Premium')).toHaveClass('bg-diligent-red-3')
  })
})
