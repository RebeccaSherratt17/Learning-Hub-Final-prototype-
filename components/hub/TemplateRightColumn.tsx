'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import GateForm from './GateForm'
import { useGate } from './GateContext'

interface TemplateRightColumnProps {
  accessTier: string
  contentId: string
  downloadUrl?: string
  fromLearningPath?: string
}

export function TemplateRightColumn({
  accessTier,
  contentId,
  downloadUrl,
  fromLearningPath,
}: TemplateRightColumnProps) {
  const router = useRouter()
  const { gated, markGated } = useGate()

  const showForm = accessTier === 'GATED' && !gated

  function handleGateSuccess() {
    markGated()
    router.refresh()
  }

  return (
    <div className="flex items-start justify-center lg:justify-end">
      <div className="relative w-full max-w-[480px]">
        {showForm ? (
          <div className="overflow-hidden rounded-xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="p-8 sm:p-10">
              <GateForm
                contentType="TEMPLATE"
                contentId={contentId}
                downloadUrl={downloadUrl}
                fromLearningPath={fromLearningPath}
                onSuccess={handleGateSuccess}
              />
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="relative aspect-[3/4] w-full bg-diligent-gray-1">
              <Image
                src="/template-placeholder.png.png"
                alt="Template document"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 420px"
                priority
              />
            </div>
            <div
              className="absolute bottom-0 right-0 h-16 w-16"
              aria-hidden="true"
            >
              <div
                className="absolute bottom-0 right-0 h-full w-full bg-diligent-red"
                style={{ clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
