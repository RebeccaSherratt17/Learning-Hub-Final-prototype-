import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { CourseRightColumn } from '../CourseRightColumn'
import { CourseObjectivesAccordion } from '../CourseObjectivesAccordion'
import { GateProvider } from '../GateContext'
import { broadcastCompletion, storeLaunchData, takeLaunchData } from '@/lib/scorm/launchHandoff'

const launchResponse = {
  attemptId: 'attempt-1',
  launchToken: 'token-abc',
  launchUrl: '/api/scorm/content/course-1/index.html',
  scormVersion: '1.2',
}

function renderColumn() {
  return render(
    <GateProvider initialGated>
      <CourseRightColumn accessTier="FREE" courseId="course-1" courseTitle="Board basics" launchFile="index.html" />
    </GateProvider>,
  )
}

async function startCourse() {
  fireEvent.change(screen.getByLabelText(/First name/), { target: { value: 'Ada' } })
  fireEvent.change(screen.getByLabelText(/Work email/), { target: { value: 'ada@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: 'Start course' }))
}

describe('CourseRightColumn', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(launchResponse), { status: 200 })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('opens the player tab and hands over the launch details', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window)
    renderColumn()
    await startCourse()

    expect(await screen.findByText('Course opened in a new tab')).toBeInTheDocument()
    expect(open).toHaveBeenCalledWith('/play/attempt-1', '_blank')
    expect(takeLaunchData('attempt-1')).toMatchObject({
      attemptId: 'attempt-1',
      courseId: 'course-1',
      launchToken: 'token-abc',
      courseTitle: 'Board basics',
    })
  })

  it('offers an Open course link when the new tab is blocked', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    renderColumn()
    await startCourse()

    const link = await screen.findByRole('link', { name: 'Open course' })
    expect(link).toHaveAttribute('href', '/play/attempt-1')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('shows the completion message when the player tab reports completion', async () => {
    vi.spyOn(window, 'open').mockReturnValue({} as Window)
    renderColumn()
    await startCourse()
    await screen.findByText('Course opened in a new tab')

    // A completion for a different course is ignored
    act(() => broadcastCompletion('other-course', 'attempt-9'))
    act(() => broadcastCompletion('course-1', 'attempt-1'))

    await waitFor(() => expect(screen.getByText('Course completed')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Take again' })).toBeInTheDocument()
  })
})

describe('launch hand-off', () => {
  it('can only be read once', () => {
    storeLaunchData({
      attemptId: 'a1', courseId: 'c1', launchToken: 't', launchUrl: '/x', scormVersion: '2004', courseTitle: 'T',
    })
    expect(takeLaunchData('a1')?.courseId).toBe('c1')
    expect(takeLaunchData('a1')).toBeNull()
  })
})

describe('CourseObjectivesAccordion', () => {
  it('sanitises the objectives HTML', () => {
    const { container } = render(
      <CourseObjectivesAccordion learningObjectives={'<ul><li>Understand duties</li></ul><img src=x onerror="alert(1)">'} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Learning Objectives/ }))
    expect(screen.getByText('Understand duties')).toBeInTheDocument()
    expect(container.querySelector('[onerror]')).toBeNull()
  })
})
