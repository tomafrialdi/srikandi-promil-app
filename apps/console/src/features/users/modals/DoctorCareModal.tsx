import { Stethoscope } from '@phosphor-icons/react'
import { Badge, Button, Modal, ModalFooter, ModalSection, Notice, type BadgeTone } from '../../../shared/ui'
import { formatIdrCompact } from '../../../shared/lib/format'
import type { DoctorCare } from '../types'
import parts from './modal-parts.module.css'

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
      {loading && <p className={parts.state}>Loading…</p>}
      {error && <Notice tone="error" icon={null}>{error}</Notice>}
      {data && (
        <>
          <div className={parts.badges}>
            <Badge tone={TONE[data.relation] ?? 'neutral'}>{data.relation}</Badge>
            {data.primary && <Badge tone="info">Primary doctor</Badge>}
            {d?.clinic_line && <span className={parts.muted}>{d.clinic_line}</span>}
          </div>

          {d?.stats && (
            <div className={parts.stats}>
              <Stat value={String(d.stats.visits)} label="Visits" />
              <Stat value={String(d.stats.teleconsults)} label="Teleconsults" />
              <Stat value={formatIdrCompact(d.stats.spent_idr)} label="Spent" />
            </div>
          )}

          {d?.timeline && (
            <ModalSection label="Care timeline">
              <ul className={parts.rows}>
                {d.timeline.map((item) => (
                  <li key={item.title} className={parts.row}>
                    <span className={parts.rowMain}>
                      <span className={parts.rowTitle}>{item.title}</span>
                      <span className={parts.rowMeta}>{item.meta}</span>
                    </span>
                    <Badge tone={TONE[item.status] ?? 'neutral'}>{item.status}</Badge>
                  </li>
                ))}
              </ul>
            </ModalSection>
          )}

          {(d?.shared || d?.review) && (
            <div className={parts.two}>
              {d.shared && (
                <section className={parts.box}>
                  <h3 className={parts.boxTitle}>Data shared with doctor</h3>
                  <dl className={parts.kv}>
                    <KV label="Doctor reports" value={d.shared.reports} />
                    <KV label="Live cycle data" value={d.shared.live_data} />
                    <KV label="Notes & mood" value={d.shared.notes} />
                  </dl>
                </section>
              )}
              {d.review && (
                <section className={parts.box}>
                  <h3 className={parts.boxTitle}>User's review</h3>
                  <p className={parts.rowTitle}>{'★'.repeat(d.review.stars)} · {d.review.date}</p>
                  <p className={parts.muted}>“{d.review.quote}”</p>
                </section>
              )}
            </div>
          )}

          {!d?.timeline && <p className={parts.muted}>No visits yet. This doctor was {data.relation} for this user.</p>}

          {data.others.length > 0 && (
            <ModalSection label="Other doctors for this user">
              <ul className={parts.rows}>
                {data.others.map((other) => (
                  <li key={other.title} className={parts.row}>
                    <span className={parts.rowMain}>
                      <span className={parts.rowTitle}>{other.title}</span>
                      {other.summary.filter(Boolean).map((line) => (
                        <span key={line} className={parts.rowMeta}>{line}</span>
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
    <div className={parts.stat}>
      <span className={parts.statValue}>{value}</span>
      <span className={parts.statLabel}>{label}</span>
    </div>
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
