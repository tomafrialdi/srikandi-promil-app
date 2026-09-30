import { CalendarBlank, CaretDown, Check } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { RANGE_PRESETS, type DateRange, type RangePresetKey } from '../config/date-range'
import styles from './DateRangeMenu.module.css'

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
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarBlank size={16} />
        {range.label}
        <CaretDown size={13} color="var(--ink-muted)" />
      </button>
      {open && (
        <ul className={styles.menu} role="listbox">
          {RANGE_PRESETS.map((preset) => (
            <li key={preset.key} role="option" aria-selected={preset.key === range.preset}>
              <button
                type="button"
                className={styles.option}
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
