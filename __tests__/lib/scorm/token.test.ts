import { describe, it, expect, vi } from 'vitest'

// Mock the environment variable before importing
vi.stubEnv('SCORM_TOKEN_SECRET', 'a]3kF9#mPqR7$vLx!wZ2&nB5^jC8dY0sT4hU6gE1iA')

import { generateLaunchToken, verifyLaunchToken } from '@/lib/scorm/token'

describe('launch tokens', () => {
  it('generates a token that can be verified', () => {
    const token = generateLaunchToken('attempt-123', 'course-456')
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)

    const valid = verifyLaunchToken(token, 'attempt-123', 'course-456')
    expect(valid).toBe(true)
  })

  it('rejects a token with wrong attemptId', () => {
    const token = generateLaunchToken('attempt-123', 'course-456')
    const valid = verifyLaunchToken(token, 'attempt-999', 'course-456')
    expect(valid).toBe(false)
  })

  it('rejects a token with wrong courseId', () => {
    const token = generateLaunchToken('attempt-123', 'course-456')
    const valid = verifyLaunchToken(token, 'attempt-123', 'course-999')
    expect(valid).toBe(false)
  })

  it('rejects a tampered token', () => {
    const token = generateLaunchToken('attempt-123', 'course-456')
    const tampered = token.slice(0, -4) + 'xxxx'
    const valid = verifyLaunchToken(tampered, 'attempt-123', 'course-456')
    expect(valid).toBe(false)
  })

  it('rejects an empty token', () => {
    const valid = verifyLaunchToken('', 'attempt-123', 'course-456')
    expect(valid).toBe(false)
  })
})
