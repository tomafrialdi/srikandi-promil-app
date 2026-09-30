import type { ReactNode } from 'react'
import styles from './PageState.module.css'

interface PageStateProps {
  title: string
  description?: string
  action?: ReactNode
}

/** Centered message used for loading, empty and error states. */
export function PageState({ title, description, action }: PageStateProps) {
  return (
    <div className={styles.state}>
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  )
}
