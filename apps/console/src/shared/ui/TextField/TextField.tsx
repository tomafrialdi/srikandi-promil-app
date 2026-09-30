import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
  icon?: ReactNode
  /** Content shown at the right of the label row (e.g. "Forgot?"). */
  labelAction?: ReactNode
  /** Content shown inside the input, at the right (e.g. show/hide toggle). */
  trailing?: ReactNode
  /** Hide the built-in label row (when a surrounding <Field> provides it). */
  hideLabel?: boolean
  /** 40px tall, 13px text (dense modal forms). */
  compact?: boolean
}

export function TextField({ label, id, icon, labelAction, trailing, hideLabel, compact, className, ...inputProps }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      {!hideLabel && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-13 font-bold text-ink">
            {label}
          </label>
          {labelAction}
        </div>
      )}
      <div className={cn('flex items-center border border-border bg-card focus-within:border-primary', compact ? 'h-10 gap-2.5 rounded-[10px] px-3' : 'h-12 gap-3 rounded-control px-3.5')}>
        {icon && <span className="inline-flex text-ink-faint">{icon}</span>}
        <input
          id={id}
          className={cn('min-w-0 flex-1 border-0 bg-transparent font-semibold text-ink outline-0 placeholder:font-medium placeholder:text-ink-faint disabled:text-ink-muted', compact ? 'text-13' : 'text-14', className)}
          {...inputProps}
        />
        {trailing}
      </div>
    </div>
  )
}
