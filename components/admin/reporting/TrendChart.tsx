'use client'

import { useEffect, useRef, useState } from 'react'
import type { TrendBucket } from '@/lib/admin/reportingRanges'

interface TrendPoint {
  date: string
  visitors: number
  views: number
}

interface TrendChartProps {
  points: TrendPoint[]
  bucket: TrendBucket
}

type Metric = 'visitors' | 'views'

const METRICS: { value: Metric; label: string }[] = [
  { value: 'visitors', label: 'Unique visitors' },
  { value: 'views', label: 'Page views' },
]

// Chart tokens — single series in brand Blue 3 (validated against white surface)
const SERIES = '#0B4CCE'
const GRID = '#F3F3F3'
const BASELINE = '#DADADA'
const AXIS_TEXT = '#5C5F63'

const HEIGHT = 260
const MARGIN = { top: 16, right: 16, bottom: 28, left: 44 }

function parseDate(key: string): Date {
  return new Date(`${key}T00:00:00Z`)
}

function formatTick(key: string, bucket: TrendBucket): string {
  const d = parseDate(key)
  return bucket === 'month'
    ? d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function formatPeriod(key: string, bucket: TrendBucket): string {
  const d = parseDate(key)
  if (bucket === 'month') return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  return bucket === 'week' ? `Week of ${day}` : day
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}K`
  return String(n)
}

/** Round the axis maximum up to a clean step so ticks read 0 / 25 / 50 ... */
function niceScale(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 4, step: 1 }
  const rough = max / 4
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough
  const niceStep = Math.max(1, step)
  return { top: Math.ceil(max / niceStep) * niceStep, step: niceStep }
}

export default function TrendChart({ points, bucket }: TrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [metric, setMetric] = useState<Metric>('visitors')
  const [active, setActive] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [showTable])

  const metricLabel = METRICS.find((m) => m.value === metric)!.label
  const values = points.map((p) => p[metric])
  const total = values.reduce((a, b) => a + b, 0)
  const { top, step } = niceScale(Math.max(0, ...values))

  const innerW = Math.max(0, width - MARGIN.left - MARGIN.right)
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom
  const x = (i: number) => MARGIN.left + (points.length <= 1 ? innerW / 2 : (i * innerW) / (points.length - 1))
  const y = (v: number) => MARGIN.top + innerH - (v / top) * innerH

  const linePath = values.length > 0
    ? `M${values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('L')}`
    : ''
  const areaPath = linePath
    ? `${linePath}L${x(values.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`
    : ''

  const yTicks: number[] = []
  for (let v = 0; v <= top; v += step) yTicks.push(v)

  // ~6 evenly spaced x labels, always including the last bucket
  const labelEvery = Math.max(1, Math.ceil(points.length / 6))
  const xLabels = points
    .map((p, i) => ({ i, key: p.date }))
    .filter(({ i }) => i % labelEvery === 0 || i === points.length - 1)
    .filter(({ i }, idx, arr) => idx === arr.length - 1 || points.length - 1 - i >= labelEvery / 2)

  function indexFromPointer(clientX: number): number {
    const rect = containerRef.current!.getBoundingClientRect()
    const relX = clientX - rect.left - MARGIN.left
    if (points.length <= 1) return 0
    const i = Math.round((relX / innerW) * (points.length - 1))
    return Math.min(points.length - 1, Math.max(0, i))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (points.length === 0) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const delta = e.key === 'ArrowRight' ? 1 : -1
      setActive((prev) => Math.min(points.length - 1, Math.max(0, (prev ?? points.length - 1) + delta)))
    } else if (e.key === 'Home') {
      setActive(0)
    } else if (e.key === 'End') {
      setActive(points.length - 1)
    } else if (e.key === 'Escape') {
      setActive(null)
    }
  }

  const activePoint = active !== null ? points[active] : null
  const tooltipLeft = active !== null ? Math.min(Math.max(x(active), 80), width - 80) : 0
  const isEmpty = points.length === 0 || values.every((v) => v === 0)

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-heading-3 font-bold text-diligent-gray-5">{metricLabel} over time</h2>
          <p className="mt-1 text-xs text-diligent-gray-4">
            {total.toLocaleString('en-GB')} in this period
            {metric === 'visitors' && ' · each visitor is counted once per day'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded border border-diligent-gray-2 p-0.5" role="group" aria-label="Chart metric">
            {METRICS.map((m) => (
              <button
                key={m.value}
                type="button"
                aria-pressed={metric === m.value}
                onClick={() => setMetric(m.value)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  metric === m.value
                    ? 'bg-diligent-gray-5 text-white'
                    : 'text-diligent-gray-4 hover:text-diligent-gray-5'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowTable((s) => !s)}
            className="text-xs font-medium text-link hover:underline"
          >
            {showTable ? 'Show chart' : 'Show as table'}
          </button>
        </div>
      </div>

      {showTable ? (
        <div className="mt-4 max-h-[260px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-diligent-gray-2 text-left text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">
                <th className="py-2 pr-4">Period</th>
                <th className="py-2 pr-4 text-right">Unique visitors</th>
                <th className="py-2 text-right">Page views</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {points.map((p) => (
                <tr key={p.date} className="border-b border-diligent-gray-1">
                  <td className="py-2 pr-4 text-diligent-gray-5">{formatPeriod(p.date, bucket)}</td>
                  <td className="py-2 pr-4 text-right text-diligent-gray-5">{p.visitors.toLocaleString('en-GB')}</td>
                  <td className="py-2 text-right text-diligent-gray-5">{p.views.toLocaleString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="relative mt-4 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-diligent-red"
          style={{ height: HEIGHT }}
          tabIndex={isEmpty ? -1 : 0}
          role="img"
          aria-label={`${metricLabel} by ${bucket}. Use the left and right arrow keys to read values.`}
          onKeyDown={handleKeyDown}
          onFocus={() => !isEmpty && setActive((prev) => prev ?? points.length - 1)}
          onBlur={() => setActive(null)}
          onPointerMove={(e) => !isEmpty && setActive(indexFromPointer(e.clientX))}
          onPointerLeave={() => setActive(null)}
        >
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-diligent-gray-3">
              <span className="material-symbols-sharp text-[40px]">monitoring</span>
              <p className="text-sm text-diligent-gray-4">No visits recorded in this period yet.</p>
            </div>
          ) : (
            width > 0 && (
              <svg width={width} height={HEIGHT} aria-hidden="true">
                {/* Gridlines + y ticks */}
                {yTicks.map((v) => (
                  <g key={v}>
                    <line
                      x1={MARGIN.left}
                      x2={width - MARGIN.right}
                      y1={y(v)}
                      y2={y(v)}
                      stroke={v === 0 ? BASELINE : GRID}
                      strokeWidth={1}
                    />
                    <text
                      x={MARGIN.left - 8}
                      y={y(v)}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize={11}
                      fill={AXIS_TEXT}
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {compact(v)}
                    </text>
                  </g>
                ))}

                {/* X labels */}
                {xLabels.map(({ i, key }) => (
                  <text
                    key={key}
                    x={x(i)}
                    y={HEIGHT - 8}
                    textAnchor={i === 0 && points.length > 1 ? 'start' : i === points.length - 1 && points.length > 1 ? 'end' : 'middle'}
                    fontSize={11}
                    fill={AXIS_TEXT}
                  >
                    {formatTick(key, bucket)}
                  </text>
                ))}

                {/* Series */}
                <path d={areaPath} fill={SERIES} fillOpacity={0.1} />
                <path d={linePath} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

                {/* Crosshair */}
                {active !== null && (
                  <g>
                    <line
                      x1={x(active)}
                      x2={x(active)}
                      y1={MARGIN.top}
                      y2={MARGIN.top + innerH}
                      stroke={AXIS_TEXT}
                      strokeWidth={1}
                    />
                    <circle cx={x(active)} cy={y(values[active])} r={6} fill="#FFFFFF" />
                    <circle cx={x(active)} cy={y(values[active])} r={4} fill={SERIES} />
                  </g>
                )}
              </svg>
            )
          )}

          {activePoint && (
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded border border-diligent-gray-2 bg-white px-3 py-2 shadow-md"
              style={{ left: tooltipLeft }}
              role="status"
            >
              <p className="text-xs text-diligent-gray-4">{formatPeriod(activePoint.date, bucket)}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-0.5 w-3 rounded" style={{ backgroundColor: SERIES }} aria-hidden="true" />
                <span className="text-sm font-semibold text-diligent-gray-5">
                  {activePoint[metric].toLocaleString('en-GB')}
                </span>
                <span className="text-xs text-diligent-gray-4">{metricLabel.toLowerCase()}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
