import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { MONTHS, WEEKDAYS, addDays, addMonths, daysInMonth, parseDate, toIso, todayIso, weekdayIndex } from './date-utils'

interface CalendarProps {
  /** "YYYY-MM-DD" (a time suffix is ignored). */
  value: string
  min?: string
  max?: string
  onSelect: (iso: string) => void
  /** Move keyboard focus onto the selected (or today's) day right away. */
  autoFocus?: boolean
}

const NAV = 'inline-flex size-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt hover:text-ink disabled:opacity-35'

/** Month grid (Monday first) with month / year picker, min-max limits and full keyboard support. */
export function Calendar({ value, min, max, onSelect, autoFocus }: CalendarProps) {
  const today = todayIso()
  const start = parseDate(value) ?? parseDate(today)!
  const [view, setView] = useState({ y: start.y, m: start.m })
  const [mode, setMode] = useState<'days' | 'months'>('days')
  const [focus, setFocus] = useState(toIso(start.y, start.m, start.d))
  const grid = useRef<HTMLDivElement>(null)
  const steal = useRef(Boolean(autoFocus))
  const selected = value.slice(0, 10)
  const lo = min?.slice(0, 10)
  const hi = max?.slice(0, 10)
  const blocked = (iso: string) => Boolean((lo && iso < lo) || (hi && iso > hi))

  useEffect(() => {
    if (steal.current && mode === 'days') grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focus}"]`)?.focus({ preventScroll: true })
  }, [focus, view, mode])

  const days = daysInMonth(view.y, view.m)
  const cells = [...Array<null>(weekdayIndex(view.y, view.m, 1)).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  const first = toIso(view.y, view.m, 1)
  const inView = focus.slice(0, 7) === first.slice(0, 7)
  const tabDate = inView ? focus : first

  const go = (iso: string) => {
    const p = parseDate(iso)!
    steal.current = true
    setFocus(iso)
    setView({ y: p.y, m: p.m })
  }
  const shift = (months: number) => {
    const next = addMonths(toIso(view.y, view.m, 1), months)
    const p = parseDate(next)!
    setView({ y: p.y, m: p.m })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const p = parseDate(focus)!
    const row = weekdayIndex(p.y, p.m, p.d)
    const delta: Record<string, string> = {
      ArrowLeft: addDays(focus, -1),
      ArrowRight: addDays(focus, 1),
      ArrowUp: addDays(focus, -7),
      ArrowDown: addDays(focus, 7),
      Home: addDays(focus, -row),
      End: addDays(focus, 6 - row),
      PageUp: addMonths(focus, event.shiftKey ? -12 : -1),
      PageDown: addMonths(focus, event.shiftKey ? 12 : 1),
    }
    const next = delta[event.key]
    if (!next) return
    event.preventDefault()
    go(next)
  }

  return (
    <div className="flex w-[280px] flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-1">
        <button type="button" className={NAV} aria-label={mode === 'days' ? 'Previous month' : 'Previous year'} onClick={() => (mode === 'days' ? shift(-1) : setView((v) => ({ ...v, y: v.y - 1 })))}>
          <CaretLeft size={14} weight="bold" />
        </button>
        <button type="button" className="rounded-lg px-2.5 py-1 text-13 font-extrabold hover:bg-surface-alt" aria-live="polite" onClick={() => setMode(mode === 'days' ? 'months' : 'days')}>
          {mode === 'days' ? `${MONTHS[view.m]} ${view.y}` : view.y}
        </button>
        <button type="button" className={NAV} aria-label={mode === 'days' ? 'Next month' : 'Next year'} onClick={() => (mode === 'days' ? shift(1) : setView((v) => ({ ...v, y: v.y + 1 })))}>
          <CaretRight size={14} weight="bold" />
        </button>
      </div>

      {mode === 'months' ? (
        <div className="grid grid-cols-3 gap-1.5 py-1">
          {MONTHS.map((name, m) => (
            <button
              key={name}
              type="button"
              className={cn('h-10 rounded-lg text-13 font-semibold hover:bg-surface-alt', m === view.m && 'bg-primary-soft font-extrabold text-primary')}
              onClick={() => {
                setView((v) => ({ ...v, m }))
                setFocus(toIso(view.y, m, Math.min(parseDate(focus)!.d, daysInMonth(view.y, m))))
                setMode('days')
              }}
            >
              {name.slice(0, 3)}
            </button>
          ))}
        </div>
      ) : (
        <div role="grid" aria-label={`${MONTHS[view.m]} ${view.y}`} ref={grid} onKeyDown={onKeyDown}>
          <div className="grid grid-cols-7 pb-1" role="row">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-center text-11 font-bold text-ink-faint" role="columnheader">
                {w}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5" role="rowgroup">
            {cells.map((day, i) => {
              if (day == null) return <span key={`gap-${i}`} />
              const iso = toIso(view.y, view.m, day)
              const isSelected = iso === selected
              const off = blocked(iso)
              return (
                <button
                  key={iso}
                  type="button"
                  role="gridcell"
                  data-date={iso}
                  disabled={off}
                  tabIndex={iso === tabDate ? 0 : -1}
                  aria-selected={isSelected}
                  aria-current={iso === today ? 'date' : undefined}
                  className={cn(
                    'mx-auto inline-flex size-9 items-center justify-center rounded-full text-13 font-semibold outline-0 focus-visible:ring-2 focus-visible:ring-primary/50',
                    off ? 'cursor-not-allowed text-ink-faint/60' : 'hover:bg-surface-alt',
                    iso === today && !isSelected && 'border border-primary text-primary',
                    isSelected && 'bg-primary font-extrabold text-white hover:bg-primary',
                  )}
                  onClick={() => onSelect(iso)}
                  onFocus={() => setFocus(iso)}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
