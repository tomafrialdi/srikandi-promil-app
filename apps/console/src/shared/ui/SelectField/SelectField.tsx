import { CaretDown } from '@phosphor-icons/react'
import type { SelectHTMLAttributes } from 'react'
import styles from './SelectField.module.css'

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
    <span className={`${styles.wrap} ${styles[variant]} ${className ?? ''}`}>
      <select className={styles.select} value={value} onChange={(event) => onChange(event.target.value)} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <CaretDown size={13} className={styles.caret} />
    </span>
  )
}
