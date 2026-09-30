import { Card, CardHeader } from '../../../../shared/ui'
import { BarRow } from '../../../../shared/charts'
import { CHANNEL_COLOR, CHANNEL_SHORT_LABEL } from '../../config/labels'
import type { AcquisitionData } from '../../types'

export function CampaignsCard({ data }: { data: AcquisitionData['campaigns'] }) {
  const max = Math.max(1, ...data.map((c) => c.conversions))
  return (
    <Card className="min-w-0 flex-1">
      <CardHeader title="Top campaigns" subtitle="By paid conversions" />
      <div className="flex flex-col gap-3">
        {data.map((row) => (
          <BarRow
            key={`${row.channel}-${row.campaign}`}
            label={`${CHANNEL_SHORT_LABEL[row.channel]} · ${row.campaign}`}
            labelWidth={230}
            value={(row.conversions / max) * 100}
            color={CHANNEL_COLOR[row.channel] === '#1a1a18' ? 'var(--primary)' : CHANNEL_COLOR[row.channel]}
            barHeight={12}
            valueLabel={row.conversions}
            valueWidth={30}
          />
        ))}
        {data.length === 0 && <p className="text-13 text-ink-muted">No paid conversions in this range.</p>}
      </div>
    </Card>
  )
}
