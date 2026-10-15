// Date-range and time-bucket helpers for the admin reporting page.
// Kept free of database imports so they can be unit tested and used client-side.

export type ReportRange = '7d' | '30d' | '90d' | '12m' | 'all' | 'custom'
export type PresetRange = Exclude<ReportRange, 'custom'>
export type TrendBucket = 'day' | 'week' | 'month'

export const REPORT_RANGES: { value: PresetRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
]

const PRESET_CONFIG: Record<PresetRange, { days: number | null; bucket: TrendBucket }> = {
  '7d': { days: 7, bucket: 'day' },
  '30d': { days: 30, bucket: 'day' },
  '90d': { days: 90, bucket: 'day' },
  '12m': { days: 365, bucket: 'week' },
  all: { days: null, bucket: 'month' },
}

const DAY_MS = 24 * 60 * 60 * 1000

/** A fully resolved reporting window. `from` and `to` are UTC day starts; `to` is inclusive. */
export interface ResolvedRange {
  range: ReportRange
  from: Date
  to: Date
  /** Exclusive upper bound for queries — the day after `to`. */
  end: Date
  bucket: TrendBucket
}

type RangeParams = {
  range?: string | string[] | null
  from?: string | string[] | null
  to?: string | string[] | null
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/** Parse a strict YYYY-MM-DD string as a UTC day, or null if invalid. */
export function parseDateParam(value: string | string[] | null | undefined): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

export function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Pick a bucket size that keeps the trend chart readable for a custom span. */
function bucketForSpan(from: Date, to: Date): TrendBucket {
  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1
  if (days <= 92) return 'day'
  if (days <= 730) return 'week'
  return 'month'
}

/**
 * Resolve URL params into a reporting window. Presets count today as day 1.
 * Invalid custom ranges fall back to the last 30 days; reversed dates are
 * swapped and future dates are clamped to today.
 */
export function resolveRange(params: RangeParams, now: Date = new Date()): ResolvedRange {
  const today = startOfUtcDay(now)
  const range = params.range

  if (range === 'custom') {
    let from = parseDateParam(params.from)
    let to = parseDateParam(params.to)
    if (from && to) {
      if (from > to) [from, to] = [to, from]
      if (to > today) to = today
      if (from > today) from = today
      return { range: 'custom', from, to, end: addDays(to, 1), bucket: bucketForSpan(from, to) }
    }
  }

  const preset: PresetRange = REPORT_RANGES.some((r) => r.value === range) ? (range as PresetRange) : '30d'
  const { days, bucket } = PRESET_CONFIG[preset]
  const from = days === null ? new Date(0) : addDays(today, -(days - 1))
  return { range: preset, from, to: today, end: addDays(today, 1), bucket }
}

/** Query string that reproduces a resolved range, e.g. for export links. */
export function rangeQuery(r: ResolvedRange): string {
  return r.range === 'custom'
    ? `range=custom&from=${toDateParam(r.from)}&to=${toDateParam(r.to)}`
    : `range=${r.range}`
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
