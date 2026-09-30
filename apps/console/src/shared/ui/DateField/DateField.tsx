import { CalendarBlank, Clock } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { Popover } from '../Popover'
import { Calendar } from './Calendar'
import { formatValue, pad, parseDate, todayIso } from './date-utils'

interface DateFieldProps {
  id?: string
  /** "YYYY-MM-DD", or "YYYY-MM-DDTHH:mm" with `withTime`. Empty string = no date. */
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  /** Also pick a time (24 h), like datetime-local. */
  withTime?: boolean
  /** Show a "Clear" action (set false for required fields). */
  clearable?: boolean
  disabled?: boolean
  placeholder?: string
  /** Calendar icon at the right instead of the left. */
  iconEnd?: boolean
  className?: string
  'aria-label'?: string
}

const DEFAULT_TIME = '09:00'

function TimeRow({ time, onChange }: { time: string; onChange: (time: string) => void }) {
  const [h, m] = time.split(':')
  const [draft, setDraft] = useState({ h: h ?? '09', m: m ?? '00' })
  const box = 'h-9 w-12 rounded-lg border border-border bg-card text-center text-13 font-bold outline-0 focus-visible:border-primary'
  const commit = (next: { h: string; m: string }) => {
    const hh = Math.min(23, Number(next.h) || 0)
    const mm = Math.min(59, Number(next.m) || 0)
    setDraft({ h: pad(hh), m: pad(mm) })
    onChange(`${pad(hh)}:${pad(mm)}`)
  }
  return (
    <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
      <Clock size={15} className="text-ink-muted" />
      <span className="text-12 font-bold text-ink-muted">Time</span>
      <span className="flex-1" />
      <input aria-label="Hour" inputMode="numeric" maxLength={2} className={box} value={draft.h} onChange={(e) => setDraft({ ...draft, h: e.target.value.replace(/\D/g, '') })} onFocus={(e) => e.target.select()} onBlur={() => commit(draft)} />
      <span className="font-bold">:</span>
      <input aria-label="Minute" inputMode="numeric" maxLength={2} className={box} value={draft.m} onChange={(e) => setDraft({ ...draft, m: e.target.value.replace(/\D/g, '') })} onFocus={(e) => e.target.select()} onBlur={() => commit(draft)} />
    </div>
  )
}

/** Date (and optional time) picker that replaces <input type="date|datetime-local"> with a styled calendar popover. */
export function DateField({ id, value, onChange, min, max, withTime, clearable = true, disabled, placeholder, iconEnd, className, 'aria-label': ariaLabel }: DateFieldProps) {
  const button = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState(DEFAULT_TIME)
  const date = value.slice(0, 10)
  const today = todayIso()
  const todayBlocked = Boolean((min && today < min.slice(0, 10)) || (max && today > max.slice(0, 10)))

  const emit = (iso: string, t = time) => onChange(withTime ? `${iso}T${t}` : iso)
  const show = () => {
    setTime(/T(\d{2}:\d{2})/.exec(value)?.[1] ?? DEFAULT_TIME)
    setOpen(true)
  }
  const finish = () => {
    setOpen(false)
    button.current?.focus()
  }
  const text = formatValue(value, Boolean(withTime))

  return (
    <>
      <button
        ref={button}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          'flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-control border border-border bg-card px-3.5 text-left text-13 font-semibold outline-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-55',
          open && 'border-primary',
          className,
        )}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault()
            show()
          }
        }}
      >
        {!iconEnd && <CalendarBlank size={16} className="flex-none text-ink-muted" />}
        <span className={cn('min-w-0 flex-1 truncate', !text && 'font-medium text-ink-faint')}>{text || placeholder || (withTime ? 'Pick date & time' : 'Pick a date')}</span>
        {iconEnd && <CalendarBlank size={15} className="flex-none text-ink-muted" />}
      </button>
      <Popover open={open} anchor={button} onClose={() => setOpen(false)} role="dialog" maxHeight={520}>
        <Calendar
          value={date}
          min={min}
          max={max}
          autoFocus
          onSelect={(iso) => {
            emit(iso)
            if (!withTime) finish()
          }}
        />
        {withTime && (
          <TimeRow
            time={time}
            onChange={(t) => {
              setTime(t)
              if (parseDate(date)) emit(date, t)
            }}
          />
        )}
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5">
          <button type="button" className="rounded-lg px-2.5 py-1.5 text-12 font-bold text-primary hover:bg-primary-soft disabled:opacity-40" disabled={todayBlocked} onClick={() => { emit(today); if (!withTime) finish() }}>
            Today
          </button>
          <span className="flex gap-1">
            {clearable && value && (
              <button type="button" className="rounded-lg px-2.5 py-1.5 text-12 font-bold text-ink-muted hover:bg-surface-alt" onClick={() => { onChange(''); finish() }}>
                Clear
              </button>
            )}
            {withTime && (
              <button type="button" className="rounded-lg bg-primary px-3 py-1.5 text-12 font-bold text-white" onClick={finish}>
                Done
              </button>
            )}
          </span>
        </div>
      </Popover>
    </>
  )
}
