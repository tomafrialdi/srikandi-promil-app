import { Badge, Card, CardHeader, ProgressBar, type BadgeTone } from '../../../../shared/ui'
import { formatPercent } from '../../../../shared/lib/format'
import type { OverviewData } from '../../types'

const VERSION_TONE: Record<string, BadgeTone> = { latest: 'success', previous: 'neutral', legacy: 'warning' }

export function PlatformCard({ data }: { data: OverviewData['platform'] }) {
  return (
    <Card className="w-full flex-none min-[1101px]:w-90">
      <CardHeader title="Platform & version" subtitle="Active users · last 30 days" />

      <PlatformBar label="Android" pct={data.android_pct} color="var(--success)" />
      <PlatformBar label="iOS" pct={data.ios_pct} color="var(--ink)" />

      <span className="text-12 font-semibold text-ink-muted">App version adoption</span>
      {data.versions.map((version) => (
        <div key={version.key} className="flex items-center justify-between text-13 font-bold">
          <span className="text-12 font-semibold">{version.label}</span>
          <Badge tone={VERSION_TONE[version.key] ?? 'neutral'}>{formatPercent(version.pct, 0)}</Badge>
        </div>
      ))}
    </Card>
  )
}

function PlatformBar({ label, pct, color }: { label: string; pct: number | null; color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-13 font-bold">
        <span>{label}</span>
        <span>{formatPercent(pct, 0)}</span>
      </div>
      <ProgressBar value={pct ?? 0} color={color} height={10} />
    </div>
  )
}
