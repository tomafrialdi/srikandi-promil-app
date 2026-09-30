import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface RadioCardProps {
  selected: boolean
  onSelect: () => void
  title: ReactNode
  description?: ReactNode
  /** Small chip after the title (e.g. "Recommended", "2 approvals"). */
  badge?: ReactNode
  disabled?: boolean
  name: string
  /** Put the radio dot before the text instead of after it. */
  leading?: boolean
}

/** A selectable card with a radio dot; use inside a group with the same `name`. */
export function RadioCard({ selected, onSelect, title, description, badge, disabled, name, leading }: RadioCardProps) {
  return (
    <label
      className={cn(
        'relative flex items-center gap-3 rounded-xl border px-3.5 py-3',
        !leading && 'justify-between',
        leading && 'flex-row-reverse justify-end',
        selected ? 'border-primary bg-primary-soft' : 'border-border bg-card',
        disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer',
      )}
    >
      <input type="radio" className="peer absolute inset-0 m-0 cursor-[inherit] opacity-0" name={name} checked={selected} disabled={disabled} onChange={onSelect} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className={cn('text-13 font-bold', leading && selected && 'text-primary')}>{title}</span>
          {badge}
        </span>
        {description && <span className={cn('text-ink-muted', leading ? 'text-12 font-medium' : 'text-11')}>{description}</span>}
      </span>
      <span
        className={cn(
          'size-[18px] shrink-0 rounded-full bg-card peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
          selected ? 'border-[5px] border-primary' : 'border-[1.5px] border-border',
        )}
        aria-hidden="true"
      />
    </label>
  )
}
