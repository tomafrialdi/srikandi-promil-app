import Lenis from 'lenis'

let instance: Lenis | null = null

/** Starts Lenis smooth scrolling (skipped for users who prefer reduced motion). Returns a cleanup function. */
export function startSmoothScroll(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined
  instance = new Lenis({ autoRaf: true, lerp: 0.1, wheelMultiplier: 1 })
  return () => {
    instance?.destroy()
    instance = null
  }
}

/** Modals call these so the page behind does not scroll. Inner scrollers use `data-lenis-prevent`. */
export const pauseSmoothScroll = () => instance?.stop()
export const resumeSmoothScroll = () => instance?.start()
