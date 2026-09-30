import { DownloadSimple } from '@phosphor-icons/react'
import { useLocation } from 'react-router-dom'
import { Button } from '../../../shared/ui'
import { ANALYTICS_TABS } from '../config/tabs'
import { useDateRange } from '../hooks/useDateRange'
import { DateRangeMenu } from './DateRangeMenu'

export function AnalyticsHeader() {
  const [range, setPreset] = useDateRange()
  const { pathname } = useLocation()
  const active = ANALYTICS_TABS.find((tab) => tab.path && pathname.endsWith(`/${tab.path}`))

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">{active ? `Analytics / ${active.label}` : 'Analytics'}</h1>
        <p className="text-14 text-ink-muted">{active ? range.label : 'Deep-dive into engagement, retention, acquisition and health'}</p>
      </div>
      <div className="flex gap-2.5">
        <DateRangeMenu range={range} onChange={setPreset} />
        <Button leadingIcon={<DownloadSimple size={16} color="#fff" />}>Export</Button>
      </div>
    </div>
  )
}
