import { Badge, Card, CardHeader, DataTable, ProgressBar, type Column } from '../../../../shared/ui'
import { formatNumber } from '../../../../shared/lib/format'
import { featureIcon } from './feature-icons'
import { trendBadge } from '../../components/trend-badge'
import type { EngagementData } from '../../types'

type Row = EngagementData['features'][number]

/** Features whose "uses / user / week" is better described in words than a number. */
const USAGE_OVERRIDE: Record<string, string> = { 'Two-week wait': 'daily in 2WW' }

const dash = <span className="text-12 font-medium text-ink-faint">—</span>

const COLUMNS: Column<Row>[] = [
  {
    key: 'feature',
    header: 'FEATURE',
    render: (r) => {
      const Glyph = featureIcon(r.feature)
      return (
        <span className="inline-flex min-w-0 items-center gap-2.5">
          <span className="inline-flex size-7 flex-none items-center justify-center rounded-lg bg-surface-alt text-ink-muted">
            <Glyph size={14} />
          </span>
          <span className="truncate text-13 font-bold">{r.feature}</span>
        </span>
      )
    },
  },
  { key: 'users', header: 'USERS', width: 110, render: (r) => <span className="text-12 font-semibold">{formatNumber(r.users)}</span> },
  {
    key: 'pct',
    header: '% OF MAU',
    width: 150,
    render: (r) => (
      <span className="inline-flex items-center gap-2.5">
        <span className="w-[90px] flex-none">
          <ProgressBar value={r.pct_of_mau ?? 0} color="var(--secondary)" height={8} radius={100} />
        </span>
        <span className="text-12 font-bold">{r.pct_of_mau ?? 0}%</span>
      </span>
    ),
  },
  {
    key: 'uses',
    header: 'USES / USER / WK',
    width: 130,
    render: (r) => {
      const text = USAGE_OVERRIDE[r.feature] ?? r.uses_per_user_week
      return text != null && text !== '' ? <span className="text-12 font-medium text-ink-muted">{text}</span> : dash
    },
  },
  {
    key: 'trend',
    header: 'TREND',
    width: 120,
    render: (r) => {
      const badge = trendBadge(r.trend_pct, { unit: '%', digits: 0 })
      return badge ? <Badge tone={badge.tone}>{badge.text}</Badge> : dash
    },
  },
  { key: 'plus', header: 'PLUS-ONLY', width: 90, render: (r) => (r.plus_only ? <Badge tone="primary">Plus</Badge> : dash) },
]

export function FeatureTable({ data }: { data: EngagementData['features'] }) {
  return (
    <Card>
      <CardHeader title="Feature engagement" subtitle="Users, frequency and trend per feature (30 days)" />
      <DataTable columns={COLUMNS} rows={data} rowKey={(r) => r.feature} rowHeight={48} />
    </Card>
  )
}
