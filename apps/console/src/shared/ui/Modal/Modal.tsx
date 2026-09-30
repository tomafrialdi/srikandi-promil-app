import { X } from '@phosphor-icons/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  /** Icon shown in the tinted tile at the left of the title. */
  icon?: ReactNode
  size?: ModalSize
  /** Optional strip under the header (e.g. wizard steps). */
  tabs?: ReactNode
  /** Sticky footer (use <ModalFooter>). */
  footer?: ReactNode
  /** Clicking the dimmed backdrop closes the modal (default true). */
  closeOnOverlay?: boolean
  children: ReactNode
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessible modal: portal, backdrop, Esc to close, focus trap, scroll lock, focus restore.
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
  footer,
  closeOnOverlay = true,
  children,
}: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
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
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (closeOnOverlay && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${styles[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <div className={styles.titles}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={16} weight="bold" />
          </button>
        </header>
        {tabs}
        <div className={styles.body}>{children}</div>
        {footer}
      </div>
    </div>,
    document.body,
  )
}

/** Uppercase label + stacked content, used to group a modal body. */
export function ModalSection({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      {label && <h3 className={styles.sectionLabel}>{label}</h3>}
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
    <footer className={styles.footer}>
      <div className={styles.info}>{info}</div>
      <div className={styles.actions}>{children}</div>
    </footer>
  )
}
