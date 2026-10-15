'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGate } from './GateContext'
import { onCourseCompleted, storeLaunchData } from '@/lib/scorm/launchHandoff'

interface CourseRightColumnProps {
  accessTier: string
  courseId: string
  courseTitle: string
  launchFile: string | null
}

export function CourseRightColumn({
  accessTier,
  courseId,
  courseTitle,
  launchFile,
}: CourseRightColumnProps) {
  const { gated, markGated } = useGate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  // Set once the course has been opened in the player tab. `blocked` means the
  // browser stopped the new tab, so the learner needs to open it themselves.
  const [launched, setLaunched] = useState<{ attemptId: string; blocked: boolean } | null>(null)

  // The player tab broadcasts when the course is completed
  useEffect(
    () =>
      onCourseCompleted(courseId, () => {
        setLaunched(null)
        setCompleted(true)
      }),
    [courseId],
  )

  // Restore learner identity from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hub_scorm_learner')
      if (stored) {
        const learner = JSON.parse(stored)
        if (learner.firstName) setFirstName(learner.firstName)
        if (learner.lastName) setLastName(learner.lastName)
        if (learner.email) setEmail(learner.email)
        if (learner.organization) setOrganization(learner.organization)
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Whether the visitor has already passed the gate (30-day cookie)
  const hasGateSession = gated

  const launchCourse = useCallback(async (fn: string, ln: string, em: string, org: string) => {
    setLaunching(true)
    setError(null)

    try {
      // Submit to gate endpoint (sets 30-day hub_gated_access cookie,
      // stores lead data, and handles Marketo submission for gated courses)
      if (!hasGateSession) {
        const gateRes = await fetch('/api/gate/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: fn,
            lastName: ln,
            email: em,
            organization: org,
            jobTitle: '-', // Not collected on course form; placeholder
            contentType: 'COURSE',
            contentId: courseId,
          }),
        })

        if (!gateRes.ok) {
          const data = await gateRes.json()
          setError(data.error || 'Failed to submit details')
          return
        }

        markGated()
      }

      // Launch the SCORM course
      const res = await fetch('/api/scorm/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          firstName: fn,
          email: em,
          lastName: ln || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to launch course')
        return
      }

      // Persist learner identity for future launches
      try {
        localStorage.setItem('hub_scorm_learner', JSON.stringify({
          firstName: fn, lastName: ln, email: em, organization: org,
        }))
      } catch {
        // localStorage may be unavailable — not critical
      }

      const data = await res.json()

      // Hand the launch details to the player page, then open it in a new tab
      storeLaunchData({
        attemptId: data.attemptId,
        courseId,
        launchToken: data.launchToken,
        launchUrl: data.launchUrl,
        scormVersion: data.scormVersion,
        courseTitle,
      })
      const playerTab = window.open(`/play/${data.attemptId}`, '_blank')
      setCompleted(false)
      setLaunched({ attemptId: data.attemptId, blocked: !playerTab })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLaunching(false)
    }
  }, [courseId, courseTitle, hasGateSession, markGated])

  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !email.trim()) return
    await launchCourse(firstName.trim(), lastName.trim(), email.trim(), organization.trim())
  }

  // Course is open (or ready to open) in the player tab
  if (launched) {
    return (
      <div className="rounded-xl border border-diligent-gray-2 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:p-8 text-center">
        <span className="material-symbols-sharp text-[48px] text-diligent-red" aria-hidden="true">open_in_new</span>
        {launched.blocked ? (
          <>
            <h3 className="mt-3 text-lg font-bold text-diligent-gray-5">Your course is ready</h3>
            <p className="mt-2 text-sm text-diligent-gray-4">
              Your browser stopped the course opening in a new tab. Select the button below to open it.
            </p>
            <a
              href={`/play/${launched.attemptId}`}
              target="_blank"
              rel="noopener"
              onClick={() => setLaunched({ ...launched, blocked: false })}
              className="mt-4 inline-flex w-full items-center justify-center rounded bg-diligent-red px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
            >
              Open course
            </a>
          </>
        ) : (
          <>
            <h3 className="mt-3 text-lg font-bold text-diligent-gray-5">Course opened in a new tab</h3>
            <p className="mt-2 text-sm text-diligent-gray-4" role="status">
              Complete the course in the new tab. This page will update when you finish.
            </p>
            {error && (
              <p className="mt-3 text-sm text-diligent-red" role="alert">{error}</p>
            )}
            <button
              onClick={() => launchCourse(firstName, lastName, email, organization)}
              disabled={launching}
              className="mt-4 w-full rounded border border-diligent-gray-2 px-6 py-3 text-sm font-medium text-diligent-gray-5 transition-colors hover:bg-diligent-gray-1 disabled:opacity-50"
            >
              {launching ? 'Launching...' : 'Reopen course'}
            </button>
          </>
        )}
      </div>
    )
  }

  // Completion message
  if (completed) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 sm:p-8 text-center">
        <span className="material-symbols-sharp text-[48px] text-green-600">check_circle</span>
        <h3 className="mt-3 text-lg font-bold text-diligent-gray-5">Course completed</h3>
        <p className="mt-2 text-sm text-diligent-gray-4">
          Well done! You have successfully completed this course.
        </p>
        {error && (
          <p className="mt-2 text-sm text-diligent-red" role="alert">{error}</p>
        )}
        <button
          onClick={() => {
            setCompleted(false)
            launchCourse(firstName, lastName, email, organization)
          }}
          disabled={launching}
          className="mt-4 rounded bg-diligent-red px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2 disabled:opacity-50"
        >
          {launching ? 'Launching...' : 'Take again'}
        </button>
      </div>
    )
  }

  // Premium CTA
  if (accessTier === 'PREMIUM') {
    return (
      <div className="rounded-xl border border-diligent-gray-2 bg-diligent-gray-1 p-6 sm:p-8 text-center">
        <span className="material-symbols-sharp text-[48px] text-diligent-gray-3">lock</span>
        <h3 className="mt-3 text-lg font-bold text-diligent-gray-5">Premium content</h3>
        <p className="mt-2 text-sm text-diligent-gray-4">
          This course requires a Diligent One Platform subscription.
        </p>
        <a
          href="/#footer-cta"
          className="mt-4 inline-flex items-center rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
        >
          Request a demo
        </a>
      </div>
    )
  }

  // No SCORM package uploaded
  if (!launchFile) {
    return (
      <div className="rounded-xl border border-diligent-gray-2 bg-diligent-gray-1 p-6 sm:p-8 text-center">
        <span className="material-symbols-sharp text-[48px] text-diligent-gray-3">school</span>
        <h3 className="mt-3 text-lg font-bold text-diligent-gray-5">Course coming soon</h3>
        <p className="mt-2 text-sm text-diligent-gray-4">
          This course is not yet available. Check back soon.
        </p>
      </div>
    )
  }

  // Returning visitor with gate session — skip form, show launch button directly
  if (hasGateSession && firstName && email) {
    return (
      <div className="rounded-xl border border-diligent-gray-2 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:p-8 text-center">
        <span className="material-symbols-sharp text-[48px] text-diligent-red">school</span>
        <h3 className="mt-3 text-lg font-bold text-diligent-gray-5">Ready to learn</h3>
        <p className="mt-2 text-sm text-diligent-gray-4">
          Welcome back, {firstName}. Launch the course to pick up where you left off.
        </p>
        {error && (
          <p className="mt-3 text-sm text-diligent-red" role="alert">{error}</p>
        )}
        <button
          onClick={() => launchCourse(firstName, lastName, email, organization)}
          disabled={launching}
          className="mt-4 w-full rounded bg-diligent-red px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2 disabled:opacity-50"
        >
          {launching ? 'Launching...' : 'Start course'}
        </button>
      </div>
    )
  }

  // First-time form — same fields for Free and Gated courses
  return (
    <div className="rounded-xl border border-diligent-gray-2 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:p-8">
      <h3 className="text-lg font-bold text-diligent-gray-5">Start this course</h3>
      <p className="mt-1 text-sm text-diligent-gray-4">
        Enter your details to begin. Your progress will be tracked.
      </p>

      <form onSubmit={handleLaunch} className="mt-5 space-y-4">
        <div>
          <label htmlFor="learner-first-name" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            First name <span className="text-diligent-red">*</span>
          </label>
          <input
            id="learner-first-name"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded border border-diligent-gray-2 px-3 py-2.5 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        <div>
          <label htmlFor="learner-last-name" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Last name
          </label>
          <input
            id="learner-last-name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded border border-diligent-gray-2 px-3 py-2.5 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        <div>
          <label htmlFor="learner-email" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Work email <span className="text-diligent-red">*</span>
          </label>
          <input
            id="learner-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-diligent-gray-2 px-3 py-2.5 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        <div>
          <label htmlFor="learner-organization" className="block text-sm font-medium text-diligent-gray-5 mb-1">
            Organization
          </label>
          <input
            id="learner-organization"
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full rounded border border-diligent-gray-2 px-3 py-2.5 text-sm focus:border-diligent-red focus:outline-none focus:ring-1 focus:ring-diligent-red"
          />
        </div>

        {error && (
          <p className="text-sm text-diligent-red" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={launching || !firstName.trim() || !email.trim()}
          className="w-full rounded bg-diligent-red px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2 disabled:opacity-50"
        >
          {launching ? 'Launching...' : 'Start course'}
        </button>
      </form>
    </div>
  )
}
