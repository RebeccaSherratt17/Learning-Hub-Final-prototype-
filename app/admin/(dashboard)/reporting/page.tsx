export const dynamic = 'force-dynamic'

import Link from 'next/link'
import StatCard from '@/components/admin/StatCard'
import StatusBadge from '@/components/admin/StatusBadge'
import TrendChart from '@/components/admin/reporting/TrendChart'
import ItemsReportTable from '@/components/admin/reporting/ItemsReportTable'
import DateRangeFilter from '@/components/admin/reporting/DateRangeFilter'
import PopularContent from '@/components/admin/reporting/PopularContent'
import { getReport } from '@/lib/admin/reporting'
import { REPORT_RANGES, rangeQuery, resolveRange, toDateParam } from '@/lib/admin/reportingRanges'

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReportingPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const period = resolveRange(resolvedSearchParams)
  const report = await getReport(period)
  const { overview, trackingSince } = report

  const isAllTime = period.range === 'all'
  const dateSpan = isAllTime
    ? `All time to ${formatShortDate(period.to)}`
    : `${formatShortDate(period.from)} – ${formatShortDate(period.to)}`
  const periodLabel =
    period.range === 'custom'
      ? dateSpan
      : (REPORT_RANGES.find((r) => r.value === period.range)?.label ?? '').toLowerCase()

  const noTrackingInWindow = trackingSince !== null && trackingSince >= period.end
  const trackingStartedLate = trackingSince !== null && trackingSince > period.from

  const completionRate =
    overview.courseStarts > 0
      ? `${Math.round((overview.courseCompletions / overview.courseStarts) * 100)}% of ${overview.courseStarts.toLocaleString('en-GB')} started`
      : 'No courses started'

  const query = rangeQuery(period)
  const exportLink = (report: string) => `/api/admin/reporting/export?report=${report}&${query}`

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-heading-1 font-bold text-diligent-gray-5">Reporting</h1>
          <p className="mt-1 text-diligent-gray-4">
            Visitors, engagement and learner activity across the Learning Hub.
          </p>
        </div>
        <a
          href={exportLink('leads')}
          className="inline-flex shrink-0 items-center gap-1.5 rounded border border-diligent-gray-2 bg-white px-3 py-2 text-sm font-medium text-diligent-gray-5 hover:bg-diligent-gray-1"
        >
          <span className="material-symbols-sharp text-[18px]">download</span>
          Download leads CSV
        </a>
      </div>

      {/* Date range — scopes everything below */}
      <div>
        <DateRangeFilter
          key={query}
          range={period.range}
          from={toDateParam(period.from)}
          to={toDateParam(period.to)}
          today={toDateParam(new Date())}
        />
        <p className="mt-3 text-sm text-diligent-gray-4">
          Showing <span className="font-medium text-diligent-gray-5">{dateSpan}</span> (UTC)
        </p>
      </div>

      {/* Tracking notice */}
      {(trackingSince === null || trackingStartedLate) && (
        <div className="flex items-start gap-3 rounded-lg border border-diligent-gray-2 bg-white p-4 text-sm text-diligent-gray-5">
          <span className="material-symbols-sharp text-[20px] text-diligent-gray-4">info</span>
          <p>
            {trackingSince === null
              ? 'Visitor and download tracking is switched on but no visits have been recorded yet. Figures will appear as people use the hub.'
              : noTrackingInWindow
                ? `Visitor and download tracking started on ${formatDate(trackingSince)}, after this period, so there is no visitor data for it.`
                : `Visitor and download tracking started on ${formatDate(trackingSince)}, so earlier visits aren't included.`}{' '}
            Leads, course and learning path figures include all historical data.
          </p>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon="group" label="Unique visitors" total={overview.visitors} breakdown="Each visitor counted once per day" />
        <StatCard icon="visibility" label="Page views" total={overview.pageViews} breakdown="Across all hub pages" />
        <StatCard icon="contact_mail" label="Leads" total={overview.leads} breakdown="Gate form submissions" />
        <StatCard icon="school" label="Course completions" total={overview.courseCompletions} breakdown={completionRate} />
        <StatCard icon="download" label="Template downloads" total={overview.templateDownloads} breakdown="Download button clicks" />
        <StatCard icon="workspace_premium" label="Badges issued" total={overview.badgesIssued} breakdown="Credly badges for courses and learning paths" />
      </div>

      {/* Trend */}
      <TrendChart points={report.trend} bucket={period.bucket} />

      {/* Most popular per content type */}
      <PopularContent items={report.items} periodLabel={periodLabel} />

      {/* Per-item table */}
      <ItemsReportTable items={report.items} rangeQuery={query} />

      {/* Learning paths */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-6 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-heading-3 font-bold text-diligent-gray-5">Learning paths</h2>
            <p className="mt-1 text-xs text-diligent-gray-4">
              {overview.pathEnrolments.toLocaleString('en-GB')} enrolments and{' '}
              {overview.pathCompletions.toLocaleString('en-GB')} completions in this period. A path is
              complete when all mandatory items are done.
            </p>
          </div>
          <a
            href={exportLink('learning-paths')}
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded border border-diligent-gray-2 px-3 py-2 text-sm font-medium text-diligent-gray-5 hover:bg-diligent-gray-1 lg:self-auto"
          >
            <span className="material-symbols-sharp text-[18px]">download</span>
            Download CSV
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-diligent-gray-2 text-xs font-semibold uppercase tracking-wider text-diligent-gray-3">
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Views</th>
                <th className="px-4 py-3 text-right" title="Learners who entered their details on the path page">Enrolled</th>
                <th className="px-4 py-3 text-right" title="Learners who completed at least one item">Active learners</th>
                <th className="px-4 py-3 text-right">Completions</th>
                <th className="px-4 py-3 text-right">Badges issued</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {report.paths.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-diligent-gray-4">
                    No learning paths yet.
                  </td>
                </tr>
              ) : (
                [...report.paths]
                  .sort((a, b) => b.enrolled - a.enrolled || b.activeLearners - a.activeLearners || a.title.localeCompare(b.title))
                  .map((path) => (
                    <tr key={path.id} className="border-b border-diligent-gray-1 hover:bg-diligent-gray-1/50">
                      <td className="max-w-[320px] px-4 py-3">
                        <Link
                          href={`/admin/learning-paths/${path.id}`}
                          className="block truncate font-medium text-diligent-gray-5 hover:text-link"
                          title={path.title}
                        >
                          {path.title}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={path.status} /></td>
                      <td className="px-4 py-3 text-right text-diligent-gray-5">{path.views.toLocaleString('en-GB')}</td>
                      <td className="px-4 py-3 text-right text-diligent-gray-5">{path.enrolled.toLocaleString('en-GB')}</td>
                      <td className="px-4 py-3 text-right text-diligent-gray-5">{path.activeLearners.toLocaleString('en-GB')}</td>
                      <td className="px-4 py-3 text-right text-diligent-gray-5">{path.completions.toLocaleString('en-GB')}</td>
                      <td className="px-4 py-3 text-right text-diligent-gray-5">{path.badges.toLocaleString('en-GB')}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
