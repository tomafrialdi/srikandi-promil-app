import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label: string
}

/** Accessible on/off switch. */
export function Toggle({ checked, onChange, disabled, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={cn('relative h-[22px] w-10 flex-none rounded-full transition-colors disabled:opacity-55', checked ? 'bg-primary' : 'bg-border')}
      onClick={() => onChange(!checked)}
    >
      <span className={cn('absolute top-0.5 left-0.5 size-[18px] rounded-full bg-white transition-transform', checked && 'translate-x-[18px]')} />
    </button>
  )
}

interface ToggleRowProps extends ToggleProps {
  title: ReactNode
  description?: ReactNode
}

/** Title + description at the left, switch at the right. */
export function ToggleRow({ title, description, ...toggle }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-13 font-bold">{title}</span>
        {description && <span className="text-11 leading-snug text-ink-muted">{description}</span>}
      </div>
      <Toggle {...toggle} />
    </div>
  )
}

const BOX = 'inline-flex size-[18px] flex-none items-center justify-center rounded-[5px] border text-12 font-extrabold text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary'

interface CheckRowProps {
  checked: boolean
  onChange: (checked: boolean) => void
  title: ReactNode
  description?: ReactNode
}

/** Checkbox with title + description. */
export function CheckRow({ checked, onChange, title, description }: CheckRowProps) {
  return (
    <label className="relative flex cursor-pointer items-start gap-2.5">
      <input type="checkbox" className="peer absolute m-0 size-[18px] opacity-0" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={cn(BOX, 'mt-px', checked ? 'border-primary bg-primary' : 'border-border bg-card')} aria-hidden="true">
        {checked && '✓'}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-13 font-bold">{title}</span>
        {description && <span className="text-11 leading-snug text-ink-muted">{description}</span>}
      </span>
    </label>
  )
}

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  indeterminate?: boolean
}

/** Bare 18px checkbox (table rows, select-all). */
export function Checkbox({ checked, onChange, label, indeterminate }: CheckboxProps) {
  return (
    <label className="relative inline-flex" onClick={(event) => event.stopPropagation()}>
      <input type="checkbox" className="peer absolute m-0 size-[18px] opacity-0" aria-label={label} checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className={cn(BOX, checked || indeterminate ? 'border-primary bg-primary' : 'border-border bg-card')} aria-hidden="true">
        {indeterminate ? '–' : checked && '✓'}
      </span>
    </label>
  )
}
