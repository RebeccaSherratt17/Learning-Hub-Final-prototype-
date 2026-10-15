import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLeads, getReport } from '@/lib/admin/reporting'
import { parseRange } from '@/lib/admin/reportingRanges'
import { toCsv } from '@/lib/admin/csv'

const TYPE_LABELS = {
  COURSE: 'Course',
  TEMPLATE: 'Template',
  VIDEO: 'Video',
  LEARNING_PATH: 'Learning path',
} as const

/**
 * GET /api/admin/reporting/export?report=items|learning-paths|leads&range=30d
 * Downloads the selected reporting table as CSV.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const report = url.searchParams.get('report')
  const range = parseRange(url.searchParams.get('range') ?? undefined)

  try {
    let csv: string

    if (report === 'items') {
      const { items } = await getReport(range)
      csv = toCsv(
        ['Title', 'Type', 'Status', 'Views', 'Unique visitors', 'All-time views', 'Leads', 'Downloads', 'Course starts', 'Course completions', 'Badges issued'],
        items.map((i) => [
          i.title, TYPE_LABELS[i.type], i.status, i.views, i.visitors, i.allTimeViews, i.leads,
          i.downloads, i.starts, i.completions, i.badges,
        ]),
      )
    } else if (report === 'learning-paths') {
      const { paths } = await getReport(range)
      csv = toCsv(
        ['Title', 'Status', 'Views', 'Enrolled', 'Active learners', 'Completions', 'Badges issued'],
        paths.map((p) => [p.title, p.status, p.views, p.enrolled, p.activeLearners, p.completions, p.badges]),
      )
    } else if (report === 'leads') {
      const leads = await getLeads(range)
      csv = toCsv(
        ['Submitted at', 'First name', 'Last name', 'Email', 'Organization', 'Job title', 'Content type', 'Content'],
        leads.map((l) => [
          l.submittedAt, l.firstName, l.lastName, l.email, l.organization, l.jobTitle,
          TYPE_LABELS[l.contentType], l.contentTitle,
        ]),
      )
    } else {
      return NextResponse.json({ error: 'Unknown report' }, { status: 400 })
    }

    const date = new Date().toISOString().slice(0, 10)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="learning-hub-${report}-${range}-${date}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Failed to export report:', error)
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}
