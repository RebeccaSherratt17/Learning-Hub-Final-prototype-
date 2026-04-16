import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/cn'

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b')
  })

  it('merges conflicting tailwind classes, keeping the last', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('preserves non-conflicting classes', () => {
    expect(cn('px-2', 'py-4', 'text-diligent-red')).toBe('px-2 py-4 text-diligent-red')
  })
})
