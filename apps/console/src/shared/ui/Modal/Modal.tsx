import { X } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { pauseSmoothScroll, resumeSmoothScroll } from '../../lib/smooth-scroll'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  /** Icon shown in the tinted tile at the left of the title. */
  icon?: ReactNode
  size?: ModalSize
  /** Buttons shown in the header, left of the close button. */
  headerActions?: ReactNode
  /** Optional strip under the header (e.g. wizard steps). */
  tabs?: ReactNode
  /** Vertical nav shown at the left of the body (e.g. settings sections). */
  sidebar?: ReactNode
  /** Sticky footer (use <ModalFooter>). */
  footer?: ReactNode
  /** Clicking the dimmed backdrop closes the modal (default true). */
  closeOnOverlay?: boolean
  children: ReactNode
}

/** Must match the duration-* classes below. */
const EXIT_MS = 200

const SIZE: Record<ModalSize, string> = { sm: 'max-w-120', md: 'max-w-190', lg: 'max-w-205', xl: 'max-w-220' }

let stack: symbol[] = []

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessible modal: portal, backdrop, fade + scale transition, Esc to close, focus trap, scroll lock,
 * focus restore, stacked dialogs (only the top one reacts to Esc / Tab). Stays mounted while it animates out.
 * Compose the body with <ModalSection>, the footer with <ModalFooter>.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  tabs,
  sidebar,
  footer,
  headerActions,
  closeOnOverlay = true,
  children,
}: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const [mounted, setMounted] = useState(open)

  // Mount immediately when opening; unmount only after the exit transition finished.
  if (open && !mounted) setMounted(true)
  useEffect(() => {
    if (open || !mounted) return
    const id = window.setTimeout(() => setMounted(false), EXIT_MS)
    return () => window.clearTimeout(id)
  }, [open, mounted])

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const id = Symbol('modal')
    stack = [...stack, id]
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    pauseSmoothScroll()
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0)

    const onKeyDown = (event: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const first = items[0]!
      const last = items[items.length - 1]!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
      stack = stack.filter((item) => item !== id)
      document.body.style.overflow = previousOverflow
      if (stack.length === 0) resumeSmoothScroll()
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!mounted) return null

  const closing = !open || undefined

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-ink/45 px-4 py-6 transition-opacity duration-200 ease-out starting:opacity-0 data-closing:opacity-0 motion-reduce:transition-none"
      data-modal-overlay
      data-closing={closing}
      onMouseDown={(event) => {
        if (closeOnOverlay && open && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={cn(
          'flex max-h-[calc(100vh-48px)] w-full flex-col overflow-hidden rounded-[20px] bg-card shadow-modal outline-0',
          'transition-[opacity,transform] duration-200 ease-out starting:translate-y-3 starting:scale-[0.97] starting:opacity-0',
          'data-closing:translate-y-2 data-closing:scale-[0.98] data-closing:opacity-0 motion-reduce:transition-none',
          SIZE[size],
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-modal-dialog
        data-closing={closing}
      >
        <header className="flex items-center gap-3.5 border-b border-border px-6 py-5" data-no-print>
          {icon && <span className="inline-flex size-10 flex-none items-center justify-center rounded-xl bg-primary-soft text-primary">{icon}</span>}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-18 font-extrabold">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-12 text-ink-muted">{subtitle}</p>}
          </div>
          {headerActions}
          <button type="button" className="inline-flex size-8 flex-none items-center justify-center rounded-full bg-surface-alt text-ink-muted hover:text-ink" onClick={onClose} aria-label="Close">
            <X size={16} weight="bold" />
          </button>
        </header>
        {tabs}
        {sidebar ? (
          <div className="flex min-h-0 flex-1 flex-col min-[701px]:h-[560px] min-[701px]:flex-none min-[701px]:flex-row">
            {sidebar}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5" data-lenis-prevent>
              {children}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5" data-lenis-prevent>
            {children}
          </div>
        )}
        {footer}
      </div>
    </div>,
    document.body,
  )
}

/** Uppercase label + stacked content, used to group a modal body. */
export function ModalSection({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      {label && <h3 className="text-11 font-bold tracking-[0.02em] text-ink-faint uppercase">{label}</h3>}
      {children}
    </section>
  )
}

interface ModalFooterProps {
  /** Muted text at the left (step counter, audit note, hint). */
  info?: ReactNode
  /** Buttons at the right. */
  children?: ReactNode
}

export function ModalFooter({ info, children }: ModalFooterProps) {
  return (
    <footer className="flex items-center justify-between gap-3 border-t border-border bg-surface px-6 py-3.5" data-no-print>
      <div className="min-w-0 text-12 text-ink-muted">{info}</div>
      <div className="flex flex-none items-center gap-2.5">{children}</div>
    </footer>
  )
}
