'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface GateContextValue {
  gated: boolean
  markGated: () => void
}

const GateContext = createContext<GateContextValue>({
  gated: false,
  markGated: () => {},
})

export function GateProvider({
  initialGated,
  children,
}: {
  initialGated: boolean
  children: ReactNode
}) {
  const [gated, setGated] = useState(initialGated)
  return (
    <GateContext.Provider value={{ gated, markGated: () => setGated(true) }}>
      {children}
    </GateContext.Provider>
  )
}

export function useGate() {
  return useContext(GateContext)
}
