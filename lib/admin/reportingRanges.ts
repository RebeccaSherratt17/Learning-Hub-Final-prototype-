// Date-range and time-bucket helpers for the admin reporting page.
// Kept free of database imports so they can be unit tested and used client-side.

export type ReportRange = '7d' | '30d' | '90d' | '12m' | 'all'
export type TrendBucket = 'day' | 'week' | 'month'

export const REPORT_RANGES: { value: ReportRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
]

const RANGE_CONFIG: Record<ReportRange, { days: number | null; bucket: TrendBucket }> = {
  '7d': { days: 7, bucket: 'day' },
  '30d': { days: 30, bucket: 'day' },
  '90d': { days: 90, bucket: 'day' },
  '12m': { days: 365, bucket: 'week' },
  all: { days: null, bucket: 'month' },
}

export function parseRange(value: string | string[] | undefined): ReportRange {
  return REPORT_RANGES.some((r) => r.value === value) ? (value as ReportRange) : '30d'
}

export function rangeBucket(range: ReportRange): TrendBucket {
  return RANGE_CONFIG[range].bucket
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/** Inclusive start of the range (today counts as day 1). `all` returns the epoch. */
export function rangeStart(range: ReportRange, now: Date = new Date()): Date {
  const days = RANGE_CONFIG[range].days
  if (days === null) return new Date(0)
  const start = startOfUtcDay(now)
  start.setUTCDate(start.getUTCDate() - (days - 1))
  return start
}

/** Start of the bucket containing `date`, matching Postgres date_trunc (weeks start Monday). */
export function bucketStart(date: Date, bucket: TrendBucket): Date {
  const d = startOfUtcDay(date)
  if (bucket === 'week') {
    const offset = (d.getUTCDay() + 6) % 7
    d.setUTCDate(d.getUTCDate() - offset)
  } else if (bucket === 'month') {
    d.setUTCDate(1)
  }
  return d
}

function nextBucket(date: Date, bucket: TrendBucket): Date {
  const d = new Date(date)
  if (bucket === 'day') d.setUTCDate(d.getUTCDate() + 1)
  else if (bucket === 'week') d.setUTCDate(d.getUTCDate() + 7)
  else d.setUTCMonth(d.getUTCMonth() + 1)
  return d
}

/** Every bucket key (YYYY-MM-DD) from `from` to `to`, so empty periods still plot as zero. */
export function bucketKeys(from: Date, to: Date, bucket: TrendBucket): string[] {
  const keys: string[] = []
  for (let d = bucketStart(from, bucket); d <= to; d = nextBucket(d, bucket)) {
    keys.push(d.toISOString().slice(0, 10))
  }
  return keys
}
