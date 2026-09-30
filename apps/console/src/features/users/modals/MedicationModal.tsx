import { ArrowSquareOut, BellRinging, Check, EyeSlash, Info, Package, Pill, ShoppingCart } from '@phosphor-icons/react'
import { Badge, Button, Modal, ModalFooter, ModalSection, type BadgeTone } from '../../../shared/ui'
import { formatIdr } from '../../../shared/lib/format'
import type { MedicationDetail } from '../types'

const statusTone = (status: string): BadgeTone => (/active/i.test(status) ? 'success' : /scheduled/i.test(status) ? 'warning' : /suggested/i.test(status) ? 'purple' : 'neutral')
const purchaseTone = (status: string): BadgeTone => (status === 'Purchased' ? 'info' : status === 'Not purchased' ? 'error' : 'neutral')

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
        <ModalFooter info={data && d ? <span className="inline-flex items-center gap-1.5"><Info size={14} className="text-ink-faint" />Catalogue item: {d.catalogue.id} · BPOM {d.catalogue.bpom}</span> : undefined}>
          <Button variant="outline" disabled title="Catalogue is not built yet" leadingIcon={<ArrowSquareOut size={16} />}>Open in catalogue</Button>
          <Button disabled title="Reminders are sent from the notifications module" leadingIcon={<BellRinging size={16} color="#fff" />}>Send reminder</Button>
        </ModalFooter>
      }
    >
      {data && d && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(data.status)}>{data.status}</Badge>
            <Badge tone={purchaseTone(data.purchase_status)}>{data.purchase_status}</Badge>
            {d.doctor_note && <Badge tone="success">Doctor note verified</Badge>}
            <span className="flex-1" />
            {data.adherence != null && <span className="text-12 font-bold text-success">Adherence {data.adherence}%</span>}
          </div>

          <div className="grid gap-3.5 min-[701px]:grid-cols-2">
            <Panel title="Prescription">
              <KV label="Dose" value={d.dose} />
              <KV label="Schedule" value={data.schedule} />
              <KV label="Prescribed by" value={d.prescribed_by ?? 'Self-added'} />
              <KV label="Doctor note" value={d.doctor_note ?? '—'} />
              <KV label="Next cycle" value={d.next_cycle ?? '—'} />
            </Panel>
            <Panel title="Reminders">
              <KV label="Time" value={d.reminder.time} />
              <KV label="Template" value={d.reminder.template} />
              <KV label="Channel" value={d.reminder.channel} />
              <KV label="Snoozes" value={d.reminder.snoozes} />
              <KV label="Partner sees" value={d.reminder.partner_sees} />
            </Panel>
          </div>

          {d.dose_log.length > 0 && (
            <ModalSection label="Dose log">
              <div className="flex flex-wrap gap-2.5">
                {d.dose_log.map((dose) => (
                  <span key={dose.cd} className="flex min-w-[120px] flex-1 flex-col gap-1 rounded-xl bg-success-soft p-3">
                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-success text-white"><Check size={15} weight="bold" /></span>
                    <span className="text-12 font-extrabold">{dose.cd}</span>
                    <span className="text-10 font-semibold text-ink-muted">{dose.at}</span>
                  </span>
                ))}
              </div>
            </ModalSection>
          )}

          {d.purchases.length > 0 && (
            <ModalSection label="Purchases">
              <ul className="m-0 flex list-none flex-col overflow-hidden rounded-xl border border-border p-0">
                {d.purchases.map((purchase) => {
                  const Glyph = purchase.status === 'Not purchased' ? ShoppingCart : Package
                  return (
                    <li key={purchase.ref + purchase.item} className="flex items-center gap-3 border-b border-border px-3.5 py-3 last:border-b-0">
                      <span className="inline-flex size-[34px] flex-none items-center justify-center rounded-[9px] bg-surface-alt text-ink-muted"><Glyph size={16} /></span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-13 font-bold">{purchase.item}</span>
                        <span className="truncate text-11 font-medium text-ink-muted">{purchase.ref} · {purchase.seller}</span>
                      </span>
                      <span className="flex-none text-13 font-bold">{formatIdr(purchase.price_idr)}</span>
                      <Badge tone={purchase.status === 'Delivered' ? 'success' : 'neutral'}>{purchase.status}</Badge>
                    </li>
                  )
                })}
              </ul>
            </ModalSection>
          )}

          <ModalSection label="Side effects & notes">
            {d.side_effects.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {d.side_effects.map((effect) => (
                  <Badge key={effect} tone={/^no\b/i.test(effect) ? 'success' : 'warning'}>{effect}</Badge>
                ))}
              </div>
            )}
            <p className="m-0 flex items-center gap-2 rounded-[10px] bg-surface px-3.5 py-2.5 text-12 font-medium text-ink-muted">
              <EyeSlash size={14} className="flex-none" />
              Personal notes are masked.
            </p>
          </ModalSection>
        </>
      )}
    </Modal>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1 rounded-xl bg-surface p-3.5">
      <h3 className="mb-1 text-13 font-bold">{title}</h3>
      <dl className="m-0 flex flex-col">{children}</dl>
    </section>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[31px] items-center justify-between gap-3 border-b border-border text-12 last:border-b-0">
      <dt className="font-medium text-ink-muted">{label}</dt>
      <dd className="m-0 text-right font-bold">{value}</dd>
    </div>
  )
}
