import { DotsThree } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

export interface ActionMenuItem {
  key: string
  label: string
  icon?: ReactNode
  tone?: 'danger'
  disabled?: boolean
  onSelect: () => void
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  /** Accessible name of the trigger, e.g. "Actions for Nadia". */
  label: string
}

const MENU_WIDTH = 190

/** "…" button with a popover list. Rendered in a portal so table overflow never clips it. */
export function ActionMenu({ items, label }: ActionMenuProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const button = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLUListElement>(null)
  const open = pos !== null

  useEffect(() => {
    if (!open) return
    const close = () => setPos(null)
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (!menu.current?.contains(target) && !button.current?.contains(target)) close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
        button.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const toggle = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (open) return setPos(null)
    const rect = button.current?.getBoundingClientRect()
    if (!rect) return
    const height = items.length * 38 + 12
    const below = rect.bottom + 6 + height <= window.innerHeight
    setPos({ top: below ? rect.bottom + 6 : Math.max(8, rect.top - 6 - height), left: Math.max(8, rect.right - MENU_WIDTH) })
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt hover:text-ink"
        onClick={toggle}
      >
        <DotsThree size={18} weight="bold" />
      </button>
      {pos &&
        createPortal(
          <ul
            ref={menu}
            role="menu"
            className="fixed z-110 m-0 list-none rounded-xl border border-border bg-card p-1.5 shadow-menu"
            style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
            onClick={(event) => event.stopPropagation()}
          >
            {items.map((item) => (
              <li key={item.key} role="none">
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] text-left text-13 font-semibold hover:bg-surface disabled:opacity-45',
                    item.tone === 'danger' && 'text-error',
                  )}
                  onClick={() => {
                    setPos(null)
                    item.onSelect()
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  )
}
