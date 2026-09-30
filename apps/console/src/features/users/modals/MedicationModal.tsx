import { Pill } from '@phosphor-icons/react'
import { Badge, Button, Modal, ModalFooter, ModalSection } from '../../../shared/ui'
import { formatIdr } from '../../../shared/lib/format'
import type { MedicationDetail } from '../types'

export function MedicationModal({ data, onClose }: { data: MedicationDetail | null; onClose: () => void }) {
  const d = data?.detail
  return (
    <Modal
      open={data !== null}
      onClose={onClose}
      size="lg"
      icon={<Pill size={20} />}
      title={`${data?.name ?? ''} · ${data?.user_name ?? ''}`}
      subtitle={data && d ? [d.rx ? 'Rx' : 'Supplement', d.purpose, d.prescribed_by && `prescribed by ${d.prescribed_by}`].filter(Boolean).join(' · ') : undefined}
      footer={
        <ModalFooter info={data && d ? `Catalogue item: ${d.catalogue.id} · BPOM ${d.catalogue.bpom}` : undefined}>
          <Button variant="outline" disabled title="Catalogue is not built yet">Open in catalogue</Button>
          <Button variant="outline" disabled title="Reminders are sent from the notifications module">Send reminder</Button>
        </ModalFooter>
      }
    >
      {data && d && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{data.status}</Badge>
            <Badge tone={data.purchase_status === 'Purchased' ? 'success' : 'neutral'}>{data.purchase_status}</Badge>
            {d.doctor_note && <Badge tone="success">Doctor note verified</Badge>}
            {data.adherence != null && <span className="text-12 text-ink-muted">Adherence {data.adherence}%</span>}
          </div>

          <div className="grid gap-3.5 min-[701px]:grid-cols-2">
            <section className="flex flex-col gap-2.5 rounded-xl border border-border p-3.5">
              <h3 className="text-13 font-extrabold">Prescription</h3>
              <dl className="m-0 flex flex-col">
                <KV label="Dose" value={d.dose} />
                <KV label="Schedule" value={data.schedule} />
                <KV label="Prescribed by" value={d.prescribed_by ?? 'Self-added'} />
                <KV label="Doctor note" value={d.doctor_note ?? '—'} />
                <KV label="Next cycle" value={d.next_cycle ?? '—'} />
              </dl>
            </section>
            <section className="flex flex-col gap-2.5 rounded-xl border border-border p-3.5">
              <h3 className="text-13 font-extrabold">Reminders</h3>
              <dl className="m-0 flex flex-col">
                <KV label="Time" value={d.reminder.time} />
                <KV label="Template" value={d.reminder.template} />
                <KV label="Channel" value={d.reminder.channel} />
                <KV label="Snoozes" value={d.reminder.snoozes} />
                <KV label="Partner sees" value={d.reminder.partner_sees} />
              </dl>
            </section>
          </div>

          <ModalSection label="Dose log">
            <div className="flex flex-wrap gap-2">
              {d.dose_log.map((dose) => (
                <span key={dose.cd} className="inline-flex flex-col rounded-[10px] bg-surface px-2.5 py-1.5 text-12 font-bold [&_small]:text-10 [&_small]:font-medium [&_small]:text-ink-muted">
                  {dose.cd}
                  <small>{dose.at}</small>
                </span>
              ))}
            </div>
          </ModalSection>

          <ModalSection label="Purchases">
            <ul className="m-0 flex list-none flex-col p-0">
              {d.purchases.map((purchase) => (
                <li key={purchase.ref} className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-13 font-bold">{purchase.item}</span>
                    <span className="text-11 text-ink-muted">{purchase.ref} · {purchase.seller}</span>
                  </span>
                  <span className="flex flex-none flex-col items-end gap-1">
                    <span className="text-13 font-extrabold">{formatIdr(purchase.price_idr)}</span>
                    <Badge tone={purchase.status === 'Delivered' ? 'success' : 'neutral'}>{purchase.status}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </ModalSection>

          <ModalSection label="Side effects & notes">
            <ul className="m-0 flex list-none flex-col p-0">
              {d.side_effects.map((effect) => (
                <li key={effect} className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
                  <span className="text-13 font-bold">{effect}</span>
                </li>
              ))}
            </ul>
            <p className="text-12 text-ink-muted">Personal notes are masked.</p>
          </ModalSection>
        </>
      )}
    </Modal>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-12 [&_dt]:text-ink-muted [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-bold">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
