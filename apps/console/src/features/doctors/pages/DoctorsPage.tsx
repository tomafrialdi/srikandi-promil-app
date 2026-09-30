import { MagnifyingGlass, ProhibitInset, ArrowCounterClockwise } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { cn } from '../../../shared/lib/cn'
import { PageState, Pagination, ReasonDialog, useDisclosure, useToast } from '../../../shared/ui'
import { useUrlFilters } from '../../../shared/hooks/useUrlFilters'
import { formatNumber } from '../../../shared/lib/format'
import { DoctorCard } from '../components/DoctorCard'
import { DoctorPanel } from '../components/DoctorPanel'
import { DoctorsHeader } from '../components/DoctorsHeader'
import { DoctorsStats } from '../components/DoctorsStats'
import { GROUP_TABS, PAGE_SIZE } from '../config/labels'
import { useDoctor, useDoctorsList, useDoctorsOptions, useDoctorsSummary } from '../hooks/useDoctorsData'
import { AddDoctorModal } from '../modals/AddDoctorModal'
import { EditDoctorModal } from '../modals/EditDoctorModal'
import { VerifyQueueModal } from '../modals/VerifyQueueModal'
import { setDoctorStatus } from '../services/doctors.service'
import type { DoctorsFilters } from '../types'

type FilterKey = 'group' | 'search'
const KEYS = { group: 'group', search: 'q' } as const

export function DoctorsPage() {
  const toast = useToast()
  const { values, page, setFilter, setPage } = useUrlFilters<FilterKey>(KEYS, {})
  const filters: DoctorsFilters = values
  const summary = useDoctorsSummary()
  const options = useDoctorsOptions()
  const list = useDoctorsList(filters, page)
  const [picked, setPicked] = useState<string | null>(null)
  const rows = list.data?.rows
  const selected = rows && rows.length > 0 ? (rows.some((r) => r.id === picked) ? picked : rows[0]!.id) : null
  const doctor = useDoctor(selected)
  const add = useDisclosure()
  const verify = useDisclosure()
  const suspend = useDisclosure()
  const [editing, setEditing] = useState(false)
  const [addRun, setAddRun] = useState(0)
  const [draft, setDraft] = useState(filters.search)

  useEffect(() => {
    if (draft === filters.search) return
    const id = window.setTimeout(() => setFilter('search', draft.trim()), 300)
    return () => window.clearTimeout(id)
  }, [draft, filters.search, setFilter])

  const refresh = () => {
    summary.reload()
    list.reload()
    doctor.reload()
  }
  const d = doctor.data
  const canEdit = summary.data?.can_edit ?? false
  const suspended = d?.status === 'suspended'

  if (summary.error && !summary.data) return <PageState title="Doctors are not available" description={summary.error} />

  return (
    <>
      <DoctorsHeader canEdit={canEdit} canVerify={summary.data?.can_verify ?? false} pending={summary.data?.str_pending ?? 0} onVerify={verify.onOpen} onAdd={() => { setAddRun((n) => n + 1); add.onOpen() }} />
      <DoctorsStats data={summary.data} />

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Specialty">
          {GROUP_TABS.map((t) => {
            const on = filters.group === t.key
            const count = t.key === '' ? summary.data?.total : summary.data?.counts[t.key as keyof typeof summary.data.counts]
            return (
              <button key={t.key} type="button" role="tab" aria-selected={on} className={cn('rounded-full border px-3.5 py-2 text-13 font-semibold', on ? 'border-ink bg-ink text-white' : 'border-border bg-card text-ink')} onClick={() => setFilter('group', t.key)}>
                {t.label}{t.key === '' && count != null ? ` · ${formatNumber(count)}` : ''}
              </button>
            )
          })}
        </div>
        <label className="ml-auto flex h-9 w-64 max-w-full items-center gap-2 rounded-full border border-border bg-card px-3.5 focus-within:border-primary">
          <MagnifyingGlass size={15} color="var(--ink-faint)" />
          <input className="min-w-0 flex-1 border-0 bg-transparent text-13 outline-0 placeholder:text-ink-faint" placeholder="Search name or STR" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Search doctors" />
        </label>
      </div>

      <div className="flex flex-col items-stretch gap-4 min-[1201px]:flex-row min-[1201px]:items-start">
        <div className="flex min-w-0 flex-col gap-4 min-[1201px]:flex-1" style={{ opacity: list.loading && list.data ? 0.55 : 1, transition: 'opacity 0.15s' }}>
          {list.error && !list.data ? (
            <PageState title="Could not load doctors" description={list.error} />
          ) : rows && rows.length === 0 ? (
            <p className="py-10 text-center text-13 text-ink-muted">No doctors match these filters.</p>
          ) : (
            <div className="grid gap-4 min-[701px]:grid-cols-2 min-[1401px]:grid-cols-3">
              {(rows ?? []).map((r) => <DoctorCard key={r.id} doctor={r} selected={r.id === selected} onSelect={() => setPicked(r.id)} />)}
            </div>
          )}
          <Pagination page={page} pageSize={PAGE_SIZE} total={list.data?.total ?? 0} onChange={setPage} />
        </div>
        <div className="min-[1201px]:w-88 min-[1201px]:flex-none">
          {d && !doctor.loading ? <DoctorPanel doctor={d} canEdit={canEdit} onEdit={() => setEditing(true)} onToggleStatus={suspend.onOpen} /> : <PageState title={doctor.error ?? (selected ? 'Loading…' : 'Select a doctor')} />}
        </div>
      </div>

      {addRun > 0 && <AddDoctorModal key={addRun} open={add.open} onClose={add.onClose} options={options.data} onCreated={(id) => { setPicked(id); refresh() }} />}
      <VerifyQueueModal open={verify.open} onClose={verify.onClose} onChanged={refresh} />
      {d && editing && (
        <EditDoctorModal
          key={`${d.id}|${d.updated_at}`}
          open
          onClose={() => setEditing(false)}
          doctor={d}
          options={options.data}
          onSaved={refresh}
          onSuspend={() => { setEditing(false); suspend.onOpen() }}
        />
      )}
      <ReasonDialog
        open={suspend.open}
        onClose={suspend.onClose}
        icon={suspended ? <ArrowCounterClockwise size={20} /> : <ProhibitInset size={20} />}
        title={`${suspended ? 'Reactivate' : 'Suspend'} ${d?.name ?? 'doctor'}`}
        description={suspended ? 'The profile is listed again. This is logged.' : 'Hides the profile immediately. Existing bookings are notified. This is logged.'}
        confirmLabel={suspended ? 'Reactivate' : 'Suspend'}
        tone={suspended ? 'primary' : 'danger'}
        onConfirm={async (reason) => {
          if (!d) return
          await setDoctorStatus(d.id, suspended ? 'active' : 'suspended', reason)
          toast({ title: suspended ? 'Doctor reactivated' : 'Doctor suspended', description: d.name })
          refresh()
        }}
      />
    </>
  )
}
