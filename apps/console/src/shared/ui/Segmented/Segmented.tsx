import { cn } from '../../lib/cn'

interface SegmentedProps<T extends string> {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  label: string
  /** Stretch to the full width with equal-width tabs. */
  block?: boolean
}

/** Small pill switch (Monthly | Yearly | Total). */
export function Segmented<T extends string>({ options, value, onChange, label, block }: SegmentedProps<T>) {
  return (
    <div className={cn('gap-0.5 bg-surface-alt', block ? 'flex w-full rounded-[10px] p-1' : 'inline-flex rounded-lg p-[3px]')} role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={cn(
            'text-11 font-bold transition-colors',
            block ? 'flex-1 rounded-lg px-3 py-2 text-12' : 'rounded-md px-2.5 py-1',
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
