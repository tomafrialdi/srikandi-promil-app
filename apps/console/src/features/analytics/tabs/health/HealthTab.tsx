import { Info } from '@phosphor-icons/react'
import { formatNumber, formatPercent } from '../../../../shared/lib/format'
import { MetricCard, MetricStrip } from '../../components/MetricCard'
import { QueryBoundary } from '../../components/QueryBoundary'
import { useAnalyticsQuery } from '../../hooks/useAnalyticsQuery'
import { fetchHealth } from '../../services/analytics.service'
import { ByAgeCard } from './ByAgeCard'
import { ByModeTable } from './ByModeTable'
import { CareCard } from './CareCard'
import { PregnanciesPerMonthCard } from './PregnanciesPerMonthCard'
import { SignalsCard } from './SignalsCard'
import { TimeToPregnancyCard } from './TimeToPregnancyCard'

export function HealthTab() {
  const { data, loading, error, retry } = useAnalyticsQuery(fetchHealth)

  return (
    <QueryBoundary data={data} loading={loading} error={error} onRetry={retry}>
      {(d) => {
        const monthChange =
          d.kpis.conceived_prev_month > 0
            ? Math.round(((d.kpis.conceived_this_month - d.kpis.conceived_prev_month) / d.kpis.conceived_prev_month) * 100)
            : null
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-2.5 rounded-xl bg-secondary-soft px-3.5 py-3 text-12 leading-normal font-semibold text-secondary">
              <Info size={16} />
              <p>
                Outcomes are self-reported (positive test or pregnancy mode) and aggregated anonymously. Figures are not
                clinical success rates and must not be used in marketing without medical review.
              </p>
            </div>

            <MetricStrip>
              <MetricCard
                label="Pregnancies reported (all time)"
                value={formatNumber(d.kpis.conceived_total)}
                badge={{ tone: 'success', text: 'all time' }}
              />
              <MetricCard
                label="This month"
                value={formatNumber(d.kpis.conceived_this_month)}
                badge={
                  monthChange == null
                    ? null
                    : { tone: monthChange >= 0 ? 'success' : 'warning', text: `${monthChange >= 0 ? '↑' : '↓'} ${Math.abs(monthChange)}% MoM` }
                }
              />
              <MetricCard
                label="Conceived ≤ 6 tracked cycles"
                value={formatPercent(d.kpis.within_6_cycles_pct)}
                badge={{ tone: 'info', text: '≥ 3 signals logged' }}
              />
              <MetricCard
                label="Median cycles to conceive"
                value={d.kpis.median_cycles ?? '—'}
                badge={{ tone: 'neutral', text: `mean ${d.kpis.mean_cycles ?? '—'}` }}
              />
              <MetricCard
                label="Ovulation confirmed"
                value={formatPercent(d.kpis.ovulation_confirmed_pct, 0)}
                badge={{ tone: 'primary', text: 'of tracked cycles' }}
              />
            </MetricStrip>

            <div className="flex flex-col items-stretch gap-4 min-[1101px]:flex-row">
              <PregnanciesPerMonthCard data={d.pregnancies_per_month} />
              <TimeToPregnancyCard data={d.time_to_pregnancy} />
            </div>

            <ByModeTable data={d.by_mode} />

            <div className="flex flex-col items-stretch gap-4 min-[1101px]:flex-row">
              <ByAgeCard data={d.by_age} />
              <SignalsCard data={d.signals} />
              <CareCard data={d.care} />
            </div>
          </div>
        )
      }}
    </QueryBoundary>
  )
}
