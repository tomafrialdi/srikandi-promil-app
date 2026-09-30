import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface TooltipRow {
  label: string
  value: string
  color?: string
}

interface TooltipBodyProps {
  title?: string
  rows?: TooltipRow[]
}

/** The dark bubble used by charts: bold title + rows with an optional colour dot. */
export function TooltipBody({ title, rows = [] }: TooltipBodyProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-ink px-2.5 py-1.5 text-11 leading-tight font-semibold whitespace-nowrap text-white shadow-tooltip">
      {title && <span className="font-bold">{title}</span>}
      {rows.map((row) => (
        <span key={`${row.label}-${row.value}`} className="flex items-center gap-1.5 font-medium text-white/85">
          {row.color && <span className="size-2 flex-none rounded-full" style={{ background: row.color }} />}
          {row.label && <span>{row.label}</span>}
          <span className="ml-auto pl-3 font-bold text-white">{row.value}</span>
        </span>
      ))}
    </div>
  )
}

interface TooltipProps {
  /** Bubble content. */
  content: ReactNode
  /** Where the bubble sits relative to the trigger box. */
  placement?: 'top' | 'bottom'
  /** Horizontal anchor: centered, or flush to an edge (keeps the bubble inside a container). */
  align?: 'center' | 'start' | 'end'
  /** Extra inline style for the positioned bubble wrapper (e.g. a custom `bottom`). */
  style?: CSSProperties
  className?: string
  children: ReactNode
}

/**
 * Hover / focus tooltip without JS positioning: wrap the trigger, the bubble is absolutely positioned.
 * The wrapper is `relative group`; children stay in normal flow.
 */
export function Tooltip({ content, placement = 'top', align = 'center', style, className, children }: TooltipProps) {
  return (
    <span className={cn('group relative', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-30 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none',
          placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          align === 'center' && 'left-1/2 -translate-x-1/2',
          align === 'start' && 'left-0',
          align === 'end' && 'right-0',
        )}
        style={style}
      >
        {content}
      </span>
    </span>
  )
}
