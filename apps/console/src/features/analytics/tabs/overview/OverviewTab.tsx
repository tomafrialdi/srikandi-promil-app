import { formatNumber, formatPercent } from '../../../../shared/lib/format'
import { MetricCard, MetricStrip } from '../../components/MetricCard'
import { QueryBoundary } from '../../components/QueryBoundary'
import { trendBadge } from '../../components/trend-badge'
import layout from '../../components/TabContent.module.css'
import { useAnalyticsQuery } from '../../hooks/useAnalyticsQuery'
import { fetchOverview } from '../../services/analytics.service'
import { ChannelsCard } from './ChannelsCard'
import { DailyLogsCard } from './DailyLogsCard'
import { PlatformCard } from './PlatformCard'
import { RetentionCohortsCard } from './RetentionCohortsCard'
import { SignalsOutcomeCard } from './SignalsOutcomeCard'

export function OverviewTab() {
  const { data, loading, error, retry } = useAnalyticsQuery(fetchOverview)

  return (
    <QueryBoundary data={data} loading={loading} error={error} onRetry={retry}>
      {(d) => (
        <div className={layout.content}>
          <MetricStrip>
            <MetricCard
              label="DAU"
              value={formatNumber(d.kpis.dau.value ?? 0)}
              badge={trendBadge(d.kpis.dau.delta, { unit: '%' })}
              spark={d.kpis.dau.spark}
            />
            <MetricCard
              label="WAU"
              value={formatNumber(d.kpis.wau.value ?? 0)}
              badge={trendBadge(d.kpis.wau.delta, { unit: '%' })}
              spark={d.kpis.wau.spark}
            />
            <MetricCard
              label="MAU"
              value={formatNumber(d.kpis.mau.value ?? 0)}
              badge={trendBadge(d.kpis.mau.delta, { unit: '%' })}
              spark={d.kpis.mau.spark}
            />
            <MetricCard
              label="Stickiness (DAU/MAU)"
              value={formatPercent(d.kpis.stickiness.value)}
              badge={trendBadge(d.kpis.stickiness.delta, { unit: ' pts' })}
              spark={d.kpis.stickiness.spark}
            />
            <MetricCard
              label="Avg. logs / user / day"
              value={d.kpis.logs_per_user_day.value ?? '—'}
              badge={trendBadge(d.kpis.logs_per_user_day.delta)}
              spark={d.kpis.logs_per_user_day.spark}
            />
          </MetricStrip>

          <div className={layout.row}>
            <div className={layout.grow}>
              <DailyLogsCard data={d.daily_logs} />
            </div>
            <PlatformCard data={d.platform} />
          </div>

          <RetentionCohortsCard data={d.retention_cohorts} />

          <div className={layout.row}>
            <ChannelsCard data={d.channels} />
            <SignalsOutcomeCard data={d.signals_vs_outcome} />
          </div>
        </div>
      )}
    </QueryBoundary>
  )
}
