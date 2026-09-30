import { Card, CardHeader } from '../../../shared/ui'
import { BarRow } from '../../../shared/charts'
import type { FeatureAdoption } from '../types'

export function FeatureAdoptionCard({ data }: { data: FeatureAdoption[] }) {
  return (
    <Card className="min-w-0 flex-1">
      <CardHeader title="Feature adoption" subtitle="% of MAU using each feature" />
      {data.map((row) => (
        <BarRow key={row.feature} label={row.feature} labelWidth={130} value={row.pct} color="var(--secondary)" barHeight={10} valueLabel={`${row.pct}%`} valueWidth={34} />
      ))}
      {data.length === 0 && <p className="text-13 text-ink-muted">No feature usage in the last 30 days.</p>}
    </Card>
  )
}
