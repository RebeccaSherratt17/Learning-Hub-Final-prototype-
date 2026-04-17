import { describe, it, expect, vi } from 'vitest'
import { filterItems, sortItems } from '@/components/hub/ResourceLibrary'

// Mock next/navigation for useSearchParams / useRouter
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
}))

const items = [
  {
    _id: '1',
    _type: 'course' as const,
    title: 'Board Governance 101',
    slug: 'board-governance-101',
    description: 'Intro to governance.',
    thumbnail: null,
    accessTier: 'free' as const,
    subjects: [{ _id: 's1', title: 'Board Governance', group: 'board-leadership-operations' }],
    personas: [{ _id: 'p1', title: 'Board Director' }],
    regions: [{ _id: 'r1', title: 'Global' }],
    publishedAt: '2026-04-10T00:00:00Z',
    archived: false,
  },
  {
    _id: '2',
    _type: 'template' as const,
    title: 'AI Risk Template',
    slug: 'ai-risk-template',
    description: 'Template for AI risk.',
    thumbnail: null,
    accessTier: 'gated' as const,
    subjects: [{ _id: 's2', title: 'AI', group: 'risk-management' }],
    personas: [{ _id: 'p2', title: 'Risk' }],
    regions: [{ _id: 'r1', title: 'Global' }],
    publishedAt: '2026-04-15T00:00:00Z',
    archived: false,
  },
  {
    _id: '3',
    _type: 'video' as const,
    title: 'Compliance Overview',
    slug: 'compliance-overview',
    description: 'Video on compliance.',
    thumbnail: null,
    accessTier: 'free' as const,
    subjects: [{ _id: 's3', title: 'Compliance', group: 'regulations-compliance' }],
    personas: [{ _id: 'p1', title: 'Board Director' }],
    regions: [{ _id: 'r2', title: 'UK' }],
    publishedAt: '2026-04-12T00:00:00Z',
    archived: false,
  },
]

describe('filterItems', () => {
  it('returns all items with empty filters', () => {
    const result = filterItems(items as any, '', {
      types: [],
      personas: [],
      regions: [],
      subjects: [],
    })
    expect(result).toHaveLength(3)
  })

  it('filters by search term (case-insensitive)', () => {
    const result = filterItems(items as any, 'ai', {
      types: [],
      personas: [],
      regions: [],
      subjects: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe('2')
  })

  it('filters by content type', () => {
    const result = filterItems(items as any, '', {
      types: ['course'],
      personas: [],
      regions: [],
      subjects: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0]._type).toBe('course')
  })

  it('filters by persona (OR within category)', () => {
    const result = filterItems(items as any, '', {
      types: [],
      personas: ['p1'],
      regions: [],
      subjects: [],
    })
    expect(result).toHaveLength(2)
  })

  it('combines filters with AND between categories', () => {
    const result = filterItems(items as any, '', {
      types: ['course'],
      personas: ['p1'],
      regions: [],
      subjects: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe('1')
  })
})

describe('sortItems', () => {
  it('sorts by newest (publishedAt desc)', () => {
    const sorted = sortItems([...items] as any, 'newest')
    expect(sorted[0]._id).toBe('2')
  })

  it('sorts alphabetically', () => {
    const sorted = sortItems([...items] as any, 'az')
    expect(sorted[0].title).toBe('AI Risk Template')
    expect(sorted[2].title).toBe('Compliance Overview')
  })
})
