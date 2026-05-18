'use client'

import { useEffect, useRef, useCallback } from 'react'

interface VidyardEmbedProps {
  /** Vidyard share URL (e.g. https://share.vidyard.com/watch/abc123) or bare UUID */
  vidyardUrl: string
  /** Alt text for the poster image / accessibility */
  thumbnailAlt?: string
  /** Fires when the Vidyard player signals the video has ended */
  onVideoEnd?: () => void
}

/**
 * Extract the Vidyard video UUID from a share URL or bare UUID string.
 *
 * Accepted formats:
 *  - https://share.vidyard.com/watch/abc123
 *  - https://play.vidyard.com/abc123
 *  - abc123 (bare UUID)
 */
function extractUuid(input: string): string {
  const trimmed = input.trim()

  // share.vidyard.com/watch/{uuid}
  const shareMatch = trimmed.match(
    /share\.vidyard\.com\/watch\/([a-zA-Z0-9]+)/,
  )
  if (shareMatch) return shareMatch[1]

  // play.vidyard.com/{uuid}
  const playMatch = trimmed.match(/play\.vidyard\.com\/([a-zA-Z0-9]+)/)
  if (playMatch) return playMatch[1]

  // Bare UUID — alphanumeric string
  const bareMatch = trimmed.match(/^[a-zA-Z0-9]+$/)
  if (bareMatch) return trimmed

  return trimmed
}

export function VidyardEmbed({
  vidyardUrl,
  thumbnailAlt = 'Video',
  onVideoEnd,
}: VidyardEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<VidyardPlayer | null>(null)
  const onVideoEndRef = useRef(onVideoEnd)

  // Keep callback ref current without triggering re-renders
  useEffect(() => {
    onVideoEndRef.current = onVideoEnd
  }, [onVideoEnd])

  const uuid = extractUuid(vidyardUrl)

  const handleComplete = useCallback(() => {
    onVideoEndRef.current?.()
  }, [])

  useEffect(() => {
    if (!uuid || !containerRef.current) return

    let destroyed = false

    async function initPlayer() {
      // Dynamic import — only loaded client-side
      const vidyardEmbed = (await import('@vidyard/embed-code')).default

      if (destroyed || !containerRef.current) return

      try {
        const player = await vidyardEmbed.api.renderPlayer({
          uuid,
          container: containerRef.current,
          type: 'inline',
        })

        if (destroyed) {
          vidyardEmbed.api.destroyPlayer(player)
          return
        }

        playerRef.current = player
        player.on('playerComplete', handleComplete)
      } catch (err) {
        console.error('[VidyardEmbed] Failed to render player:', err)
      }
    }

    initPlayer()

    return () => {
      destroyed = true
      if (playerRef.current) {
        playerRef.current.off('playerComplete', handleComplete)
        import('@vidyard/embed-code').then((mod) => {
          if (playerRef.current) {
            try {
              mod.default.api.destroyPlayer(playerRef.current)
            } catch {
              // Player may already be cleaned up
            }
            playerRef.current = null
          }
        })
      }
    }
  }, [uuid, handleComplete])

  if (!uuid) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-diligent-gray-1 text-diligent-gray-4">
        <span className="material-symbols-sharp text-[48px]">
          videocam_off
        </span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="aspect-video w-full overflow-hidden rounded-lg [&_iframe]:!h-full [&_iframe]:!w-full"
      role="region"
      aria-label={thumbnailAlt}
    />
  )
}
