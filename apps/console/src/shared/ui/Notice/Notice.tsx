import type { ReactNode } from 'react'
import styles from './Notice.module.css'

interface NoticeProps {
  tone?: 'neutral' | 'warning' | 'error'
  icon: ReactNode
  children: ReactNode
}

export function Notice({ tone = 'neutral', icon, children }: NoticeProps) {
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role={tone === 'error' ? 'alert' : undefined}>
      <span className={styles.icon}>{icon}</span>
      <p className={styles.text}>{children}</p>
    </div>
  )
}
