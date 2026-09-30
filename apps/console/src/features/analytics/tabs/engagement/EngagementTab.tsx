import { formatCompact, formatDuration, formatPercent } from '../../../../shared/lib/format'
import { MetricCard, MetricStrip } from '../../components/MetricCard'
import { QueryBoundary } from '../../components/QueryBoundary'
import { trendBadge } from '../../components/trend-badge'
import layout from '../../components/TabContent.module.css'
import { useAnalyticsQuery } from '../../hooks/useAnalyticsQuery'
import { fetchEngagement } from '../../services/analytics.service'
import { DauTrendCard } from './DauTrendCard'
import { FeatureTable } from './FeatureTable'
import { HeatmapCard } from './HeatmapCard'
import { StreaksCard } from './StreaksCard'
import { TopContentCard } from './TopContentCard'

export function EngagementTab() {
  const { data, loading, error, retry } = useAnalyticsQuery(fetchEngagement)

  return (
    <QueryBoundary data={data} loading={loading} error={error} onRetry={retry}>
      {(d) => (
        <div className={layout.content}>
          <MetricStrip>
            <MetricCard
              label="Sessions / user / day"
              value={d.kpis.sessions_per_user_day.value ?? '—'}
              badge={trendBadge(d.kpis.sessions_per_user_day.delta)}
            />
            <MetricCard
              label="Avg. session length"
              value={formatDuration(d.kpis.avg_session_seconds.value ?? 0)}
              badge={trendBadge(d.kpis.avg_session_seconds.delta, { unit: 's', digits: 0 })}
            />
            <MetricCard
              label="Signals logged / day"
              value={formatCompact(d.kpis.signals_per_day.value ?? 0)}
              badge={trendBadge(d.kpis.signals_per_day.delta, { unit: '%', digits: 0 })}
            />
            <MetricCard
              label="7-day streak users"
              value={formatPercent(d.kpis.streak_7_pct.value, 0)}
              badge={{ tone: 'neutral', text: 'of active users' }}
            />
            <MetricCard
              label="Push open rate"
              value={formatPercent(d.kpis.push_open_rate.value)}
              badge={trendBadge(d.kpis.push_open_rate.delta, { unit: ' pts' })}
            />
          </MetricStrip>

          <div className={layout.row}>
            <div className={layout.grow}>
              <DauTrendCard data={d.dau_trend} />
            </div>
            <HeatmapCard data={d.heatmap} />
          </div>

          <FeatureTable data={d.features} />

          <div className={layout.row}>
            <StreaksCard data={d.streaks} />
            <TopContentCard data={d.top_content} />
          </div>
        </div>
      )}
    </QueryBoundary>
  )
}
