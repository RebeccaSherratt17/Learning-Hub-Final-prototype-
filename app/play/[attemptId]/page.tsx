'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
// IMPORTANT: copy the exact ScormEmbed import line from CourseRightColumn.tsx
import ScormEmbed from '@/components/content/ScormEmbed'

type ScormState = {
  attemptId: string
  launchToken: string
  launchUrl: string
  scormVersion: '1.2' | '2004'
  courseTitle: string
}

export default function PlayCoursePage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const [scorm, setScorm] = useState<ScormState | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const key = `scorm-launch:${attemptId}`
    const stored = localStorage.getItem(key)
    if (!stored) {
      setMissing(true)
      return
    }
    setScorm(JSON.parse(stored))
    localStorage.removeItem(key) // tidy up the token once it's been used
  }, [attemptId])

  if (missing) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
        This course session has expired. Please close this tab and click
        "Start course" again.
      </div>
    )
  }

  if (!scorm) return null

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <ScormEmbed
        attemptId={scorm.attemptId}
        launchToken={scorm.launchToken}
        launchUrl={scorm.launchUrl}
        scormVersion={scorm.scormVersion}
        courseTitle={scorm.courseTitle}
        onClose={() => window.close()}
      />
    </div>
  )
}