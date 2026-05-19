'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGate } from './GateContext'
import GateForm from './GateForm'
import dynamic from 'next/dynamic'

const ScormEmbed = dynamic(() => import('@/components/content/ScormEmbed'), {
  ssr: false,
})

interface CourseRightColumnProps {
  accessTier: string
  courseId: string
  courseTitle: string
  launchFile: string | null
  scormVersion: string | null
  thumbnailUrl?: string | null
  thumbnailAlt?: string
}

export function CourseRightColumn({
  accessTier,
  courseId,
  courseTitle,
  launchFile,
  scormVersion,
}: CourseRightColumnProps) {
  const { gated } = useGate()

  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [lastName, setLastName] = useState('')
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  // SCORM embed state
  const [scormState, setScormState] = useState<{
    attemptId: string
    launchToken: string
    launchUrl: string
    scormVersion: '1.2' | '2004'
  } | null>(null)

  // Restore learner identity from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hub_scorm_learner')
      if (stored) {
        const learner = JSON.parse(stored)
        if (learner.firstName) setFirstName(learner.firstName)
        if (learner.email) setEmail(learner.email)
        if (learner.lastName) setLastName(learner.lastName)
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  const launchCourse = useCallback(async (fn: string, em: string, ln: string) => {
    setLaunching(true)
    setError(null)

    try {
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
          firstName: fn, email: em, lastName: ln,
        }))
      } catch {
        // localStorage may be unavailable — not critical
      }

      const data = await res.json()
      setScormState({
        attemptId: data.attemptId,
        launchToken: data.launchToken,
        launchUrl: data.launchUrl,
        scormVersion: data.scormVersion,
      })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLaunching(false)
    }
  }, [courseId])

  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !email.trim()) return
    await launchCourse(firstName.trim(), email.trim(), lastName.trim())
  }

  function handleScormClose() {
    setScormState(null)
  }

  function handleScormComplete() {
    setCompleted(true)
    setScormState(null)
  }

  // Show SCORM embed overlay if launched
  if (scormState) {
    return (
      <ScormEmbed
        launchUrl={scormState.launchUrl}
        scormVersion={scormState.scormVersion}
        attemptId={scormState.attemptId}
        launchToken={scormState.launchToken}
        courseTitle={courseTitle}
        onClose={handleScormClose}
        onComplete={handleScormComplete}
      />
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
            launchCourse(firstName, email, lastName)
          }}
          disabled={launching}
          className="mt-4 rounded bg-diligent-red px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2 disabled:opacity-50"
        >
          {launching ? 'Launching...' : 'Take again'}
        </button>
      </div>
    )
  }

  // Gate form for gated courses when not yet gated
  if (accessTier === 'GATED' && !gated) {
    return (
      <div className="rounded-xl border border-diligent-gray-2 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:p-8">
        <GateForm contentType="COURSE" contentId={courseId} />
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

  // Learner form + launch button (free or after gate)
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
            Email <span className="text-diligent-red">*</span>
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
