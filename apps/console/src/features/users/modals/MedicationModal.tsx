import { Pill } from '@phosphor-icons/react'
import { Badge, Button, Modal, ModalFooter, ModalSection } from '../../../shared/ui'
import { formatIdr } from '../../../shared/lib/format'
import type { MedicationDetail } from '../types'
import parts from './modal-parts.module.css'

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
          <div className={parts.badges}>
            <Badge tone="info">{data.status}</Badge>
            <Badge tone={data.purchase_status === 'Purchased' ? 'success' : 'neutral'}>{data.purchase_status}</Badge>
            {d.doctor_note && <Badge tone="success">Doctor note verified</Badge>}
            {data.adherence != null && <span className={parts.muted}>Adherence {data.adherence}%</span>}
          </div>

          <div className={parts.two}>
            <section className={parts.box}>
              <h3 className={parts.boxTitle}>Prescription</h3>
              <dl className={parts.kv}>
                <KV label="Dose" value={d.dose} />
                <KV label="Schedule" value={data.schedule} />
                <KV label="Prescribed by" value={d.prescribed_by ?? 'Self-added'} />
                <KV label="Doctor note" value={d.doctor_note ?? '—'} />
                <KV label="Next cycle" value={d.next_cycle ?? '—'} />
              </dl>
            </section>
            <section className={parts.box}>
              <h3 className={parts.boxTitle}>Reminders</h3>
              <dl className={parts.kv}>
                <KV label="Time" value={d.reminder.time} />
                <KV label="Template" value={d.reminder.template} />
                <KV label="Channel" value={d.reminder.channel} />
                <KV label="Snoozes" value={d.reminder.snoozes} />
                <KV label="Partner sees" value={d.reminder.partner_sees} />
              </dl>
            </section>
          </div>

          <ModalSection label="Dose log">
            <div className={parts.chips}>
              {d.dose_log.map((dose) => (
                <span key={dose.cd} className={parts.chip}>
                  {dose.cd}
                  <small>{dose.at}</small>
                </span>
              ))}
            </div>
          </ModalSection>

          <ModalSection label="Purchases">
            <ul className={parts.rows}>
              {d.purchases.map((purchase) => (
                <li key={purchase.ref} className={parts.row}>
                  <span className={parts.rowMain}>
                    <span className={parts.rowTitle}>{purchase.item}</span>
                    <span className={parts.rowMeta}>{purchase.ref} · {purchase.seller}</span>
                  </span>
                  <span className={parts.rowAside}>
                    <span className={parts.rowAmount}>{formatIdr(purchase.price_idr)}</span>
                    <Badge tone={purchase.status === 'Delivered' ? 'success' : 'neutral'}>{purchase.status}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </ModalSection>

          <ModalSection label="Side effects & notes">
            <ul className={parts.rows}>
              {d.side_effects.map((effect) => (
                <li key={effect} className={parts.row}>
                  <span className={parts.rowTitle}>{effect}</span>
                </li>
              ))}
            </ul>
            <p className={parts.muted}>Personal notes are masked.</p>
          </ModalSection>
        </>
      )}
    </Modal>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className={parts.kvRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
