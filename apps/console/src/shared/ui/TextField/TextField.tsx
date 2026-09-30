import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './TextField.module.css'

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
    <div className={styles.field}>
      {!hideLabel && (
        <div className={styles.labelRow}>
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
          {labelAction}
        </div>
      )}
      <div className={styles.input}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input id={id} className={styles.control} {...inputProps} />
        {trailing}
      </div>
    </div>
  )
}
