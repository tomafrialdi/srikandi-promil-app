import { DotsThree } from '@phosphor-icons/react'
import { Badge, Card, CountTabs, DataTable, ProgressBar, type Column } from '../../../../shared/ui'
import { PROMO_STATUS } from '../../config/labels'
import type { PromoRow, PromosSummary } from '../../types'
import styles from './promos.module.css'

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
  { key: 'code', header: 'CODE', width: 130, render: (r) => <span className={styles.codeChip}>{r.code}</span> },
  {
    key: 'offer',
    header: 'OFFER',
    render: (r) => (
      <span className={styles.offerCell}>
        <span className={styles.offerMain}>{r.offer}</span>
        <span className={styles.offerSub}>{r.sub ?? '—'}</span>
      </span>
    ),
  },
  {
    key: 'usage',
    header: 'USAGE',
    width: 120,
    render: (r) => (
      <span className={styles.usageCell}>
        <span className={styles.usageText}>{r.max ? `${r.used} / ${r.max}` : `${r.used} · ∞`}</span>
        {r.max ? <ProgressBar value={(r.used / r.max) * 100} height={5} /> : null}
      </span>
    ),
  },
  { key: 'valid', header: 'VALID', width: 110, render: (r) => <span className={styles.muted}>{r.valid}</span> },
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
    <Card className={styles.table}>
      <CountTabs tabs={tabs} active={tab} onChange={onTab} />
      <div style={{ opacity: loading && rows ? 0.55 : 1, transition: 'opacity 0.15s' }}>
        {rows && rows.length === 0 ? (
          <p className={styles.state}>No promo codes here.</p>
        ) : (
          <DataTable columns={COLUMNS} rows={rows ?? []} rowKey={(r) => r.code} rowHeight={56} isRowSelected={(r) => r.code === selected} onRowClick={(r) => onSelect(r.code)} />
        )}
      </div>
    </Card>
  )
}
