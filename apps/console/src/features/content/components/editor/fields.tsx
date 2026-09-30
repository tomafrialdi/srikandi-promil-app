import type { ReactNode } from 'react'
import { cn } from '../../../../shared/lib/cn'

export { ChipToggleGroup } from '../../../../shared/ui/ChipToggleGroup'

/** Small section card used across the editor. */
export function EditorCard({ title, badge, children, className }: { title?: string; badge?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-3.5 rounded-card border border-border bg-card p-5', className)}>
      {title && (
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-15 font-bold">{title}</h2>
          {badge}
        </header>
      )}
      {children}
    </section>
  )
}

export const INPUT = 'h-11 w-full rounded-control border border-border bg-card px-3.5 text-13 font-semibold outline-0 placeholder:text-ink-faint focus-visible:border-primary'

/** Phone frame with the "Good morning" header; children render inside the screen. */
export function PhonePreview({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex w-56 flex-none flex-col items-center gap-2">
      <div className="flex w-full flex-col gap-3 rounded-[28px] border-[6px] border-ink bg-surface p-3.5 shadow-tooltip">
        <span className="text-11 font-bold text-ink-muted">Good morning, Amara</span>
        <div className="flex h-14 items-center justify-center rounded-xl bg-primary-soft text-11 font-bold text-primary">Cycle day 12 · Fertile</div>
        {children}
      </div>
      <span className="text-11 font-semibold text-ink-faint">{caption}</span>
    </div>
  )
}
