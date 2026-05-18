'use client'

import { useGate } from './GateContext'

interface GatedPromptProps {
  label: string
}

/** Shows a lock icon + message when the user has not yet passed the gate. */
export function GatedPrompt({ label }: GatedPromptProps) {
  const { gated } = useGate()

  if (gated) return null

  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-diligent-gray-4">
      <span className="material-symbols-sharp text-[16px]">lock</span>
      <span>{label}</span>
    </div>
  )
}
