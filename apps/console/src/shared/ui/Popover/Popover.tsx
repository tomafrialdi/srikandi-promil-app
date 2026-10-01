import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

interface PopoverProps {
  open: boolean
  anchor: RefObject<HTMLElement | null>
  /** Called for outside clicks, Escape, Tab and scrolling the page. */
  onClose: () => void
  children: ReactNode
  className?: string
  /** Never narrower than the anchor (dropdowns). */
  matchWidth?: boolean
  /** Upper bound for the height in px; the popover scrolls beyond it. */
  maxHeight?: number
  role?: string
  id?: string
}

const GAP = 6
const EDGE = 8

/**
 * Floating panel anchored to an element: portal, flips above when there is no room below,
 * closes on outside press / Escape / Tab / page scroll. Escape is swallowed so a modal behind it stays open.
 */
export function Popover({ open, anchor, onClose, children, className, matchWidth, maxHeight = 320, role, id }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useLayoutEffect(() => {
    const el = ref.current
    const a = anchor.current
    if (!open || !el || !a) return
    const r = a.getBoundingClientRect()
    el.style.minWidth = matchWidth ? `${r.width}px` : ''
    el.style.maxHeight = ''
    const height = Math.min(el.offsetHeight, maxHeight)
    const below = window.innerHeight - r.bottom - GAP - EDGE
    const above = r.top - GAP - EDGE
    const flip = height > below && above > below
    el.style.maxHeight = `${Math.min(maxHeight, Math.max(120, flip ? above : below))}px`
    el.style.left = `${Math.max(EDGE, Math.min(r.left, window.innerWidth - el.offsetWidth - EDGE))}px`
    // `auto`, not '': the class `top-0` would come back and stretch the panel from the top of the screen.
    el.style.top = flip ? 'auto' : `${r.bottom + GAP}px`
    el.style.bottom = flip ? `${window.innerHeight - r.top + GAP}px` : 'auto'
  }, [open, anchor, matchWidth, maxHeight])

  useEffect(() => {
    if (!open) return
    const close = () => onCloseRef.current()
    const inside = (target: EventTarget | null) => target instanceof Node && (ref.current?.contains(target) || anchor.current?.contains(target))
    const onPointer = (event: PointerEvent) => {
      if (!inside(event.target)) close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Tab') return
      if (event.key === 'Escape') event.stopPropagation()
      anchor.current?.focus()
      close()
    }
    const onScroll = (event: Event) => {
      if (!(event.target instanceof Node && ref.current?.contains(event.target))) close()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [open, anchor])

  if (!open) return null
  return createPortal(
    <div
      ref={ref}
      id={id}
      role={role}
      className={cn(
        'fixed top-0 left-0 z-110 overflow-y-auto rounded-xl border border-border bg-card shadow-menu',
        'transition-[opacity,transform] duration-150 ease-out starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none',
        className,
      )}
      data-lenis-prevent
    >
      {children}
    </div>,
    document.body,
  )
}
