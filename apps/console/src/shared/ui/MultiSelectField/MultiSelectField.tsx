import { CaretDown, Check } from '@phosphor-icons/react'
import { useId, useRef, useState, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Popover } from '../Popover'
import type { SelectOption } from '../SelectField'

interface MultiSelectFieldProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  value: string[]
  options: SelectOption[]
  onChange: (value: string[]) => void
  placeholder?: string
  variant?: 'pill' | 'field'
  className?: string
  triggerClassName?: string
}

/** Dropdown with checkable options ("TTC, PCOS ▾"). The list stays open while you tick several. */
export function MultiSelectField({ value, options, onChange, placeholder = 'Select…', variant = 'field', className, triggerClassName, disabled, id, ...rest }: MultiSelectFieldProps) {
  const uid = useId()
  const button = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const text = options.filter((o) => value.includes(o.value)).map((o) => o.label).join(', ')
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])

  return (
    <span className={cn('relative min-w-0 items-center', variant === 'field' ? 'flex' : 'inline-flex', className)}>
      <button
        ref={button}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        disabled={disabled}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-2 border border-border bg-card text-left font-semibold text-ink outline-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-55',
          open && 'border-primary',
          variant === 'field' ? 'h-11 rounded-control pr-3 pl-3.5 text-13' : 'h-9 rounded-lg pr-2.5 pl-3 text-13',
          triggerClassName,
        )}
        onClick={() => setOpen((o) => !o)}
        {...rest}
      >
        <span className={cn('min-w-0 flex-1 truncate', !text && 'font-medium text-ink-faint')}>{text || placeholder}</span>
        <CaretDown size={13} className={cn('flex-none text-ink-muted transition-transform', open && 'rotate-180')} />
      </button>
      <Popover open={open} anchor={button} onClose={() => setOpen(false)} matchWidth maxHeight={280} className="max-w-90 p-1.5">
        <ul id={`${uid}-list`} role="listbox" aria-multiselectable="true" className="m-0 flex list-none flex-col gap-px p-0">
          {options.map((option) => {
            const on = value.includes(option.value)
            return (
              <li key={option.value} role="option" aria-selected={on} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-13 font-semibold hover:bg-surface" onClick={() => toggle(option.value)}>
                <span className={cn('inline-flex size-[18px] flex-none items-center justify-center rounded-[5px] border text-white', on ? 'border-primary bg-primary' : 'border-border bg-card')}>{on && <Check size={12} weight="bold" />}</span>
                {option.label}
              </li>
            )
          })}
        </ul>
      </Popover>
    </span>
  )
}
