import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { SelectField, type SelectOption } from '../SelectField'

interface UnitFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'> {
  id: string
  value: string
  onChange: (value: string) => void
  unit: string
  units: SelectOption[]
  onUnitChange: (unit: string) => void
  /** Accessible name of the unit dropdown. */
  unitLabel?: string
}

/** Number input with its unit dropdown inside the same bordered box (strength 500 [mg ▾]). */
export function UnitField({ id, value, onChange, unit, units, onUnitChange, unitLabel = 'Unit', disabled, className, ...input }: UnitFieldProps) {
  return (
    <div className={cn('flex h-12 items-stretch overflow-hidden rounded-control border border-border bg-card focus-within:border-primary', disabled && 'opacity-55', className)}>
      <input
        id={id}
        className="min-w-0 flex-1 border-0 bg-transparent px-3.5 text-14 font-semibold text-ink outline-0 placeholder:text-ink-faint"
        inputMode="decimal"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        {...input}
      />
      <SelectField
        aria-label={unitLabel}
        className="w-[88px] flex-none border-l border-border"
        triggerClassName="h-full rounded-none border-0 bg-surface pl-3 pr-2.5"
        value={unit}
        options={units}
        disabled={disabled}
        onChange={onUnitChange}
      />
    </div>
  )
}
