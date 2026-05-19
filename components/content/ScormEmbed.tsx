'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Scorm12API, Scorm2004API } from 'scorm-again'

type ScormAPI = Scorm12API | Scorm2004API

interface ScormEmbedProps {
  launchUrl: string
  scormVersion: '1.2' | '2004'
  attemptId: string
  launchToken: string
  courseTitle: string
  onClose: () => void
  onComplete?: () => void
}

export default function ScormEmbed({
  launchUrl,
  scormVersion,
  attemptId,
  launchToken,
  courseTitle,
  onClose,
  onComplete,
}: ScormEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const apiRef = useRef<ScormAPI | null>(null)

  const sendTracking = useCallback(
    async (cmi: Record<string, unknown>) => {
      try {
        await fetch(`/api/scorm/tracking/${attemptId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ launchToken, cmi }),
        })
      } catch (error) {
        console.error('Failed to send SCORM tracking data:', error)
      }
    },
    [attemptId, launchToken]
  )

  useEffect(() => {
    let cancelled = false

    async function initScormApi() {
      if (scormVersion === '2004') {
        const { Scorm2004API } = await import('scorm-again')
        if (cancelled) return

        const api = new Scorm2004API({})

        api.on('Terminate', () => {
          const cmi = api.renderCMIToJSONObject()
          sendTracking(cmi)

          const completionStatus = api.getCMIValue('cmi.completion_status')
          const successStatus = api.getCMIValue('cmi.success_status')
          if (completionStatus === 'completed' || successStatus === 'passed') {
            onComplete?.()
          }
        })

        api.on('Commit', () => {
          const cmi = api.renderCMIToJSONObject()
          sendTracking(cmi)
        })

        ;(window as unknown as Record<string, unknown>)['API_1484_11'] = api
        apiRef.current = api
      } else {
        const { Scorm12API } = await import('scorm-again')
        if (cancelled) return

        const api = new Scorm12API({})

        api.on('LMSFinish', () => {
          const cmi = api.renderCMIToJSONObject()
          sendTracking(cmi)

          const lessonStatus = api.getCMIValue('cmi.core.lesson_status')
          if (lessonStatus === 'completed' || lessonStatus === 'passed') {
            onComplete?.()
          }
        })

        api.on('LMSCommit', () => {
          const cmi = api.renderCMIToJSONObject()
          sendTracking(cmi)
        })

        ;(window as unknown as Record<string, unknown>)['API'] = api
        apiRef.current = api
      }

      // CRITICAL: setReady(true) comes AFTER the API is set on window.
      // The iframe must not load until window.API / window.API_1484_11 exists,
      // otherwise the SCORM content will run in standalone mode with no LMS connection.
      setReady(true)
    }

    initScormApi()

    return () => {
      cancelled = true
      if (scormVersion === '2004') {
        delete (window as unknown as Record<string, unknown>)['API_1484_11']
      } else {
        delete (window as unknown as Record<string, unknown>)['API']
      }
    }
  }, [scormVersion, sendTracking, onComplete])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // Send final tracking data before closing
        if (apiRef.current) {
          const cmi = apiRef.current.renderCMIToJSONObject()
          sendTracking(cmi)
        }
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, sendTracking])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label={`Course: ${courseTitle}`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-diligent-gray-2 bg-diligent-gray-5 px-4 py-2">
        <span className="text-sm font-medium text-white truncate max-w-[70%]">
          {courseTitle}
        </span>
        <button
          onClick={() => {
            // Send final tracking data before closing
            if (apiRef.current) {
              const cmi = apiRef.current.renderCMIToJSONObject()
              sendTracking(cmi)
            }
            onClose()
          }}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          aria-label="Exit course"
        >
          <span className="material-symbols-sharp text-[18px]">close</span>
          Exit
        </button>
      </div>

      {/* iframe area */}
      <div className="flex-1 relative">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-diligent-gray-1">
            <p className="text-sm text-diligent-gray-4">Loading course...</p>
          </div>
        )}
        {ready && (
          <iframe
            ref={iframeRef}
            src={launchUrl}
            title={courseTitle}
            className="h-full w-full border-0"
            allow="autoplay; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>
    </div>
  )
}
