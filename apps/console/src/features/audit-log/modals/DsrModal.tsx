import { Certificate, Envelope, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Badge, Button, ConfirmDialog, Modal, ModalFooter, ModalSection, Notice, PageState, SelectField, useDisclosure, useToast } from '../../../shared/ui'
import { DSR_STATUS, DSR_TYPE, SYSTEM_STATES } from '../config/labels'
import { usePdp } from '../hooks/useAuditData'
import { InfoGrid, Timeline } from '../components/InfoGrid'
import { dayMonth, dayTime, daysLeft } from '../lib/format'
import { issueCertificate, updatePdp } from '../services/audit.service'
import type { SystemState } from '../types'

interface DsrModalProps {
  id: string | null
  open: boolean
  onClose: () => void
  canAct: boolean
  onChanged: () => void
}

const STATUS_OPTIONS = Object.entries(DSR_STATUS).map(([value, s]) => ({ value, label: s.label }))

export function DsrModal({ id, open, onClose, canAct, onChanged }: DsrModalProps) {
  const toast = useToast()
  const { data: r, error, reload } = usePdp(id)
  const cert = useDisclosure()
  const [fail, setFail] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const patch = async (p: Record<string, unknown>) => {
    if (!r) return
    setBusy(true)
    setFail(null)
    try {
      await updatePdp(r.id, p)
      reload()
      onChanged()
    } catch (err) {
      setFail(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  const left = r ? daysLeft(r.due_at) : 0
  const used = Math.min(100, Math.max(0, ((30 - Math.max(0, left)) / 30) * 100))
  const open30 = r && r.status !== 'completed'
  const type = r ? DSR_TYPE[r.type] : ''
  const status = r ? DSR_STATUS[r.status] : null
  const number = r ? `DSR-${String(r.number).padStart(4, '0')}` : ''

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        icon={<Certificate size={20} />}
        title={r ? `${type} request · ${number}` : 'Data subject request'}
        subtitle={r ? `${r.subject_ref} · received ${dayTime(r.received_at)} · UU PDP` : undefined}
        headerActions={status && <Badge tone={status.tone}>{status.label}</Badge>}
        footer={
          <ModalFooter info={r ? `Owner: ${r.owner ?? 'unassigned'}${r.certificate_at ? ` · certificate issued ${dayMonth(r.certificate_at)}` : ''}` : ''}>
            {r?.email && <a className="inline-flex items-center gap-2 rounded-control border border-border bg-card px-3.5 py-[9px] text-13 font-bold text-ink" href={`mailto:${r.email}?subject=${encodeURIComponent(`Your data request ${number}`)}`}><Envelope size={15} /> Email user</a>}
            {canAct && r?.type === 'deletion' && !r.certificate_at && <Button onClick={cert.onOpen} disabled={busy} leadingIcon={<Certificate size={15} color="#fff" />}>Generate certificate</Button>}
          </ModalFooter>
        }
      >
        {!r ? (
          <PageState title={error ?? 'Loading request…'} />
        ) : (
          <>
            {fail && <Notice tone="error" icon={<Warning size={16} />}>{fail}</Notice>}
            <section className="flex flex-col gap-2 rounded-xl bg-surface px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-13 font-extrabold">Legal deadline · {dayMonth(r.due_at)} {new Date(r.due_at).getFullYear()}</h3>
                <span className="text-12 font-bold text-ink-muted">{open30 ? (left > 0 ? `${left} of 30 days left` : 'deadline passed') : 'closed'}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={Math.round(used)} aria-valuemin={0} aria-valuemax={100} aria-label="Share of the legal deadline used">
                <div className={`h-full rounded-full ${left <= 3 && open30 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${used}%` }} />
              </div>
            </section>

            <InfoGrid items={[['Identity check', r.identity_check], ['Plan', r.plan_note ?? r.plan], ['Invoices', r.invoices > 0 ? `${r.invoices} on record` : null]]} />

            {canAct && (
              <div className="flex items-center gap-3">
                <span className="text-12 font-bold">Status</span>
                <SelectField variant="pill" aria-label="Request status" value={r.status} options={STATUS_OPTIONS} disabled={busy} onChange={(status) => patch({ status, status_note: r.status_note })} />
              </div>
            )}

            {r.systems.length > 0 && (
              <ModalSection label="Systems">
                <ul className="m-0 flex list-none flex-col rounded-xl border border-border p-0">
                  {r.systems.map((s, i) => {
                    const st = SYSTEM_STATES.find((x) => x.value === s.state)!
                    return (
                      <li key={s.name} className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-2.5 last:border-b-0">
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-13 font-semibold">{s.name}</span>
                          {s.note && <span className="truncate text-11 text-ink-muted">{s.note}</span>}
                        </span>
                        {canAct && r.status !== 'completed' ? (
                          <SelectField variant="pill" aria-label={`${s.name} state`} value={s.state} disabled={busy} options={SYSTEM_STATES.map((x) => ({ value: x.value, label: x.label }))} onChange={(state) => patch({ systems: r.systems.map((x, j) => (j === i ? { ...x, state: state as SystemState } : x)) })} />
                        ) : (
                          <Badge tone={st.tone}>{st.label}</Badge>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </ModalSection>
            )}

            <ModalSection label="Communication">
              <Timeline items={r.timeline.map((t, i) => ({ key: String(i), time: t.at ? dayTime(t.at) : '—', text: t.text, state: t.state }))} />
            </ModalSection>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={cert.open}
        onClose={cert.onClose}
        icon={<Certificate size={20} />}
        title="Issue the deletion certificate?"
        description="This closes the request and records the certificate in the audit log. Every system must be deleted, anonymised or retained by law first."
        confirmLabel="Generate certificate"
        onConfirm={async () => {
          if (!r) return
          await issueCertificate(r.id)
          toast({ title: 'Certificate issued', description: number })
          reload()
          onChanged()
        }}
      />
    </>
  )
}
