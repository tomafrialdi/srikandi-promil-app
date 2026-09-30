import { useState } from 'react'
import { Calendar, DownloadSimple } from '@phosphor-icons/react'
import { Button } from '../../../shared/ui'
import styles from './DashboardHeader.module.css'

function greeting(hour: number): string {
  if (hour < 11) return 'Good morning'
  if (hour < 15) return 'Good afternoon'
  if (hour < 19) return 'Good evening'
  return 'Good night'
}

export function DashboardHeader({ firstName }: { firstName: string }) {
  const [hour] = useState(() => new Date().getHours())
  return (
    <div className={styles.head}>
      <div className={styles.title}>
        <h1 className={styles.h1}>
          {greeting(hour)}
          {firstName && `, ${firstName}`}
        </h1>
        <p className={styles.sub}>Here's how Srikandi Promil is doing in the last 30 days.</p>
      </div>
      <div className={styles.actions}>
        <Button variant="outline" leadingIcon={<Calendar size={16} />}>
          Last 30 days
        </Button>
        <Button leadingIcon={<DownloadSimple size={16} color="#fff" />}>Export report</Button>
      </div>
    </div>
  )
}
