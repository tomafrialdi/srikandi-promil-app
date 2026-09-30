import { Clock } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { Popover } from '../Popover'
import { TimeColumns } from './TimeColumns'

const TRIGGER =
  'flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-control border border-border bg-card px-3.5 text-left text-13 font-semibold outline-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-55'

interface CommonProps {
  id?: string
  disabled?: boolean
  /** Minute step of the picker (default 5). */
  step?: number
  className?: string
  'aria-label'?: string
}

interface TimeFieldProps extends CommonProps {
  /** "HH:mm" (24 h), empty = not set. */
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/** Single time picker that replaces <input type="time">: a field that opens hour + minute columns. */
export function TimeField({ id, value, onChange, step, disabled, placeholder = 'Pick a time', className, 'aria-label': ariaLabel }: TimeFieldProps) {
  const button = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <button ref={button} id={id} type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={ariaLabel} disabled={disabled} className={cn(TRIGGER, open && 'border-primary', className)} onClick={() => setOpen((o) => !o)}>
        <span className={cn('min-w-0 flex-1 truncate', !value && 'font-medium text-ink-faint')}>{value || placeholder}</span>
        <Clock size={15} className="flex-none text-ink-muted" />
      </button>
      <Popover open={open} anchor={button} onClose={() => setOpen(false)} role="dialog">
        <div className="flex flex-col gap-2 p-3">
          <TimeColumns value={value || '09:00'} step={step} label={ariaLabel ?? 'Time'} onChange={onChange} />
          <button type="button" className="rounded-lg bg-primary px-3 py-1.5 text-12 font-bold text-white" onClick={() => { if (!value) onChange('09:00'); setOpen(false); button.current?.focus() }}>
            Done
          </button>
        </div>
      </Popover>
    </>
  )
}

export interface TimeRange {
  start: string
  end: string
}

interface TimeRangeFieldProps extends CommonProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

/** "09:00 – 13:00" field: one trigger, two pickers (from / to) in the popover. */
export function TimeRangeField({ id, value, onChange, step, disabled, className, 'aria-label': ariaLabel }: TimeRangeFieldProps) {
  const button = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const invalid = value.start >= value.end
  return (
    <>
      <button ref={button} id={id} type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={ariaLabel} aria-invalid={invalid || undefined} disabled={disabled} className={cn(TRIGGER, open && 'border-primary', invalid && 'border-error', className)} onClick={() => setOpen((o) => !o)}>
        <span className="min-w-0 flex-1 truncate">{value.start} – {value.end}</span>
        <Clock size={15} className="flex-none text-ink-muted" />
      </button>
      <Popover open={open} anchor={button} onClose={() => setOpen(false)} role="dialog">
        <div className="flex flex-col gap-2.5 p-3">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-11 font-bold text-ink-faint uppercase">From</span>
              <TimeColumns value={value.start} step={step} label="From" onChange={(start) => onChange({ start, end: value.end })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-11 font-bold text-ink-faint uppercase">To</span>
              <TimeColumns value={value.end} step={step} label="To" onChange={(end) => onChange({ start: value.start, end })} />
            </div>
          </div>
          {invalid && <p className="m-0 text-11 font-semibold text-error">The end time must be after the start.</p>}
          <button type="button" className="rounded-lg bg-primary px-3 py-1.5 text-12 font-bold text-white" onClick={() => { setOpen(false); button.current?.focus() }}>
            Done
          </button>
        </div>
      </Popover>
    </>
  )
}
