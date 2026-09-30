import { DotsThree } from '@phosphor-icons/react'
import { Badge, Card, CountTabs, DataTable, ProgressBar, type Column } from '../../../../shared/ui'
import { PROMO_STATUS } from '../../config/labels'
import type { PromoRow, PromosSummary } from '../../types'

interface PromoTableProps {
  counts?: PromosSummary['counts']
  rows?: PromoRow[]
  loading: boolean
  tab: string
  selected: string | null
  onTab: (tab: string) => void
  onSelect: (code: string) => void
}

const COLUMNS: Column<PromoRow>[] = [
  { key: 'code', header: 'CODE', width: 130, render: (r) => <span className="inline-block rounded-md bg-surface-alt px-2 py-[3px] text-11 font-extrabold tracking-[0.02em]">{r.code}</span> },
  {
    key: 'offer',
    header: 'OFFER',
    render: (r) => (
      <span className="flex min-w-0 flex-col">
        <span className="text-12 font-semibold">{r.offer}</span>
        <span className="text-11 font-medium text-ink-muted">{r.sub ?? '—'}</span>
      </span>
    ),
  },
  {
    key: 'usage',
    header: 'USAGE',
    width: 120,
    render: (r) => (
      <span className="flex w-full flex-col gap-1">
        <span className="text-12 font-bold">{r.max ? `${r.used} / ${r.max}` : `${r.used} · ∞`}</span>
        {r.max ? <ProgressBar value={(r.used / r.max) * 100} height={5} /> : null}
      </span>
    ),
  },
  { key: 'valid', header: 'VALID', width: 110, render: (r) => <span className="text-12 text-ink-muted">{r.valid}</span> },
  { key: 'status', header: 'STATUS', width: 110, render: (r) => <Badge tone={PROMO_STATUS[r.status].tone}>{PROMO_STATUS[r.status].label}</Badge> },
  { key: 'menu', header: '', width: 24, render: () => <DotsThree size={18} weight="bold" color="var(--ink-muted)" /> },
]

export function PromoTable({ counts, rows, loading, tab, selected, onTab, onSelect }: PromoTableProps) {
  const tabs = [
    { key: 'all', label: 'All', count: counts?.all },
    { key: 'active', label: 'Active', count: counts?.active },
    { key: 'scheduled', label: 'Scheduled', count: counts?.scheduled },
    { key: 'paused', label: 'Paused', count: counts?.paused },
    { key: 'expired', label: 'Expired', count: counts?.expired },
  ]
  return (
    <Card className="w-full min-w-0 flex-1">
      <CountTabs tabs={tabs} active={tab} onChange={onTab} />
      <div style={{ opacity: loading && rows ? 0.55 : 1, transition: 'opacity 0.15s' }}>
        {rows && rows.length === 0 ? (
          <p className="py-8 text-center text-13 text-ink-muted">No promo codes here.</p>
        ) : (
          <DataTable columns={COLUMNS} rows={rows ?? []} rowKey={(r) => r.code} rowHeight={56} isRowSelected={(r) => r.code === selected} onRowClick={(r) => onSelect(r.code)} />
        )}
      </div>
    </Card>
  )
}
