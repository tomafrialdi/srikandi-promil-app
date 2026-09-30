import type { ReactNode } from 'react'
import styles from './Toggle.module.css'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label: string
}

/** Accessible on/off switch. */
export function Toggle({ checked, onChange, disabled, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`${styles.toggle} ${checked ? styles.on : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.thumb} />
    </button>
  )
}

interface ToggleRowProps extends ToggleProps {
  title: ReactNode
  description?: ReactNode
}

/** Title + description at the left, switch at the right. */
export function ToggleRow({ title, description, ...toggle }: ToggleRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </div>
      <Toggle {...toggle} />
    </div>
  )
}

interface CheckRowProps {
  checked: boolean
  onChange: (checked: boolean) => void
  title: ReactNode
  description?: ReactNode
}

/** Checkbox with title + description. */
export function CheckRow({ checked, onChange, title, description }: CheckRowProps) {
  return (
    <label className={styles.checkRow}>
      <input type="checkbox" className={styles.checkInput} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.check} aria-hidden="true">
        {checked && '✓'}
      </span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
    </label>
  )
}

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  indeterminate?: boolean
}

/** Bare 18px checkbox (table rows, select-all). */
export function Checkbox({ checked, onChange, label, indeterminate }: CheckboxProps) {
  return (
    <label className={styles.bareCheck} onClick={(event) => event.stopPropagation()}>
      <input
        type="checkbox"
        className={styles.checkInput}
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={`${styles.check} ${indeterminate ? styles.mixed : ''}`} aria-hidden="true">
        {indeterminate ? '–' : checked && '✓'}
      </span>
    </label>
  )
}
