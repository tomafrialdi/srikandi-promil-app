import { FileText, FileX, MagnifyingGlass, ShieldCheck, UploadSimple, X } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Badge, Button, Notice, SelectField, ModalSection, useToast } from '../../../../shared/ui'
import { DOCS, DOC_OPTIONS, DOC_ORDER, DOCTOR_ROLES, DOC_STATUS } from '../../config/labels'
import { linkDoctor, searchDoctors, setDocument, unlinkDoctor } from '../../services/clinics.service'
import type { ClinicFull, ClinicRole, DoctorHit } from '../../types'

interface DoctorsStepProps {
  clinicId: string | null
  clinic: ClinicFull | undefined
  onChanged: () => void
}

export function DoctorsStep({ clinicId, clinic, onChanged }: DoctorsStepProps) {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<DoctorHit[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!clinicId || q.trim().length < 2) return
    let cancelled = false
    const id = window.setTimeout(() => {
      searchDoctors(clinicId, q).then((r) => !cancelled && setHits(r)).catch(() => !cancelled && setHits([]))
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [q, clinicId, clinic?.linked.length])

  const run = async (task: () => Promise<void>, failure: string) => {
    setBusy(true)
    try {
      await task()
      onChanged()
    } catch (err) {
      toast({ tone: 'error', title: failure, description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  if (!clinicId || !clinic) return <Notice icon={<ShieldCheck size={16} />}>Saving the clinic first… go back one step if this stays empty.</Notice>
  const docs = clinic.documents.filter((d) => DOC_ORDER.includes(d.kind) && (clinic.type === 'fertility' || (d.kind !== 'kfer_cert' && (d.kind !== 'art_licence' || d.status !== 'missing'))))

  return (
    <>
      <ModalSection label="Doctors at this clinic" action={<Link to="/doctors" className="text-12 font-bold text-primary">+ Invite new doctor</Link>}>
        <label className="flex h-10 items-center gap-2 rounded-[10px] border border-border bg-card px-3.5 focus-within:border-primary">
          <input className="min-w-0 flex-1 border-0 bg-transparent text-13 font-semibold outline-0 placeholder:text-ink-faint" placeholder="Search doctors by name or STR…" aria-label="Search doctors" value={q} onChange={(e) => { setQ(e.target.value); if (e.target.value.trim().length < 2) setHits([]) }} />
          <MagnifyingGlass size={15} className="text-ink-faint" />
        </label>
        {q.trim().length >= 2 && hits.length > 0 && (
          <ul className="m-0 flex list-none flex-col rounded-xl border border-border p-0">
            {hits.map((h) => (
              <li key={h.id} className="flex items-center gap-3 border-b border-border px-3.5 py-2.5 last:border-b-0">
                <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-13 font-bold">{h.name}</span><span className="text-11 font-medium text-ink-muted">{h.specialty}{h.years != null ? ` · ${h.years} yrs` : ''}</span></span>
                <Badge tone={h.str_status === 'verified' ? 'success' : 'warning'}>{h.str_status === 'verified' ? 'STR verified' : 'STR pending'}</Badge>
                <Button variant="outline" disabled={busy} onClick={() => run(async () => { await linkDoctor(clinicId, h.id, 'doctor'); setQ(''); setHits([]) }, 'Could not link the doctor')}>Add</Button>
              </li>
            ))}
          </ul>
        )}
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {clinic.linked.length === 0 && <li className="rounded-xl bg-surface px-3.5 py-4 text-center text-12 text-ink-muted">No doctors linked yet.</li>}
          {clinic.linked.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
              <Avatar label={d.name.replace(/^(dr\.|Bdn\.)\s*/i, '').charAt(0).toUpperCase()} size={38} />
              <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-13 font-bold">{d.name}</span><span className="truncate text-11 text-ink-muted">{d.specialty}{d.years != null ? ` · ${d.years} yrs` : ''}</span></span>
              <Badge tone={d.str_status === 'verified' ? 'success' : 'warning'}>{d.str_status === 'verified' ? 'STR verified' : 'STR pending'}</Badge>
              <div className="w-40"><SelectField variant="pill" triggerClassName="h-6 rounded-lg text-11 font-bold" aria-label={`Role of ${d.name}`} value={d.role} options={DOCTOR_ROLES} onChange={(role) => run(() => linkDoctor(clinicId, d.id, role as ClinicRole), 'Could not change the role')} /></div>
              <button type="button" aria-label={`Remove ${d.name}`} disabled={busy} className="inline-flex text-ink-faint hover:text-error" onClick={() => run(() => unlinkDoctor(clinicId, d.id), 'Could not remove the doctor')}><X size={15} /></button>
            </li>
          ))}
        </ul>
      </ModalSection>

      <ModalSection label="Licences & documents">
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {docs.map((d) => {
            const look = DOC_STATUS[d.status]
            return (
              <li key={d.kind} className="grid items-center gap-3 rounded-xl border border-border px-3.5 py-3 min-[701px]:grid-cols-[minmax(0,1fr)_170px_100px]">
                <span className="flex min-w-0 items-center gap-3">
                  <span className={`inline-flex size-[34px] flex-none items-center justify-center rounded-[9px] ${d.status === 'missing' ? 'bg-error-soft text-error' : d.status === 'verified' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning-ink'}`}>{d.status === 'missing' ? <FileX size={16} /> : <FileText size={16} />}</span>
                  <span className="flex min-w-0 flex-col"><span className="text-13 font-bold">{DOCS[d.kind].label}</span><span className="truncate text-11 font-medium text-ink-muted">{d.file_name ?? '—'}</span></span>
                </span>
                <SelectField variant="pill" triggerClassName="h-8 rounded-lg" aria-label={`${DOCS[d.kind].short} status`} value={d.status} options={DOC_OPTIONS} onChange={(status) => run(() => setDocument(clinicId, d.kind, status, d.file_name ?? `${d.kind}_2026.pdf`), 'Could not update the document')} />
                <span className="flex items-center justify-end gap-2"><Badge tone={look.tone}>{look.label}</Badge></span>
              </li>
            )
          })}
        </ul>
        <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-[10px] bg-secondary-soft px-3.5 py-3 text-12 font-semibold text-secondary">
          <ShieldCheck size={16} className="flex-none" />
          <span className="min-w-0 flex-1">Documents are checked against Dinkes &amp; KKI registries. Stored encrypted; visible only to verification team.</span>
          <Button variant="outline" disabled title="Encrypted file storage is not set up yet — set the status after checking the file">
            <UploadSimple size={14} /> Upload
          </Button>
        </div>
      </ModalSection>
    </>
  )
}
