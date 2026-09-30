import { CaretDown } from '@phosphor-icons/react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  /** "pill" = compact filter chip, "field" = full-width form control. */
  variant?: 'pill' | 'field'
}

/** Styled native <select> (keyboard + mobile friendly). */
export function SelectField({ value, options, onChange, variant = 'field', className, ...rest }: SelectFieldProps) {
  return (
    <span className={cn('relative min-w-0 items-center', variant === 'field' ? 'flex' : 'inline-flex', className)}>
      <select
        className={cn(
          'w-full cursor-pointer appearance-none border border-border bg-card font-semibold text-ink outline-0 focus-visible:border-primary',
          variant === 'field' ? 'h-11 rounded-control pr-[34px] pl-3.5 text-13' : 'h-9 rounded-lg pr-8 pl-3 text-13',
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <CaretDown size={13} className={cn('pointer-events-none absolute text-ink-muted', variant === 'field' ? 'right-3' : 'right-2.5')} />
    </span>
  )
}
