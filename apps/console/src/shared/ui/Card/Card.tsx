import type { ElementType, ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps {
  as?: ElementType
  className?: string
  children: ReactNode
}

export function Card({ as: Tag = 'section', className, children }: CardProps) {
  return <Tag className={[styles.card, className].filter(Boolean).join(' ')}>{children}</Tag>
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerText}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
