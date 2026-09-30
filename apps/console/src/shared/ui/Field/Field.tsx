import type { ReactNode } from 'react'
import styles from './Field.module.css'

interface FieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  /** Small muted text at the right of the label. */
  hint?: ReactNode
  /** Error text under the control. */
  error?: string | null
  children: ReactNode
}

/** Label row + control + error message. */
export function Field({ label, htmlFor, required, hint, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
      {children}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
