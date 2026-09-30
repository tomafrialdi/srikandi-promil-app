import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface SegmentedProps<T extends string> {
  options: Array<{ value: T; label: string; /** Shown before the label; tinted primary while selected. */ icon?: ReactNode }>
  value: T
  onChange: (value: T) => void
  label: string
  /** Stretch to the full width with equal-width tabs. */
  block?: boolean
  /** "lg" = 37px tall control (forms), default "sm". `block` implies "lg". */
  size?: 'sm' | 'lg'
}

/** Small pill switch (Monthly | Yearly | Total). */
export function Segmented<T extends string>({ options, value, onChange, label, block, size = 'sm' }: SegmentedProps<T>) {
  const lg = block || size === 'lg'
  return (
    <div className={cn('gap-0.5 bg-surface-alt', block ? 'flex w-full' : 'inline-flex', lg ? 'rounded-[10px] p-1' : 'rounded-lg p-[3px]')} role="tablist" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 text-11 font-bold whitespace-nowrap transition-colors',
              lg ? 'rounded-lg px-3 py-2 text-12' : 'rounded-md px-2.5 py-1',
              block && 'flex-1',
              active ? 'bg-card text-ink shadow-[0_1px_2px_rgba(26,26,24,0.08)]' : 'text-ink-muted',
            )}
            onClick={() => onChange(option.value)}
          >
            {option.icon && <span className={cn('inline-flex', active && 'text-primary')}>{option.icon}</span>}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
