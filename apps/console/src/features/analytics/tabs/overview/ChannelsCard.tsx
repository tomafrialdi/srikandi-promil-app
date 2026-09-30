import { Card, CardHeader } from '../../../../shared/ui'
import { BarRow } from '../../../../shared/charts'
import { formatIdr, formatNumber } from '../../../../shared/lib/format'
import { CHANNEL_COLOR, CHANNEL_LABEL } from '../../config/labels'
import type { OverviewData } from '../../types'

export function ChannelsCard({ data }: { data: OverviewData['channels'] }) {
  const max = Math.max(1, ...data.map((c) => c.new_users))
  return (
    <Card className="min-w-0 flex-1">
      <CardHeader title="Acquisition channels" subtitle="New users · selected range · CAC per paying user" />
      <div className="flex flex-col gap-3.5">
        {data.map((row) => (
          <BarRow
            key={row.channel}
            label={CHANNEL_LABEL[row.channel]}
            labelWidth={170}
            value={(row.new_users / max) * 100}
            color={CHANNEL_COLOR[row.channel]}
            barHeight={12}
            valueLabel={formatNumber(row.new_users)}
            valueWidth={50}
            extra={formatIdr(row.cac_idr ?? 0)}
            extraWidth={84}
          />
        ))}
      </div>
    </Card>
  )
}
