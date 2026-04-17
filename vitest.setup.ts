import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
import { createElement } from 'react'

// Provide Sanity env vars so sanity/env.ts doesn't throw during import
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= 'test-project'
process.env.NEXT_PUBLIC_SANITY_DATASET ??= 'test-dataset'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    const { fill, ...rest } = props
    return createElement('img', rest)
  },
}))
