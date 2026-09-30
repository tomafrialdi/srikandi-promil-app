import type { ReactNode } from 'react'
import styles from './RadioCard.module.css'

interface RadioCardProps {
  selected: boolean
  onSelect: () => void
  title: ReactNode
  description?: ReactNode
  /** Small chip after the title (e.g. "Recommended", "2 approvals"). */
  badge?: ReactNode
  disabled?: boolean
  name: string
}

/** A selectable card with a radio dot; use inside a group with the same `name`. */
export function RadioCard({ selected, onSelect, title, description, badge, disabled, name }: RadioCardProps) {
  return (
    <label className={`${styles.card} ${selected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}>
      <input type="radio" className={styles.input} name={name} checked={selected} disabled={disabled} onChange={onSelect} />
      <span className={styles.text}>
        <span className={styles.titleRow}>
          <span className={styles.title}>{title}</span>
          {badge}
        </span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
      <span className={styles.dot} aria-hidden="true" />
    </label>
  )
}
