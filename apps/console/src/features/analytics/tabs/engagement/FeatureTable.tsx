import { Badge, Card, CardHeader, DataTable, ProgressBar, type Column } from '../../../../shared/ui'
import { formatNumber } from '../../../../shared/lib/format'
import { trendBadge } from '../../components/trend-badge'
import type { EngagementData } from '../../types'

type Row = EngagementData['features'][number]

/** Features whose "uses / user / week" is better described in words than a number. */
const USAGE_OVERRIDE: Record<string, string> = { 'Two-week wait': 'daily in 2WW' }

const COLUMNS: Column<Row>[] = [
  { key: 'feature', header: 'FEATURE', render: (r) => <strong>{r.feature}</strong> },
  { key: 'users', header: 'USERS', width: 90, render: (r) => formatNumber(r.users) },
  {
    key: 'pct',
    header: '% OF MAU',
    width: 190,
    render: (r) => (
      <span className="inline-flex w-full items-center gap-2.5">
        <span className="min-w-0 flex-1">
          <ProgressBar value={r.pct_of_mau ?? 0} color="var(--secondary)" height={8} />
        </span>
        {r.pct_of_mau ?? 0}%
      </span>
    ),
  },
  {
    key: 'uses',
    header: 'USES / USER / WK',
    width: 140,
    render: (r) => USAGE_OVERRIDE[r.feature] ?? r.uses_per_user_week ?? '—',
  },
  {
    key: 'trend',
    header: 'TREND',
    width: 100,
    render: (r) => {
      const badge = trendBadge(r.trend_pct, { unit: '%', digits: 0 })
      return badge ? <Badge tone={badge.tone}>{badge.text}</Badge> : '—'
    },
  },
  {
    key: 'plus',
    header: 'PLUS-ONLY',
    width: 100,
    render: (r) => (r.plus_only ? <Badge tone="primary">Plus</Badge> : '—'),
  },
]

export function FeatureTable({ data }: { data: EngagementData['features'] }) {
  return (
    <Card>
      <CardHeader title="Feature engagement" subtitle="Users, frequency and trend per feature (30 days)" />
      <DataTable columns={COLUMNS} rows={data} rowKey={(r) => r.feature} />
    </Card>
  )
}
