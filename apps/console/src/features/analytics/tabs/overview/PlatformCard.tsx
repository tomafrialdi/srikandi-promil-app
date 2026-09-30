import { Badge, Card, CardHeader, ProgressBar, type BadgeTone } from '../../../../shared/ui'
import { formatPercent } from '../../../../shared/lib/format'
import type { OverviewData } from '../../types'
import styles from './OverviewTab.module.css'

const VERSION_TONE: Record<string, BadgeTone> = { latest: 'success', previous: 'neutral', legacy: 'warning' }

export function PlatformCard({ data }: { data: OverviewData['platform'] }) {
  return (
    <Card className={styles.platform}>
      <CardHeader title="Platform & version" subtitle="Active users · last 30 days" />

      <PlatformBar label="Android" pct={data.android_pct} color="var(--success)" />
      <PlatformBar label="iOS" pct={data.ios_pct} color="var(--ink)" />

      <span className={styles.subHeading}>App version adoption</span>
      {data.versions.map((version) => (
        <div key={version.key} className={styles.versionRow}>
          <span className={styles.versionLabel}>{version.label}</span>
          <Badge tone={VERSION_TONE[version.key] ?? 'neutral'}>{formatPercent(version.pct, 0)}</Badge>
        </div>
      ))}
    </Card>
  )
}

function PlatformBar({ label, pct, color }: { label: string; pct: number | null; color: string }) {
  return (
    <div className={styles.platformBar}>
      <div className={styles.platformBarRow}>
        <span>{label}</span>
        <span>{formatPercent(pct, 0)}</span>
      </div>
      <ProgressBar value={pct ?? 0} color={color} height={10} />
    </div>
  )
}
