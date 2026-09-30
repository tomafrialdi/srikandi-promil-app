import { Stethoscope } from '@phosphor-icons/react'
import { Badge, Button, Modal, ModalFooter, ModalSection, Notice, type BadgeTone } from '../../../shared/ui'
import { formatIdrCompact } from '../../../shared/lib/format'
import type { DoctorCare } from '../types'

const TONE: Record<string, BadgeTone> = { Completed: 'success', Upcoming: 'warning', visited: 'success', upcoming: 'warning', recommended: 'primary' }

interface DoctorCareModalProps {
  data: DoctorCare | null
  loading: boolean
  error: string | null
  onClose: () => void
}

export function DoctorCareModal({ data, loading, error, onClose }: DoctorCareModalProps) {
  const d = data?.detail
  return (
    <Modal
      open={data !== null || loading || error !== null}
      onClose={onClose}
      size="lg"
      icon={<Stethoscope size={20} />}
      title={data ? `Care with ${data.doctor}` : 'Doctor care'}
      subtitle={data ? `${data.user_name}${d?.primary_since ? ` · primary doctor since ${d.primary_since}` : ''}${d?.consent ? ` · consent to share cycle data: ${d.consent}` : ''}` : undefined}
      footer={
        <ModalFooter info="Clinical notes stay with the clinic — not stored in Srikandi Promil">
          <Button variant="outline" disabled title="Doctor profiles are not built yet">View doctor profile</Button>
          <Button variant="outline" disabled title="Clinic messaging is not built yet">Message clinic</Button>
        </ModalFooter>
      }
    >
      {loading && <p className="py-10 text-center text-13 text-ink-muted">Loading…</p>}
      {error && <Notice tone="error" icon={null}>{error}</Notice>}
      {data && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TONE[data.relation] ?? 'neutral'}>{data.relation}</Badge>
            {data.primary && <Badge tone="info">Primary doctor</Badge>}
            {d?.clinic_line && <span className="text-12 text-ink-muted">{d.clinic_line}</span>}
          </div>

          {d?.stats && (
            <div className="flex flex-wrap gap-5.5">
              <Stat value={String(d.stats.visits)} label="Visits" />
              <Stat value={String(d.stats.teleconsults)} label="Teleconsults" />
              <Stat value={formatIdrCompact(d.stats.spent_idr)} label="Spent" />
            </div>
          )}

          {d?.timeline && (
            <ModalSection label="Care timeline">
              <ul className="m-0 flex list-none flex-col p-0">
                {d.timeline.map((item) => (
                  <li key={item.title} className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-13 font-bold">{item.title}</span>
                      <span className="text-11 text-ink-muted">{item.meta}</span>
                    </span>
                    <Badge tone={TONE[item.status] ?? 'neutral'}>{item.status}</Badge>
                  </li>
                ))}
              </ul>
            </ModalSection>
          )}

          {(d?.shared || d?.review) && (
            <div className="grid gap-3.5 min-[701px]:grid-cols-2">
              {d.shared && (
                <section className="flex flex-col gap-2.5 rounded-xl border border-border p-3.5">
                  <h3 className="text-13 font-extrabold">Data shared with doctor</h3>
                  <dl className="m-0 flex flex-col">
                    <KV label="Doctor reports" value={d.shared.reports} />
                    <KV label="Live cycle data" value={d.shared.live_data} />
                    <KV label="Notes & mood" value={d.shared.notes} />
                  </dl>
                </section>
              )}
              {d.review && (
                <section className="flex flex-col gap-2.5 rounded-xl border border-border p-3.5">
                  <h3 className="text-13 font-extrabold">User's review</h3>
                  <p className="text-13 font-bold">{'★'.repeat(d.review.stars)} · {d.review.date}</p>
                  <p className="text-12 text-ink-muted">“{d.review.quote}”</p>
                </section>
              )}
            </div>
          )}

          {!d?.timeline && <p className="text-12 text-ink-muted">No visits yet. This doctor was {data.relation} for this user.</p>}

          {data.others.length > 0 && (
            <ModalSection label="Other doctors for this user">
              <ul className="m-0 flex list-none flex-col p-0">
                {data.others.map((other) => (
                  <li key={other.title} className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-13 font-bold">{other.title}</span>
                      {other.summary.filter(Boolean).map((line) => (
                        <span key={line} className="text-11 text-ink-muted">{line}</span>
                      ))}
                    </span>
                    <Badge tone={TONE[other.relation] ?? 'neutral'}>{other.relation}</Badge>
                  </li>
                ))}
              </ul>
            </ModalSection>
          )}
        </>
      )}
    </Modal>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-18 font-extrabold">{value}</span>
      <span className="text-11 text-ink-muted">{label}</span>
    </div>
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
