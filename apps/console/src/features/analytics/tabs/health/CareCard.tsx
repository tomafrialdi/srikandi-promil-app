import { Card, CardHeader } from '../../../../shared/ui'
import { formatNumber } from '../../../../shared/lib/format'
import { trendBadge } from '../../components/trend-badge'
import type { HealthData } from '../../types'

export function CareCard({ data }: { data: HealthData['care'] }) {
  const change = trendBadge(data.counsellor_sessions_delta_pct, { unit: '%', digits: 0 })
  return (
    <Card className="w-full flex-none min-[1101px]:w-90">
      <CardHeader title="Care & safety" subtitle="Sensitive · aggregated only" />
      <Stat label="Pregnancy losses reported" value={formatNumber(data.pregnancy_losses)} hint="after-loss mode offered to everyone" />
      <Stat
        label="Counsellor sessions booked"
        value={formatNumber(data.counsellor_sessions)}
        hint={change ? `${change.text} vs previous period` : 'in selected range'}
      />
      <Stat label="Wellbeing protocol triggers" value={formatNumber(data.wellbeing_triggers)} hint="in selected range" />
    </Card>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-surface px-3.5 py-3">
      <span className="text-11 font-semibold text-ink-muted">{label}</span>
      <span className="text-22 font-extrabold">{value}</span>
      <span className="text-11 text-ink-faint">{hint}</span>
    </div>
  )
}
