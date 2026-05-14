'use client'

import { useGate } from './GateContext'

interface TemplateDownloadSectionProps {
  accessTier: string
  fileUrl?: string
}

export function TemplateDownloadSection({ accessTier, fileUrl }: TemplateDownloadSectionProps) {
  const { gated } = useGate()

  if (accessTier === 'FREE' || gated) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <a
          href={fileUrl ?? '#'}
          download
          className="inline-flex items-center gap-2 rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
        >
          <span className="material-symbols-sharp text-[20px]">download</span>
          Download template
        </a>
      </div>
    )
  }

  if (accessTier === 'GATED') {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-diligent-gray-4">
        <span className="material-symbols-sharp text-[16px]">lock</span>
        <span>Complete the form to download this template</span>
      </div>
    )
  }

  // PREMIUM tier
  return (
    <div className="rounded-lg border border-diligent-gray-2 bg-diligent-gray-1 p-6 sm:p-8">
      <h2 className="text-lg font-bold text-diligent-gray-5">Premium content</h2>
      <p className="mt-2 text-sm text-diligent-gray-4">
        This template requires a Diligent One Platform subscription. Get unlimited access
        to our full Education &amp; Templates Library.
      </p>
      <a
        href="#"
        className="mt-4 inline-flex items-center rounded-lg bg-diligent-red px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-diligent-red-2"
      >
        Request a demo
      </a>
    </div>
  )
}
