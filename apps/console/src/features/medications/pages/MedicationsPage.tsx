import { useState } from 'react'
import { PageState, useDisclosure } from '../../../shared/ui'
import { useUrlFilters } from '../../../shared/hooks/useUrlFilters'
import { CatalogueCard, type MedFilterKey } from '../components/CatalogueCard'
import { MedicationPanel } from '../components/MedicationPanel'
import { MedicationsHeader } from '../components/MedicationsHeader'
import { MedicationsStats } from '../components/MedicationsStats'
import { useMed, useMedsList, useMedsOptions, useMedsSummary } from '../hooks/useMedicationsData'
import { AddMedicationModal } from '../modals/AddMedicationModal'
import type { MedsFilters } from '../types'

const KEYS = { tab: 'tab', search: 'q', type: 'type', rx: 'rx' } as const

export function MedicationsPage() {
  const { values, page, setFilter, setPage } = useUrlFilters<MedFilterKey>(KEYS, { tab: 'all' })
  const filters: MedsFilters = values
  const summary = useMedsSummary()
  const options = useMedsOptions()
  const list = useMedsList(filters, page)
  const [picked, setPicked] = useState<string | null>(null)
  const rows = list.data?.rows
  const selected = rows && rows.length > 0 ? (rows.some((r) => r.id === picked) ? picked : rows[0]!.id) : null
  const med = useMed(selected)
  const modal = useDisclosure()
  const [editAll, setEditAll] = useState(false)
  const [run, setRun] = useState(0)

  const refresh = () => {
    summary.reload()
    list.reload()
    med.reload()
  }
  const openModal = (edit: boolean) => {
    setEditAll(edit)
    setRun((n) => n + 1)
    modal.onOpen()
  }
  const canEdit = summary.data?.can_edit ?? false

  if (summary.error && !summary.data) return <PageState title="Medications are not available" description={summary.error} />

  return (
    <>
      <MedicationsHeader canEdit={canEdit} onAdd={() => openModal(false)} />
      <MedicationsStats data={summary.data} />
      <div className="flex flex-col items-stretch gap-4 min-[1201px]:flex-row min-[1201px]:items-start">
        <div className="min-w-0 min-[1201px]:flex-1">
          <CatalogueCard summary={summary.data} list={list.data} loading={list.loading} error={list.error} filters={filters} page={page} selected={selected} onFilter={setFilter} onPage={setPage} onSelect={setPicked} onRetry={list.reload} />
        </div>
        <div className="min-[1201px]:w-100 min-[1201px]:flex-none">
          {med.data && !med.loading ? (
            <MedicationPanel key={`${med.data.id}|${med.data.status}|${med.data.reviewed_at}|${med.data.revision ? 'r' : ''}|${med.data.review_note ?? ''}`} med={med.data} me={summary.data?.me ?? ''} canEdit={canEdit} onSaved={refresh} onEditAll={() => openModal(true)} />
          ) : (
            <PageState title={med.error ?? (selected ? 'Loading…' : 'Select a medication')} />
          )}
        </div>
      </div>
      {run > 0 && (
        <AddMedicationModal key={run} open={modal.open} onClose={modal.onClose} med={editAll ? (med.data ?? null) : null} options={options.data} onSaved={(id) => { setPicked(id); refresh() }} />
      )}
    </>
  )
}
