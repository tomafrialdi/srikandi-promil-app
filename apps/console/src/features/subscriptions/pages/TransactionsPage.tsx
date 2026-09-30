import { useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadCsv } from '../../../shared/lib/csv'
import { useUrlFilters } from '../../../shared/hooks/useUrlFilters'
import { Button, useToast } from '../../../shared/ui'
import { logEvent } from '../../auth/services/auth.service'
import { useDateRange } from '../../analytics/hooks/useDateRange'
import { TransactionStats } from '../components/transactions/TransactionStats'
import { TransactionsTable } from '../components/transactions/TransactionsTable'
import { useTransactions, useTransactionsSummary } from '../hooks/useSubscriptionsData'
import { ReceiptModal } from '../modals/ReceiptModal'
import { fetchTransactions } from '../services/subscriptions.service'
import type { TransactionFilters } from '../types'

const KEYS = { tab: 'tab', search: 'q', channel: 'channel', plan: 'plan', promo: 'promo' }

export function TransactionsPage() {
  const toast = useToast()
  const [range, setPreset] = useDateRange()
  const { values, page, setFilter, setPage } = useUrlFilters(KEYS, { tab: 'all' })
  const filters: TransactionFilters = values
  const summary = useTransactionsSummary(range)
  const list = useTransactions(filters, range, page)
  const [invoice, setInvoice] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const refresh = () => {
    summary.reload()
    list.reload()
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const all = await fetchTransactions(filters, range, 1, 5000)
      downloadCsv(
        `srikandi-transactions-${range.from}_${range.to}.csv`,
        ['Invoice', 'User', 'Email', 'Plan', 'Channel', 'Promo', 'Amount (IDR)', 'Net (IDR)', 'Status', 'Date'],
        all.rows.map((r) => [r.invoice, r.name, r.email, r.plan, r.channel, r.promo, r.amount_idr, r.net_idr, r.status, r.at]),
      )
      void logEvent('transactions.export', 'transactions', { rows: all.rows.length }).catch(() => undefined)
      toast({ title: 'Export ready', description: `${all.rows.length} transactions exported.` })
    } catch (err) {
      toast({ tone: 'error', title: 'Export failed', description: err instanceof Error ? err.message : undefined })
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-26 font-extrabold">
            <Link to="/subscriptions" className="text-ink-muted hover:text-primary">Subscriptions</Link> / Transactions
          </h1>
          <p className="text-14 text-ink-muted">All payments across Midtrans, Google Play and App Store.</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="outline" disabled title="Reconciliation runs automatically with the payment gateway">Reconcile</Button>
          <Button onClick={exportCsv} disabled={exporting}>{exporting ? 'Exporting…' : 'Export CSV'}</Button>
        </div>
      </div>

      <TransactionStats data={summary.data} />

      <TransactionsTable
        counts={summary.data?.counts}
        list={list.data}
        loading={list.loading}
        error={list.error}
        filters={filters}
        page={page}
        range={range}
        onRange={setPreset}
        onFilter={setFilter}
        onPage={setPage}
        onOpen={setInvoice}
        onRetry={list.reload}
      />

      <ReceiptModal invoice={invoice} onClose={() => setInvoice(null)} onChanged={refresh} />
    </>
  )
}
