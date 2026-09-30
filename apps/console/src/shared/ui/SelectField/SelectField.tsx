import { CaretDown, Check } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Popover } from '../Popover'

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  /** "pill" = compact filter chip, "field" = full-width form control. */
  variant?: 'pill' | 'field'
  /** Shown when `value` matches no option. */
  placeholder?: string
  /** Classes for the button itself (`className` styles the wrapper). */
  triggerClassName?: string
  /** Replaces the chevron (e.g. a magnifier for a "search…" field). */
  indicator?: ReactNode
}

/**
 * Dropdown that replaces the native <select>: styled list in a popover, keyboard friendly
 * (arrows, Home/End, Enter/Space, Escape, type-to-jump) and announced as a combobox + listbox.
 */
export function SelectField({ value, options, onChange, variant = 'field', className, triggerClassName, indicator, placeholder, disabled, id, ...rest }: SelectFieldProps) {
  const uid = useId()
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const typed = useRef({ text: '', at: 0 })
  const [open, setOpen] = useState(false)
  const selectedIndex = options.findIndex((o) => o.value === value)
  const [active, setActive] = useState(0)
  const current = options[selectedIndex]

  useEffect(() => {
    if (open) list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const show = () => {
    setActive(Math.max(0, selectedIndex))
    setOpen(true)
  }
  const pick = (index: number) => {
    const option = options[index]
    setOpen(false)
    button.current?.focus()
    if (option && option.value !== value) onChange(option.value)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        show()
      }
      return
    }
    const move = (to: number) => {
      event.preventDefault()
      setActive(Math.max(0, Math.min(last, to)))
    }
    if (event.key === 'ArrowDown') move(active + 1)
    else if (event.key === 'ArrowUp') move(active - 1)
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(last)
    else if (event.key === 'PageDown') move(active + 8)
    else if (event.key === 'PageUp') move(active - 8)
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      pick(active)
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      const now = Date.now()
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : '') + event.key.toLowerCase(), at: now }
      const hit = options.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text))
      if (hit >= 0) setActive(hit)
    }
  }

  return (
    <span className={cn('relative min-w-0 items-center', variant === 'field' ? 'flex' : 'inline-flex', className)}>
      <button
        ref={button}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        aria-activedescendant={open ? `${uid}-${active}` : undefined}
        disabled={disabled}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-2 border border-border bg-card text-left font-semibold text-ink outline-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-55',
          open && 'border-primary',
          variant === 'field' ? 'h-11 rounded-control pr-3 pl-3.5 text-13' : 'h-9 rounded-lg pr-2.5 pl-3 text-13',
          triggerClassName,
        )}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        {...rest}
      >
        <span className={cn('min-w-0 flex-1 truncate', !current && 'text-ink-faint')}>{current?.label ?? placeholder ?? ''}</span>
        {indicator ?? <CaretDown size={13} className={cn('flex-none text-ink-muted transition-transform', open && 'rotate-180')} />}
      </button>
      <Popover open={open} anchor={button} onClose={() => setOpen(false)} matchWidth maxHeight={280} className="max-w-90 p-1.5">
        <ul ref={list} id={`${uid}-list`} role="listbox" className="m-0 flex list-none flex-col gap-px p-0" onMouseDown={(event) => event.preventDefault()}>
          {options.map((option, index) => {
            const selected = index === selectedIndex
            return (
              <li
                key={option.value}
                id={`${uid}-${index}`}
                role="option"
                aria-selected={selected}
                data-active={index === active}
                className={cn('flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-13 font-semibold', index === active && 'bg-surface', selected && 'text-primary')}
                onMouseMove={() => index !== active && setActive(index)}
                onClick={() => pick(index)}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {selected && <Check size={14} weight="bold" className="flex-none" />}
              </li>
            )
          })}
          {options.length === 0 && <li className="px-2.5 py-2 text-12 text-ink-muted">No options</li>}
        </ul>
      </Popover>
    </span>
  )
}
