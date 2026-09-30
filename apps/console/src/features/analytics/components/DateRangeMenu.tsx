import { CalendarBlank, CaretDown, Check } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { RANGE_PRESETS, type DateRange, type RangePresetKey } from '../config/date-range'

interface DateRangeMenuProps {
  range: DateRange
  onChange: (preset: RangePresetKey) => void
}

export function DateRangeMenu({ range, onChange }: DateRangeMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-control border border-border bg-card px-2.5 py-2 text-13 font-bold"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarBlank size={16} />
        {range.label}
        <CaretDown size={13} color="var(--ink-muted)" />
      </button>
      {open && (
        <ul className="absolute top-[calc(100%+6px)] right-0 z-20 m-0 min-w-47.5 list-none rounded-xl border border-border bg-card p-1.5 shadow-menu" role="listbox">
          {RANGE_PRESETS.map((preset) => (
            <li key={preset.key} role="option" aria-selected={preset.key === range.preset}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-[9px] text-left text-13 font-semibold hover:bg-surface"
                onClick={() => {
                  onChange(preset.key)
                  setOpen(false)
                }}
              >
                {preset.label}
                {preset.key === range.preset && <Check size={14} weight="bold" color="var(--primary)" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
