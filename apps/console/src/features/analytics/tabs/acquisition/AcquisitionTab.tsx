import { formatIdr, formatNumber, formatPercent } from '../../../../shared/lib/format'
import { MetricCard, MetricStrip } from '../../components/MetricCard'
import { QueryBoundary } from '../../components/QueryBoundary'
import { trendBadge } from '../../components/trend-badge'
import layout from '../../components/TabContent.module.css'
import { useAnalyticsQuery } from '../../hooks/useAnalyticsQuery'
import { fetchAcquisition } from '../../services/analytics.service'
import { CampaignsCard } from './CampaignsCard'
import { ChannelsTable } from './ChannelsTable'
import { InstallFunnelCard } from './InstallFunnelCard'
import { RegionsCard } from './RegionsCard'
import { WeeklyInstallsCard } from './WeeklyInstallsCard'

export function AcquisitionTab() {
  const { data, loading, error, retry } = useAnalyticsQuery(fetchAcquisition)

  return (
    <QueryBoundary data={data} loading={loading} error={error} onRetry={retry}>
      {(d) => (
        <div className={layout.content}>
          <MetricStrip>
            <MetricCard
              label="Installs (range)"
              value={formatNumber(d.kpis.installs.value)}
              badge={trendBadge(d.kpis.installs.delta_pct, { unit: '%', digits: 0 })}
            />
            <MetricCard
              label="Sign-ups"
              value={formatNumber(d.kpis.signups.value)}
              badge={{ tone: 'neutral', text: `${formatPercent(d.kpis.signups.of_installs_pct)} of installs` }}
            />
            <MetricCard
              label="Blended CAC"
              value={d.kpis.blended_cac.value != null ? formatIdr(d.kpis.blended_cac.value) : '—'}
              badge={trendBadge(d.kpis.blended_cac.delta, { inverse: true, format: formatIdr })}
            />
            <MetricCard
              label="LTV : CAC"
              value={d.kpis.ltv_cac.value != null ? `${d.kpis.ltv_cac.value}×` : '—'}
              badge={{ tone: 'success', text: 'target ≥ 3×' }}
            />
            <MetricCard
              label="CAC payback"
              value={d.kpis.payback_months.value != null ? `${d.kpis.payback_months.value} months` : '—'}
              badge={{ tone: 'info', text: 'paid users' }}
            />
          </MetricStrip>

          <div className={layout.row}>
            <div className={layout.grow}>
              <WeeklyInstallsCard data={d.weekly_installs} />
            </div>
            <InstallFunnelCard data={d.funnel} />
          </div>

          <ChannelsTable data={d.channels} />

          <div className={layout.row}>
            <CampaignsCard data={d.campaigns} />
            <RegionsCard data={d.regions} />
          </div>
        </div>
      )}
    </QueryBoundary>
  )
}
