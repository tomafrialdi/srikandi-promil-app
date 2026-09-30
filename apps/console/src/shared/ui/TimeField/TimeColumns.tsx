import { useEffect, useRef, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'

const pad = (n: number) => String(n).padStart(2, '0')

interface ColumnProps {
  label: string
  options: number[]
  value: number
  onChange: (value: number) => void
}

/** One scrollable list (hours or minutes). Arrow keys change the value, Home/End jump to the ends. */
function Column({ label, options, value, onChange }: ColumnProps) {
  const list = useRef<HTMLUListElement>(null)
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' })
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const i = Math.max(0, options.indexOf(value))
    const to = event.key === 'ArrowDown' ? i + 1 : event.key === 'ArrowUp' ? i - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : null
    if (to == null) return
    event.preventDefault()
    const next = options[Math.max(0, Math.min(options.length - 1, to))]!
    onChange(next)
    requestAnimationFrame(() => list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }))
  }

  return (
    <ul ref={list} role="listbox" aria-label={label} tabIndex={0} onKeyDown={onKeyDown} className="m-0 flex h-44 w-16 list-none flex-col gap-px overflow-y-auto rounded-lg p-0 outline-0 focus-visible:ring-2 focus-visible:ring-primary/40" data-lenis-prevent>
      {options.map((n) => (
        <li
          key={n}
          role="option"
          aria-selected={n === value}
          className={cn('flex h-8 flex-none cursor-pointer items-center justify-center rounded-md text-13 font-semibold hover:bg-surface-alt', n === value && 'bg-primary font-extrabold text-white hover:bg-primary')}
          onClick={() => onChange(n)}
        >
          {pad(n)}
        </li>
      ))}
    </ul>
  )
}

interface TimeColumnsProps {
  /** "HH:mm" */
  value: string
  onChange: (value: string) => void
  /** Minute step (5 → 00, 05, 10 …). A value off the grid stays selectable. */
  step?: number
  label?: string
}

const HOURS = Array.from({ length: 24 }, (_, h) => h)

/** Hour + minute pickers side by side; the building block of TimeField and TimeRangeField. */
export function TimeColumns({ value, onChange, step = 5, label = 'Time' }: TimeColumnsProps) {
  const [h, m] = value.split(':').map((x) => Number(x) || 0) as [number, number]
  const minutes = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step)
  if (!minutes.includes(m)) minutes.push(m)
  minutes.sort((a, b) => a - b)
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <Column label={`${label} hour`} options={HOURS} value={h} onChange={(nh) => onChange(`${pad(nh)}:${pad(m)}`)} />
      <span className="text-14 font-bold text-ink-faint">:</span>
      <Column label={`${label} minute`} options={minutes} value={m} onChange={(nm) => onChange(`${pad(h)}:${pad(nm)}`)} />
    </div>
  )
}
