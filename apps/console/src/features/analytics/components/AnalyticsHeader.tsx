import { Button } from '../../../shared/ui'
import { DownloadSimple } from '@phosphor-icons/react'
import { useLocation } from 'react-router-dom'
import { ANALYTICS_TABS } from '../config/tabs'
import { useDateRange } from '../hooks/useDateRange'
import { DateRangeMenu } from './DateRangeMenu'
import styles from './AnalyticsHeader.module.css'

export function AnalyticsHeader() {
  const [range, setPreset] = useDateRange()
  const { pathname } = useLocation()
  const active = ANALYTICS_TABS.find((tab) => tab.path && pathname.endsWith(`/${tab.path}`))

  return (
    <div className={styles.head}>
      <div className={styles.title}>
        <h1 className={styles.h1}>{active ? `Analytics / ${active.label}` : 'Analytics'}</h1>
        <p className={styles.sub}>
          {active ? range.label : 'Deep-dive into engagement, retention, acquisition and health'}
        </p>
      </div>
      <div className={styles.actions}>
        <DateRangeMenu range={range} onChange={setPreset} />
        <Button leadingIcon={<DownloadSimple size={16} color="#fff" />}>Export</Button>
      </div>
    </div>
  )
}
