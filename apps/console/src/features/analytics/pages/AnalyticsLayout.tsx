import { Outlet } from 'react-router-dom'
import { AnalyticsHeader } from '../components/AnalyticsHeader'
import { AnalyticsTabs } from '../components/AnalyticsTabs'

/** Shared frame of every analytics tab: title + date range, then the tab strip, then the tab. */
export function AnalyticsLayout() {
  return (
    <>
      <AnalyticsHeader />
      <AnalyticsTabs />
      <Outlet />
    </>
  )
}
