import { Card, CardHeader, DataTable, ProgressBar, type Column } from '../../../../shared/ui'
import { formatNumber, formatPercent } from '../../../../shared/lib/format'
import { SEGMENT_LABEL } from '../../config/labels'
import type { RetentionData } from '../../types'

type Row = RetentionData['segments'][number]

function retentionColor(value: number): string {
  if (value >= 60) return 'var(--success)'
  if (value >= 40) return 'var(--warning)'
  return 'var(--error)'
}

function RetentionCell({ value }: { value: number | null }) {
  if (value == null) return <>—</>
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-14">
        <ProgressBar value={value} color={retentionColor(value)} height={6} />
      </span>
      {formatPercent(value, 0)}
    </span>
  )
}

const COLUMNS: Column<Row>[] = [
  { key: 'segment', header: 'SEGMENT', render: (r) => <strong>{SEGMENT_LABEL[r.key] ?? r.key}</strong> },
  { key: 'users', header: 'USERS', width: 90, render: (r) => formatNumber(r.users) },
  { key: 'w4', header: 'W4', width: 130, render: (r) => <RetentionCell value={r.w4} /> },
  { key: 'w12', header: 'W12', width: 130, render: (r) => <RetentionCell value={r.w12} /> },
  { key: 'churn', header: 'CHURN / MO', width: 90, align: 'right', render: (r) => (r.churn == null ? '—' : formatPercent(r.churn)) },
]

export function SegmentsCard({ data }: { data: RetentionData['segments'] }) {
  return (
    <Card className="min-w-0 flex-1">
      <CardHeader title="Retention by segment" subtitle="W4 and W12 active %, monthly churn" />
      <DataTable columns={COLUMNS} rows={data} rowKey={(r) => r.key} rowHeight={44} />
    </Card>
  )
}
