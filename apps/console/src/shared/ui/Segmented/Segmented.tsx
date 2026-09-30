import { cn } from '../../lib/cn'

interface SegmentedProps<T extends string> {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  label: string
}

/** Small pill switch (Monthly | Yearly | Total). */
export function Segmented<T extends string>({ options, value, onChange, label }: SegmentedProps<T>) {
  return (
    <div className="inline-flex gap-0.5 rounded-lg bg-surface-alt p-[3px]" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={cn(
            'rounded-md px-2.5 py-1 text-11 font-bold transition-colors',
            option.value === value ? 'bg-card text-ink shadow-[0_1px_2px_rgba(26,26,24,0.08)]' : 'text-ink-muted',
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
