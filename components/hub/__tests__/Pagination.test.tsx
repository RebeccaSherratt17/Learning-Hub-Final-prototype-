import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Pagination, getPageNumbers } from '@/components/hub/Pagination'

describe('getPageNumbers', () => {
  it('returns all pages when total <= 7', () => {
    expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('returns truncated range with ellipsis for many pages, current near start', () => {
    expect(getPageNumbers(2, 12)).toEqual([1, 2, 3, '...', 12])
  })

  it('returns truncated range with ellipsis for many pages, current near end', () => {
    expect(getPageNumbers(11, 12)).toEqual([1, '...', 10, 11, 12])
  })

  it('returns double ellipsis for current in middle', () => {
    expect(getPageNumbers(6, 12)).toEqual([1, '...', 5, 6, 7, '...', 12])
  })
})

describe('Pagination', () => {
  it('renders nothing when totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders page buttons', () => {
    const onChange = vi.fn()
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={onChange} />,
    )
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('marks current page as aria-current', () => {
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={() => {}} />,
    )
    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page')
  })
})
