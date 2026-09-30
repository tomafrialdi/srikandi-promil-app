import { useEffect, type ReactNode } from 'react'
import { startSmoothScroll } from '../../shared/lib/smooth-scroll'

/** Lenis smooth scrolling for the whole console. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => startSmoothScroll(), [])
  return <>{children}</>
}
