import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ContentCard } from '@/components/hub/ContentCard'
import type { ContentItem } from '@/types/content'

const baseItem: ContentItem = {
  _id: 'c1',
  _type: 'course',
  title: 'ESG Fundamentals',
  slug: 'esg-fundamentals',
  description: 'A short course on ESG basics.',
  thumbnail: null,
  accessTier: 'free',
  subjects: [],
  publishedAt: '2026-04-01T00:00:00Z',
  archived: false,
} as unknown as ContentItem

describe('ContentCard', () => {
  it('renders title and description', () => {
    render(<ContentCard item={baseItem} />)
    expect(screen.getByText('ESG Fundamentals')).toBeInTheDocument()
    expect(screen.getByText(/ESG basics/i)).toBeInTheDocument()
  })

  it('renders a content-type badge', () => {
    render(<ContentCard item={baseItem} />)
    expect(screen.getByText('Course')).toBeInTheDocument()
  })

  it('renders an access-tier badge', () => {
    render(<ContentCard item={baseItem} />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('links to the correct detail page by _type and slug', () => {
    render(<ContentCard item={baseItem} />)
    const link = screen.getByRole('link', { name: /ESG Fundamentals/i })
    expect(link).toHaveAttribute('href', '/courses/esg-fundamentals')
  })

  it('uses /learning-paths/ for learning-path items', () => {
    render(<ContentCard item={{ ...baseItem, _type: 'learningPath' } as ContentItem} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/learning-paths/esg-fundamentals')
  })

  it('renders fallback thumbnail when none provided', () => {
    render(<ContentCard item={baseItem} />)
    const img = screen.getByAltText('ESG Fundamentals')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/images/fallback-thumbnail.svg')
  })
})
