import { Warning } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface FieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  /** Small muted text at the right of the label. */
  hint?: ReactNode
  /** Error text under the control. */
  error?: string | null
  /** Muted (grey) label, used by the notification editor. */
  muted?: boolean
  children: ReactNode
}

/** Label row + control + error message. */
export function Field({ label, htmlFor, required, hint, error, muted, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className={cn('text-12 font-bold', muted && 'text-ink-muted')} htmlFor={htmlFor}>
          {label}
          {required && <span className="text-primary"> *</span>}
        </label>
        {hint && <span className="text-11 text-ink-faint">{hint}</span>}
      </div>
      {children}
      {error && <p className="flex items-start gap-1.5 text-11 font-semibold text-error"><Warning size={13} className="mt-px flex-none" />{error}</p>}
    </div>
  )
}
