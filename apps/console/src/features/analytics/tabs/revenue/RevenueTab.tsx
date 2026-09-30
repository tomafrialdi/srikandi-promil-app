import { formatIdr, formatIdrCompact, formatPercent } from '../../../../shared/lib/format'
import { MetricCard, MetricStrip } from '../../components/MetricCard'
import { QueryBoundary } from '../../components/QueryBoundary'
import { trendBadge } from '../../components/trend-badge'
import layout from '../../components/TabContent.module.css'
import { useAnalyticsQuery } from '../../hooks/useAnalyticsQuery'
import { fetchRevenue } from '../../services/analytics.service'
import { CancelReasonsCard } from './CancelReasonsCard'
import { LtvByChannelCard } from './LtvByChannelCard'
import { MrrMovementCard } from './MrrMovementCard'
import { RevenueByPlanCard } from './RevenueByPlanCard'
import { RevenueTrendCard } from './RevenueTrendCard'
import { TrialFunnelCard } from './TrialFunnelCard'

export function RevenueTab() {
  const { data, loading, error, retry } = useAnalyticsQuery(fetchRevenue)

  return (
    <QueryBoundary data={data} loading={loading} error={error} onRetry={retry}>
      {(d) => (
        <div className={layout.content}>
          <MetricStrip>
            <MetricCard
              label="MRR"
              value={formatIdrCompact(d.kpis.mrr.value)}
              badge={trendBadge(d.kpis.mrr.delta_pct, { unit: '%' })}
            />
            <MetricCard
              label="Net revenue retention"
              value={formatPercent(d.kpis.nrr.value, 0)}
              badge={{
                tone: d.kpis.nrr.expansion_beats_churn ? 'success' : 'warning',
                text: d.kpis.nrr.expansion_beats_churn ? 'expansion > churn' : 'churn > expansion',
              }}
            />
            <MetricCard
              label="ARPU (all users)"
              value={d.kpis.arpu.value != null ? formatIdr(d.kpis.arpu.value) : '—'}
              badge={trendBadge(d.kpis.arpu.delta, { format: formatIdr })}
            />
            <MetricCard
              label="LTV (paid)"
              value={d.kpis.ltv.value != null ? formatIdrCompact(d.kpis.ltv.value) : '—'}
              badge={d.kpis.ltv.lifetime_months != null ? { tone: 'info', text: `avg ${d.kpis.ltv.lifetime_months} months` } : null}
            />
            <MetricCard
              label="Trial → paid"
              value={formatPercent(d.kpis.trial_to_paid.value)}
              badge={trendBadge(d.kpis.trial_to_paid.delta, { unit: ' pts' })}
            />
          </MetricStrip>

          <div className={layout.row}>
            <MrrMovementCard data={d.mrr_movement} />
            <RevenueByPlanCard data={d.revenue_by_plan} />
          </div>

          <div className={layout.row}>
            <RevenueTrendCard data={d.revenue_trend} />
            <LtvByChannelCard data={d.ltv_by_channel} />
          </div>

          <div className={layout.row}>
            <TrialFunnelCard data={d.trial_funnel} />
            <CancelReasonsCard data={d.churn_reasons} />
          </div>
        </div>
      )}
    </QueryBoundary>
  )
}
