'use client'

import { useRouter } from 'next/navigation'
import { VidyardEmbed } from '@/components/content/VidyardEmbed'
import GateForm from './GateForm'
import { useGate } from './GateContext'

interface VideoRightColumnProps {
  accessTier: string
  contentId: string
  vidyardUrl?: string
  thumbnailAlt?: string
  onVideoEnd?: () => void
}

export function VideoRightColumn({
  accessTier,
  contentId,
  vidyardUrl,
  thumbnailAlt,
  onVideoEnd,
}: VideoRightColumnProps) {
  const router = useRouter()
  const { gated, markGated } = useGate()

  const showForm = accessTier === 'GATED' && !gated

  function handleGateSuccess() {
    markGated()
    router.refresh()
  }

  if (accessTier === 'PREMIUM') {
    return (
      <div className="flex items-start justify-center lg:justify-end">
        <div className="w-full max-w-[480px]">
          <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-diligent-gray-1">
            <div className="text-center">
              <span className="material-symbols-sharp text-[48px] text-diligent-gray-3">
                lock
              </span>
              <p className="mt-2 text-sm font-medium text-diligent-gray-4">
                Premium content
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="flex items-start justify-center lg:justify-end">
        <div className="w-full max-w-[480px]">
          <div className="overflow-hidden rounded-xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="p-8 sm:p-10">
              <GateForm
                contentType="VIDEO"
                contentId={contentId}
                onSuccess={handleGateSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Free or gated-and-passed — show the player
  if (!vidyardUrl) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-diligent-gray-1 text-diligent-gray-4">
        <span className="material-symbols-sharp text-[48px]">videocam_off</span>
      </div>
    )
  }

  return (
    <VidyardEmbed
      vidyardUrl={vidyardUrl}
      thumbnailAlt={thumbnailAlt}
      onVideoEnd={onVideoEnd}
    />
  )
}
