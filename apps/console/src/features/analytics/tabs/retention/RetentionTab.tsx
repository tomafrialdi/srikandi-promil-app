import { formatPercent } from '../../../../shared/lib/format'
import { MetricCard, MetricStrip } from '../../components/MetricCard'
import { QueryBoundary } from '../../components/QueryBoundary'
import { trendBadge } from '../../components/trend-badge'
import { useAnalyticsQuery } from '../../hooks/useAnalyticsQuery'
import { fetchRetention } from '../../services/analytics.service'
import { ChurnReasonsCard } from './ChurnReasonsCard'
import { RetentionCurveCard } from './RetentionCurveCard'
import { SegmentsCard } from './SegmentsCard'
import { WeeklyCohortsCard } from './WeeklyCohortsCard'
import { WinBackCard } from './WinBackCard'

export function RetentionTab() {
  const { data, loading, error, retry } = useAnalyticsQuery(fetchRetention)

  return (
    <QueryBoundary data={data} loading={loading} error={error} onRetry={retry}>
      {(d) => (
        <div className="flex flex-col gap-6">
          <MetricStrip>
            <MetricCard label="Day-1 retention" value={formatPercent(d.kpis.day1.value, 0)} badge={trendBadge(d.kpis.day1.delta, { unit: ' pts', digits: 0 })} />
            <MetricCard label="Day-7 retention" value={formatPercent(d.kpis.day7.value, 0)} badge={trendBadge(d.kpis.day7.delta, { unit: ' pts', digits: 0 })} />
            <MetricCard label="Day-30 retention" value={formatPercent(d.kpis.day30.value, 0)} badge={trendBadge(d.kpis.day30.delta, { unit: ' pts', digits: 0 })} />
            <MetricCard
              label="Week-12 retention"
              value={formatPercent(d.kpis.week12.value, 0)}
              badge={
                d.kpis.week12.previous != null
                  ? { tone: 'neutral', text: `vs ${d.kpis.week12.previous}% last qtr` }
                  : null
              }
            />
            <MetricCard
              label="Monthly churn (all)"
              value={formatPercent(d.kpis.monthly_churn.value)}
              badge={trendBadge(d.kpis.monthly_churn.delta, { unit: ' pts', inverse: true })}
            />
          </MetricStrip>

          <div className="flex flex-col items-stretch gap-4 min-[1101px]:flex-row">
            <RetentionCurveCard data={d.curve} />
            <ChurnReasonsCard data={d.exit_reasons} />
          </div>

          <WeeklyCohortsCard data={d.weekly_cohorts} />

          <div className="flex flex-col items-stretch gap-4 min-[1101px]:flex-row">
            <SegmentsCard data={d.segments} />
            <WinBackCard data={d.win_back} />
          </div>
        </div>
      )}
    </QueryBoundary>
  )
}
