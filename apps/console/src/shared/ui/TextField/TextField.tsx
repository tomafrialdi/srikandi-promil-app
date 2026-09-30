import type { InputHTMLAttributes, ReactNode } from 'react'

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
}

export function TextField({ label, id, icon, labelAction, trailing, hideLabel, ...inputProps }: TextFieldProps) {
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
      <div className="flex h-12 items-center gap-3 rounded-control border border-border bg-card px-3.5 focus-within:border-primary">
        {icon && <span className="inline-flex text-ink-faint">{icon}</span>}
        <input
          id={id}
          className="min-w-0 flex-1 border-0 bg-transparent text-14 font-semibold text-ink outline-0 placeholder:text-ink-faint disabled:text-ink-muted"
          {...inputProps}
        />
        {trailing}
      </div>
    </div>
  )
}
