import { useMemo, useState } from 'react'
import { PageState, useDisclosure, useToast } from '../../../shared/ui'
import { useUrlFilters } from '../../../shared/hooks/useUrlFilters'
import { AlertStrip } from '../components/AlertStrip'
import { AuditHeader } from '../components/AuditHeader'
import { AuditStats } from '../components/AuditStats'
import { DsrCard } from '../components/DsrCard'
import { EventsCard } from '../components/EventsCard'
import { RetentionCard } from '../components/RetentionCard'
import { useAuditList, useAuditSummary, usePdpList } from '../hooks/useAuditData'
import { AlertModal } from '../modals/AlertModal'
import { DsrModal } from '../modals/DsrModal'
import { EventModal } from '../modals/EventModal'
import { ExportModal } from '../modals/ExportModal'
import { ViewsModal } from '../modals/ViewsModal'
import { verifyChain } from '../services/audit.service'
import type { Range, ViewFilters } from '../types'

const KEYS = { category: 'cat', risk: 'risk', search: 'q', range: 'range' } as const
type FilterKey = keyof typeof KEYS

export function AuditLogPage() {
  const toast = useToast()
  const { values, page, setFilter, setPage } = useUrlFilters<FilterKey>(KEYS, { range: '24h' })
  const filters = useMemo<ViewFilters>(() => ({ category: values.category, risk: values.risk, search: values.search, range: (values.range || '24h') as Range }), [values.category, values.risk, values.search, values.range])
  const summary = useAuditSummary()
  const list = useAuditList(filters, page)
  const pdp = usePdpList()

  const [eventId, setEventId] = useState<number | null>(null)
  const [alertId, setAlertId] = useState<string | null>(null)
  const [dsrId, setDsrId] = useState<string | null>(null)
  const eventModal = useDisclosure()
  const alertModal = useDisclosure()
  const dsrModal = useDisclosure()
  const exportModal = useDisclosure()
  const viewsModal = useDisclosure()
  const [exportRun, setExportRun] = useState(0)
  const [viewsRun, setViewsRun] = useState(0)
  const [verifying, setVerifying] = useState(false)

  const refresh = () => {
    summary.reload()
    list.reload()
    pdp.reload()
  }

  const verify = async () => {
    setVerifying(true)
    try {
      const r = await verifyChain()
      toast(r.ok ? { title: 'Hash chain verified', description: `${r.rows.toLocaleString('en-US')} events, no gaps or edits` } : { title: 'Hash chain is broken', description: `First mismatch at event #${r.broken_at}` })
      summary.reload()
    } catch (err) {
      toast({ title: 'Verification failed', description: err instanceof Error ? err.message : 'Try again.' })
    } finally {
      setVerifying(false)
    }
  }

  const applyView = (f: ViewFilters) => {
    setFilter('category', f.category ?? '')
    setFilter('risk', f.risk ?? '')
    setFilter('search', f.search ?? '')
    setFilter('range', f.range ?? '24h')
  }

  if (summary.error && !summary.data) return <PageState title="The audit log is not available" description={summary.error} />
  const canAct = summary.data?.can_act ?? false

  return (
    <>
      <AuditHeader canExport={summary.data?.can_export ?? false} onViews={() => { setViewsRun((n) => n + 1); viewsModal.onOpen() }} onExport={() => { setExportRun((n) => n + 1); exportModal.onOpen() }} />
      <AuditStats data={summary.data} verifying={verifying} onVerify={verify} />
      <AlertStrip data={summary.data} onAlert={(id) => { setAlertId(id); alertModal.onOpen() }} onDsr={(id) => { setDsrId(id); dsrModal.onOpen() }} />
      <EventsCard
        filters={filters}
        list={list.data}
        loading={list.loading}
        error={list.error}
        page={page}
        verified={summary.data?.chain?.ok ?? null}
        onFilter={setFilter}
        onPage={setPage}
        onOpen={(id) => { setEventId(id); eventModal.onOpen() }}
        onSaveView={() => { setViewsRun((n) => n + 1); viewsModal.onOpen() }}
        onRetry={list.reload}
      />
      <div className="flex flex-col gap-4 min-[1101px]:flex-row min-[1101px]:items-start">
        <DsrCard data={pdp.data} onOpen={(id) => { setDsrId(id); dsrModal.onOpen() }} />
        <RetentionCard summary={summary.data} />
      </div>

      <EventModal id={eventId} open={eventModal.open} onClose={eventModal.onClose} summary={summary.data} onChanged={refresh} />
      <AlertModal id={alertId} open={alertModal.open} onClose={alertModal.onClose} canAct={canAct} onChanged={refresh} />
      <DsrModal id={dsrId} open={dsrModal.open} onClose={dsrModal.onClose} canAct={canAct} onChanged={refresh} />
      {exportRun > 0 && <ExportModal key={exportRun} open={exportModal.open} onClose={exportModal.onClose} category={filters.category ?? ''} range={filters.range ?? '24h'} onDone={refresh} />}
      {viewsRun > 0 && <ViewsModal key={viewsRun} open={viewsModal.open} onClose={viewsModal.onClose} current={filters} onApply={applyView} />}
    </>
  )
}
