import { Check } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

interface ChipToggleGroupProps {
  options: Array<string | { value: string; label: string }>
  selected: string[]
  onChange: (next: string[]) => void
  /** Single-select behaviour (clicking the active chip does nothing). */
  single?: boolean
  label?: string
}

/** Wrapping row of toggle chips (multi-select by default). */
export function ChipToggleGroup({ options, selected, onChange, single, label }: ChipToggleGroupProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value
        const text = typeof option === 'string' ? option : option.label
        const active = selected.includes(value)
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            className={cn(
              'inline-flex h-[27px] items-center gap-1 rounded-full border px-2.5 text-12 font-semibold',
              active ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-card text-ink-muted',
            )}
            onClick={() => onChange(single ? [value] : active ? selected.filter((v) => v !== value) : [...selected, value])}
          >
            {active && <Check size={12} weight="bold" />}
            {text}
          </button>
        )
      })}
    </div>
  )
}
