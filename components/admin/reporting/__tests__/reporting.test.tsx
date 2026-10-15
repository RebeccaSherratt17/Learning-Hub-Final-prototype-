import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import TrendChart from '../TrendChart'
import ItemsReportTable from '../ItemsReportTable'
import PopularContent from '../PopularContent'
import DateRangeFilter from '../DateRangeFilter'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

beforeAll(() => {
  // jsdom has no layout — report a fixed chart width
  globalThis.ResizeObserver = class {
    constructor(private cb: ResizeObserverCallback) {}
    observe() {
      this.cb([{ contentRect: { width: 800 } } as ResizeObserverEntry], this as unknown as ResizeObserver)
    }
    unobserve() {}
    disconnect() {}
  }
})

const points = [
  { date: '2026-10-13', visitors: 12, views: 30 },
  { date: '2026-10-14', visitors: 20, views: 41 },
  { date: '2026-10-15', visitors: 8, views: 15 },
]

describe('TrendChart', () => {
  it('shows the period total and switches metric', () => {
    render(<TrendChart points={points} bucket="day" />)
    expect(screen.getByText('Unique visitors over time')).toBeInTheDocument()
    expect(screen.getByText(/^40 in this period/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Page views' }))
    expect(screen.getByText('Page views over time')).toBeInTheDocument()
    expect(screen.getByText(/^86 in this period/)).toBeInTheDocument()
  })

  it('reads values with the keyboard', () => {
    render(<TrendChart points={points} bucket="day" />)
    const chart = screen.getByRole('img')
    fireEvent.focus(chart)
    expect(screen.getByRole('status')).toHaveTextContent('8')
    fireEvent.keyDown(chart, { key: 'ArrowLeft' })
    expect(screen.getByRole('status')).toHaveTextContent('20')
  })

  it('offers a table view and an empty state', () => {
    const { unmount } = render(<TrendChart points={points} bucket="day" />)
    fireEvent.click(screen.getByRole('button', { name: 'Show as table' }))
    expect(screen.getAllByRole('row')).toHaveLength(4)
    unmount()

    render(<TrendChart points={[]} bucket="day" />)
    expect(screen.getByText('No visits recorded in this period yet.')).toBeInTheDocument()
  })
})

describe('ItemsReportTable', () => {
  const base = { allTimeViews: 0, leads: 0, downloads: null, starts: null, completions: null, badges: null }
  const items = [
    { ...base, id: 'c1', type: 'COURSE' as const, title: 'Board basics', status: 'PUBLISHED' as const, views: 5, visitors: 4, starts: 4, completions: 3, badges: 1 },
    { ...base, id: 't1', type: 'TEMPLATE' as const, title: 'Minutes template', status: 'PUBLISHED' as const, views: 50, visitors: 30, downloads: 12 },
    { ...base, id: 'v1', type: 'VIDEO' as const, title: 'Draft video', status: 'DRAFT' as const, views: 99, visitors: 1 },
  ]

  function titles() {
    return screen.getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[0].textContent)
  }

  it('defaults to published items sorted by views', () => {
    render(<ItemsReportTable items={items} rangeQuery="range=30d" />)
    expect(titles()).toEqual(['Minutes template', 'Board basics'])
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('filters by type and re-sorts by column', () => {
    render(<ItemsReportTable items={items} rangeQuery="range=30d" />)
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: '' } })
    expect(titles()[0]).toBe('Draft video')

    fireEvent.click(screen.getByRole('button', { name: 'Title' }))
    expect(titles()).toEqual(['Board basics', 'Draft video', 'Minutes template'])

    fireEvent.change(screen.getByLabelText('Filter by content type'), { target: { value: 'TEMPLATE' } })
    expect(titles()).toEqual(['Minutes template'])
  })

  it('links the CSV export to the current range', () => {
    render(<ItemsReportTable items={items} rangeQuery="range=custom&from=2026-09-01&to=2026-09-30" />)
    expect(screen.getByRole('link', { name: /Download CSV/ })).toHaveAttribute(
      'href',
      '/api/admin/reporting/export?report=items&range=custom&from=2026-09-01&to=2026-09-30',
    )
  })
})

describe('PopularContent', () => {
  const item = (id: string, type: 'COURSE' | 'TEMPLATE' | 'VIDEO' | 'LEARNING_PATH', title: string, views: number, allTimeViews: number) =>
    ({ id, type, title, views, visitors: views, allTimeViews })
  const items = [
    item('c1', 'COURSE', 'Course A', 3, 100),
    item('c2', 'COURSE', 'Course B', 9, 10),
    item('c3', 'COURSE', 'Course unseen', 0, 0),
    item('t1', 'TEMPLATE', 'Template A', 4, 4),
  ]

  function listFor(name: string) {
    const section = screen.getByRole('heading', { name }).closest('section')!
    return within(section).queryAllByRole('link').map((link) => link.getAttribute('aria-label'))
  }

  it('ranks each content type separately for the selected period', () => {
    render(<PopularContent items={items} periodLabel="last 30 days" />)
    expect(listFor('Courses')).toEqual([
      '1. Course B: 9 views · 9 unique visitors',
      '2. Course A: 3 views · 3 unique visitors',
    ])
    expect(listFor('Templates')).toEqual(['1. Template A: 4 views · 4 unique visitors'])
    expect(screen.getByText('No videos viewed in this period.')).toBeInTheDocument()
    expect(screen.getByText('No learning paths viewed in this period.')).toBeInTheDocument()
  })

  it('re-ranks by all-time views', () => {
    render(<PopularContent items={items} periodLabel="last 30 days" />)
    fireEvent.click(screen.getByRole('button', { name: 'All time' }))
    expect(listFor('Courses')).toEqual(['1. Course A: 100 all-time views', '2. Course B: 10 all-time views'])
  })
})

describe('DateRangeFilter', () => {
  it('navigates to a custom range', () => {
    render(<DateRangeFilter range="30d" from="2026-09-16" to="2026-10-15" today="2026-10-15" />)
    fireEvent.click(screen.getByRole('button', { name: /Custom range/ }))
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-01' } })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(push).toHaveBeenCalledWith('/admin/reporting?range=custom&from=2026-09-01&to=2026-09-30')
  })

  it('opens the custom form when a custom range is active', () => {
    render(<DateRangeFilter range="custom" from="2026-09-01" to="2026-09-30" today="2026-10-15" />)
    expect(screen.getByLabelText('From')).toHaveValue('2026-09-01')
    expect(screen.getByRole('link', { name: 'Last 7 days' })).toHaveAttribute('href', '/admin/reporting?range=7d')
  })
})
