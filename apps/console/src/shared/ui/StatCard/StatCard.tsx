import type { ReactNode } from 'react'
import { Badge, type BadgeTone } from '../Badge'
import { Card } from '../Card'
import styles from './StatCard.module.css'

interface StatCardProps {
  label: string
  value: ReactNode
  badge?: { tone: BadgeTone; text: string } | null
  /** Extra muted text next to the badge. */
  hint?: ReactNode
}

/** Compact KPI card: label, big value, optional badge. */
export function StatCard({ label, value, badge, hint }: StatCardProps) {
  return (
    <Card className={styles.card}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row}>
        <span className={styles.value}>{value}</span>
        {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
    </Card>
  )
}

export function StatGrid({ children, columns = 5 }: { children: ReactNode; columns?: 4 | 5 }) {
  return <div className={`${styles.grid} ${columns === 4 ? styles.four : styles.five}`}>{children}</div>
}
