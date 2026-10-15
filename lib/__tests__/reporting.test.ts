import { describe, it, expect } from 'vitest'
import { bucketKeys, bucketStart, parseRange, rangeStart } from '@/lib/admin/reportingRanges'
import { toCsv } from '@/lib/admin/csv'
import { isBot, getClientIp, visitorHash } from '@/lib/analytics/visitor'

describe('reporting ranges', () => {
  const now = new Date('2026-10-15T14:30:00Z')

  it('defaults unknown ranges to 30 days', () => {
    expect(parseRange(undefined)).toBe('30d')
    expect(parseRange('bogus')).toBe('30d')
    expect(parseRange('12m')).toBe('12m')
  })

  it('counts today as the first day of the range', () => {
    expect(rangeStart('7d', now).toISOString()).toBe('2026-10-09T00:00:00.000Z')
    expect(rangeStart('all', now).getTime()).toBe(0)
  })

  it('starts weeks on Monday like Postgres date_trunc', () => {
    // 2026-10-15 is a Thursday
    expect(bucketStart(now, 'week').toISOString().slice(0, 10)).toBe('2026-10-12')
    expect(bucketStart(new Date('2026-10-18T23:00:00Z'), 'week').toISOString().slice(0, 10)).toBe('2026-10-12')
    expect(bucketStart(now, 'month').toISOString().slice(0, 10)).toBe('2026-10-01')
  })

  it('fills every bucket between two dates', () => {
    expect(bucketKeys(rangeStart('7d', now), now, 'day')).toEqual([
      '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15',
    ])
    expect(bucketKeys(new Date('2026-08-20T00:00:00Z'), now, 'month')).toEqual(['2026-08-01', '2026-09-01', '2026-10-01'])
  })
})

describe('toCsv', () => {
  it('quotes cells containing commas, quotes and newlines', () => {
    expect(toCsv(['a', 'b'], [['x, y', 'say "hi"'], ['line\nbreak', 3]])).toBe(
      'a,b\r\n"x, y","say ""hi"""\r\n"line\nbreak",3',
    )
  })

  it('renders null as empty and neutralises formulas', () => {
    expect(toCsv(['a', 'b'], [[null, '=HYPERLINK("x")']])).toBe('a,b\r\n,"\'=HYPERLINK(""x"")"')
    expect(toCsv(['n'], [[-5]])).toBe('n\r\n-5')
  })
})

describe('visitor identification', () => {
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0'
  const secret = 'test-secret'

  it('detects bots and missing user agents', () => {
    expect(isBot(null)).toBe(true)
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true)
    expect(isBot(ua)).toBe(false)
  })

  it('reads the first forwarded IP', () => {
    expect(getClientIp(new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }))).toBe('203.0.113.5')
    expect(getClientIp(new Headers({ 'x-real-ip': '198.51.100.7' }))).toBe('198.51.100.7')
    expect(getClientIp(new Headers())).toBe('')
  })

  it('is stable within a day and rotates across days', () => {
    const morning = visitorHash('203.0.113.5', ua, new Date('2026-10-15T08:00:00Z'), secret)
    const evening = visitorHash('203.0.113.5', ua, new Date('2026-10-15T22:00:00Z'), secret)
    const nextDay = visitorHash('203.0.113.5', ua, new Date('2026-10-16T08:00:00Z'), secret)
    expect(morning).toBe(evening)
    expect(morning).not.toBe(nextDay)
    expect(morning).not.toContain('203.0.113.5')
  })
})
