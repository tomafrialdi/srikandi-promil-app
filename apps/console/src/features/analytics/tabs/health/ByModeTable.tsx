import { Card, CardHeader, DataTable, ProgressBar, type Column } from '../../../../shared/ui'
import { formatNumber } from '../../../../shared/lib/format'
import type { HealthData } from '../../types'

type Row = HealthData['by_mode'][number]

const MODE_COLOR: Record<string, string> = {
  ttc: '#c13d68',
  pcos: '#e0a030',
  iui: '#2574c4',
  ivf: '#8e6fbf',
  after_loss: '#a6a49b',
}

const pct = (value: number | null) => (value == null ? '—' : `${value}%`)

const COLUMNS: Column<Row>[] = [
  {
    key: 'mode',
    header: 'MODE',
    render: (r) => (
      <strong className="inline-flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: MODE_COLOR[r.mode] }} />
        {r.label}
      </strong>
    ),
  },
  { key: 'users', header: 'USERS', width: 100, render: (r) => formatNumber(r.users) },
  {
    key: 'conceived',
    header: 'CONCEIVED',
    width: 190,
    render: (r) => (
      <span className="inline-flex w-full items-center gap-2.5">
        <span className="min-w-0 flex-1">
          <ProgressBar value={r.conceived_pct ?? 0} color="var(--success)" height={8} />
        </span>
        {pct(r.conceived_pct)}
      </span>
    ),
  },
  { key: 'median', header: 'MEDIAN CYCLES', width: 130, render: (r) => r.median_cycles ?? '—' },
  { key: 'ovulation', header: 'OVULATION CONFIRMED', width: 160, render: (r) => pct(r.ovulation_confirmed_pct) },
  { key: 'referred', header: 'REFERRED', width: 100, render: (r) => pct(r.referred_pct) },
]

export function ByModeTable({ data }: { data: HealthData['by_mode'] }) {
  return (
    <Card>
      <CardHeader title="Outcomes by tracking mode" subtitle="Users who tracked ≥ 3 cycles" />
      <DataTable columns={COLUMNS} rows={data} rowKey={(r) => r.mode} rowHeight={50} />
    </Card>
  )
}
