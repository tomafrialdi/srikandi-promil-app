import { MagnifyingGlass, Receipt } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Badge, Card, CountTabs, DataTable, Pagination, SelectField, type Column } from '../../../../shared/ui'
import { formatIdr } from '../../../../shared/lib/format'
import { PLAN_LABEL } from '../../../../shared/lib/labels'
import { DateRangeMenu } from '../../../analytics/components/DateRangeMenu'
import type { DateRange, RangePresetKey } from '../../../analytics/config/date-range'
import { CHANNEL_FILTER_OPTIONS, CHANNEL_LABEL, PLAN_FILTER_OPTIONS, PROMO_FILTER_OPTIONS, TX_PAGE_SIZE, TX_STATUS } from '../../config/labels'
import type { TransactionFilters, TransactionRow, TransactionsList, TransactionsSummary } from '../../types'

const dateTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })

type FilterKey = keyof TransactionFilters

interface TransactionsTableProps {
  counts?: TransactionsSummary['counts']
  list?: TransactionsList
  loading: boolean
  error?: string
  filters: TransactionFilters
  page: number
  range: DateRange
  onRange: (preset: RangePresetKey) => void
  onFilter: (key: FilterKey, value: string) => void
  onPage: (page: number) => void
  onOpen: (invoice: string) => void
  onRetry: () => void
}

export function TransactionsTable(props: TransactionsTableProps) {
  const { counts, list, loading, error, filters, page, range } = props
  const [draft, setDraft] = useState(filters.search)

  useEffect(() => {
    if (draft === filters.search) return
    const id = window.setTimeout(() => props.onFilter('search', draft.trim()), 300)
    return () => window.clearTimeout(id)
  }, [draft, filters.search, props])

  const columns: Column<TransactionRow>[] = [
    { key: 'invoice', header: 'INVOICE', width: 118, render: (r) => <span className="text-11 font-bold">{r.invoice}</span> },
    {
      key: 'user',
      header: 'USER',
      render: (r) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-13 font-bold">{r.name}</span>
          <span className="truncate text-11 font-medium text-ink-muted">{r.email}</span>
        </span>
      ),
    },
    { key: 'plan', header: 'PLAN', width: 92, render: (r) => <span className="text-12 font-semibold">{PLAN_LABEL[r.plan]}</span> },
    { key: 'channel', header: 'CHANNEL', width: 84, render: (r) => <span className="text-12 font-semibold">{CHANNEL_LABEL[r.channel]}</span> },
    { key: 'promo', header: 'PROMO', width: 92, render: (r) => (r.promo ? <span className="inline-block rounded-md bg-surface-alt px-1.5 py-0.5 text-10 font-extrabold">{r.promo}</span> : <span className="text-12 font-medium text-ink-muted">—</span>) },
    { key: 'amount', header: 'AMOUNT', width: 88, render: (r) => <span className="text-13 font-bold">{formatIdr(r.amount_idr)}</span> },
    { key: 'net', header: 'NET', width: 80, render: (r) => <span className="text-12 font-medium text-ink-muted">{r.net_idr > 0 ? formatIdr(r.net_idr) : '—'}</span> },
    {
      key: 'status',
      header: 'STATUS',
      width: 124,
      render: (r) => (
        <Badge tone={TX_STATUS[r.status].tone}>{r.status === 'failed' ? `Failed · retry ${r.retry}/3` : TX_STATUS[r.status].label}</Badge>
      ),
    },
    { key: 'date', header: 'DATE', width: 92, render: (r) => <span className="text-12 font-medium text-ink-muted">{dateTime.format(new Date(r.at))}</span> },
    { key: 'receipt', header: '', width: 16, render: () => <Receipt size={16} color="var(--ink-muted)" /> },
  ]

  const tabs = [
    { key: 'all', label: 'All', count: counts?.all },
    { key: 'paid', label: 'Paid', count: counts?.paid },
    { key: 'pending', label: 'Pending', count: counts?.pending },
    { key: 'failed', label: 'Failed', count: counts?.failed },
    { key: 'refunded', label: 'Refunded', count: counts?.refunded },
  ]

  return (
    <Card className="gap-3.5">
      <CountTabs tabs={tabs} active={filters.tab} onChange={(key) => props.onFilter('tab', key)} />

      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex h-9 w-75 max-w-full items-center gap-2 rounded-lg bg-surface px-3 focus-within:outline focus-within:outline-primary">
          <MagnifyingGlass size={15} color="var(--ink-faint)" />
          <input className="min-w-0 flex-1 border-0 bg-transparent text-13 outline-0 placeholder:text-ink-faint" placeholder="Invoice, user, email or order ID" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Search transactions" />
        </label>
        <DateRangeMenu range={range} onChange={props.onRange} />
        <SelectField variant="pill" aria-label="Channel" value={filters.channel} options={CHANNEL_FILTER_OPTIONS} onChange={(v) => props.onFilter('channel', v)} />
        <SelectField variant="pill" aria-label="Plan" value={filters.plan} options={PLAN_FILTER_OPTIONS} onChange={(v) => props.onFilter('plan', v)} />
        <SelectField variant="pill" aria-label="Promo" value={filters.promo} options={PROMO_FILTER_OPTIONS} onChange={(v) => props.onFilter('promo', v)} />
      </div>

      <div style={{ opacity: loading && list ? 0.55 : 1, transition: 'opacity 0.15s' }}>
        {error && !list ? (
          <p className="py-8 text-center text-13 text-ink-muted">{error} <button type="button" onClick={props.onRetry} style={{ fontWeight: 700, color: 'var(--primary)' }}>Try again</button></p>
        ) : list && list.rows.length === 0 ? (
          <p className="py-8 text-center text-13 text-ink-muted">No transactions match these filters.</p>
        ) : (
          <DataTable columns={columns} rows={list?.rows ?? []} rowKey={(r) => r.invoice} rowHeight={56} onRowClick={(r) => props.onOpen(r.invoice)} />
        )}
      </div>

      <Pagination page={page} pageSize={TX_PAGE_SIZE} total={list?.total ?? 0} onChange={props.onPage} />
    </Card>
  )
}
