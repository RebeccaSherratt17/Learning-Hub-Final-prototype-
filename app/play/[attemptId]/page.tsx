'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ScormEmbed from '@/components/content/ScormEmbed'
import { broadcastCompletion, takeLaunchData, type ScormLaunchData } from '@/lib/scorm/launchHandoff'

/**
 * Standalone SCORM player, opened in a new tab from the course page.
 * Hosting the course in its own window keeps the scorm-again LMS API on the
 * window that owns the course iframe.
 */
export default function PlayCoursePage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const [scorm, setScorm] = useState<ScormLaunchData | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const data = takeLaunchData(attemptId)
    if (data) setScorm(data)
    else setMissing(true)
  }, [attemptId])

  const handleComplete = useCallback(() => {
    if (scorm) broadcastCompletion(scorm.courseId, scorm.attemptId)
  }, [scorm])

  const handleClose = useCallback(() => window.close(), [])

  if (missing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-diligent-gray-1 px-6">
        <div className="max-w-md rounded-xl border border-diligent-gray-2 bg-white p-8 text-center shadow-sm">
          <span className="material-symbols-sharp text-[48px] text-diligent-gray-3" aria-hidden="true">
            timer_off
          </span>
          <h1 className="mt-3 text-lg font-bold text-diligent-gray-5">This course session has expired</h1>
          <p className="mt-2 text-sm text-diligent-gray-4">
            Please close this tab and select &ldquo;Start course&rdquo; again on the course page.
          </p>
        </div>
      </main>
    )
  }

  if (!scorm) return null

  return (
    <ScormEmbed
      attemptId={scorm.attemptId}
      launchToken={scorm.launchToken}
      launchUrl={scorm.launchUrl}
      scormVersion={scorm.scormVersion}
      courseTitle={scorm.courseTitle}
      onClose={handleClose}
      onComplete={handleComplete}
    />
  )
}
