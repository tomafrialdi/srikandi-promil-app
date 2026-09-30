import { ArrowCounterClockwise, ProhibitInset } from '@phosphor-icons/react'
import { useState } from 'react'
import { PageState, ReasonDialog, useDisclosure, useToast } from '../../../shared/ui'
import { useUrlFilters } from '../../../shared/hooks/useUrlFilters'
import { ClinicPanel } from '../components/ClinicPanel'
import { ClinicsHeader } from '../components/ClinicsHeader'
import { ClinicsTable, type ClinicFilterKey } from '../components/ClinicsTable'
import { useClinic, useClinicsList, useClinicsSummary } from '../hooks/useClinicsData'
import { ClinicWizardModal } from '../modals/ClinicWizardModal'
import { ImportCsvModal } from '../modals/ImportCsvModal'
import { RequestDocsModal } from '../modals/RequestDocsModal'
import { approveClinic, setClinicStatus } from '../services/clinics.service'
import type { ClinicsFilters } from '../types'

const KEYS = { tab: 'tab', search: 'q', city: 'city', type: 'type', bpjs: 'bpjs' } as const

export function ClinicsPage() {
  const toast = useToast()
  const { values, page, setFilter, setPage } = useUrlFilters<ClinicFilterKey>(KEYS, { tab: 'all' })
  const filters: ClinicsFilters = values
  const summary = useClinicsSummary()
  const list = useClinicsList(filters, page)
  const [picked, setPicked] = useState<string | null>(null)
  const rows = list.data?.rows
  const selected = rows && rows.length > 0 ? (rows.some((r) => r.id === picked) ? picked : rows[0]!.id) : null
  const clinic = useClinic(selected)
  const wizard = useDisclosure()
  const importer = useDisclosure()
  const requestDocs = useDisclosure()
  const suspend = useDisclosure()
  const [wizardRun, setWizardRun] = useState(0)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = () => {
    summary.reload()
    list.reload()
    clinic.reload()
  }
  const c = clinic.data
  const canEdit = summary.data?.can_edit ?? false
  const suspended = c?.status === 'suspended'
  const openWizard = (edit: boolean) => {
    setEditing(edit)
    setWizardRun((n) => n + 1)
    wizard.onOpen()
  }

  const approve = async () => {
    if (!c) return
    setBusy(true)
    try {
      await approveClinic(c.id)
      toast({ title: 'Clinic approved', description: `${c.name} is verified and listed.` })
      refresh()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not approve', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  if (summary.error && !summary.data) return <PageState title="Clinics are not available" description={summary.error} />

  return (
    <>
      <ClinicsHeader canEdit={canEdit} onImport={importer.onOpen} onAdd={() => openWizard(false)} />
      <div className="flex flex-col items-stretch gap-4 min-[1201px]:flex-row min-[1201px]:items-start">
        <div className="min-w-0 min-[1201px]:flex-1">
          <ClinicsTable summary={summary.data} list={list.data} loading={list.loading} error={list.error} filters={filters} page={page} selected={selected} onFilter={setFilter} onPage={setPage} onSelect={setPicked} onRetry={list.reload} />
        </div>
        <div className="min-[1201px]:w-90 min-[1201px]:flex-none">
          {c && !clinic.loading ? (
            <ClinicPanel clinic={c} canEdit={canEdit} busy={busy} onEdit={() => openWizard(true)} onApprove={approve} onRequestDocs={requestDocs.onOpen} onToggleSuspend={suspend.onOpen} />
          ) : (
            <PageState title={clinic.error ?? (selected ? 'Loading…' : 'Select a clinic')} />
          )}
        </div>
      </div>

      {wizardRun > 0 && (
        <ClinicWizardModal key={wizardRun} open={wizard.open} onClose={wizard.onClose} clinic={editing ? (c ?? null) : null} onSaved={(id) => { if (id) setPicked(id); refresh() }} />
      )}
      <ImportCsvModal open={importer.open} onClose={importer.onClose} onDone={refresh} />
      {c && requestDocs.open && <RequestDocsModal key={c.id} open onClose={requestDocs.onClose} clinic={c} onDone={refresh} />}
      <ReasonDialog
        open={suspend.open}
        onClose={suspend.onClose}
        icon={suspended ? <ArrowCounterClockwise size={20} /> : <ProhibitInset size={20} />}
        title={`${suspended ? 'Reactivate' : 'Suspend'} ${c?.name ?? 'clinic'}`}
        description={suspended ? 'The clinic is listed in Find a specialist again. This is logged.' : 'Hides the clinic from Find a specialist immediately. This is logged.'}
        confirmLabel={suspended ? 'Reactivate' : 'Suspend'}
        tone={suspended ? 'primary' : 'danger'}
        onConfirm={async (reason) => {
          if (!c) return
          await setClinicStatus(c.id, suspended ? 'verified' : 'suspended', reason)
          toast({ title: suspended ? 'Clinic reactivated' : 'Clinic suspended', description: c.name })
          refresh()
        }}
      />
    </>
  )
}
