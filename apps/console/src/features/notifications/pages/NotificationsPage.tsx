import { useUrlFilters } from '../../../shared/hooks/useUrlFilters'
import { CampaignTable } from '../components/list/CampaignTable'
import { FailuresCard } from '../components/list/FailuresCard'
import { NotificationsHeader } from '../components/list/NotificationsHeader'
import { NotificationStats } from '../components/list/NotificationStats'
import { OpensByHourCard } from '../components/list/OpensByHourCard'
import { DispatcherNotice } from '../components/list/DispatcherNotice'
import { useCampaigns, useDispatcherStatus, useFailures, useHourlyOpens, useNotificationsSummary } from '../hooks/useNotificationsData'

export function NotificationsPage() {
  const { values, page, setFilter, setPage } = useUrlFilters({ tab: 'tab' }, { tab: 'all' })
  const summary = useNotificationsSummary()
  const list = useCampaigns(values.tab, page)
  const hourly = useHourlyOpens()
  const failures = useFailures()
  const dispatcher = useDispatcherStatus()

  return (
    <>
      <NotificationsHeader />
      <DispatcherNotice status={dispatcher.data ?? undefined} />
      <NotificationStats data={summary.data} />
      <CampaignTable
        summary={summary.data}
        list={list.data}
        loading={list.loading}
        error={list.error}
        tab={values.tab}
        page={page}
        onTab={(tab) => setFilter('tab', tab)}
        onPage={setPage}
        onRetry={list.reload}
      />
      <div className="flex flex-col gap-4 min-[1201px]:flex-row">
        <OpensByHourCard data={hourly.data} />
        <FailuresCard data={failures.data} />
      </div>
    </>
  )
}
