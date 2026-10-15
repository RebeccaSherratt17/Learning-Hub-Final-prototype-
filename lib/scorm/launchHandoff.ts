// Browser-side hand-off between the course page and the SCORM player tab.
//
// The course page stores the launch details in localStorage and opens
// /play/[attemptId] in a new tab. The player reads (and removes) them, and
// when the course finishes it broadcasts a completion message so the course
// page can show its "Course completed" state.

export interface ScormLaunchData {
  attemptId: string
  courseId: string
  launchToken: string
  launchUrl: string
  scormVersion: '1.2' | '2004'
  courseTitle: string
}

interface CompletionMessage {
  type: 'scorm-completed'
  courseId: string
  attemptId: string
}

const CHANNEL_NAME = 'hub-scorm'

function storageKey(attemptId: string): string {
  return `scorm-launch:${attemptId}`
}

export function storeLaunchData(data: ScormLaunchData): void {
  localStorage.setItem(storageKey(data.attemptId), JSON.stringify(data))
}

/** Read and remove the launch details so the token isn't left behind. */
export function takeLaunchData(attemptId: string): ScormLaunchData | null {
  const key = storageKey(attemptId)
  const stored = localStorage.getItem(key)
  if (!stored) return null
  localStorage.removeItem(key)
  try {
    return JSON.parse(stored) as ScormLaunchData
  } catch {
    return null
  }
}

/** Tell any open course page that this attempt has been completed. */
export function broadcastCompletion(courseId: string, attemptId: string): void {
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(CHANNEL_NAME)
  const message: CompletionMessage = { type: 'scorm-completed', courseId, attemptId }
  channel.postMessage(message)
  channel.close()
}

/** Listen for completions of a course. Returns an unsubscribe function. */
export function onCourseCompleted(courseId: string, callback: () => void): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {}
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.onmessage = (event: MessageEvent<CompletionMessage>) => {
    if (event.data?.type === 'scorm-completed' && event.data.courseId === courseId) callback()
  }
  return () => channel.close()
}
