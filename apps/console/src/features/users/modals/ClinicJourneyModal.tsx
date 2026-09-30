import { Hospital } from '@phosphor-icons/react'
import { Badge, Button, Modal, ModalFooter, ModalSection, Notice, type BadgeTone } from '../../../shared/ui'
import { formatIdr, formatIdrCompact } from '../../../shared/lib/format'
import type { ClinicJourney } from '../types'
import parts from './modal-parts.module.css'

const TONE: Record<string, BadgeTone> = { recommended: 'primary', saved: 'info', dismissed: 'neutral' }
const BOOKING_TONE: Record<string, BadgeTone> = { Completed: 'success', Booked: 'warning', 'Paid · upcoming': 'primary' }

interface ClinicJourneyModalProps {
  data: ClinicJourney | null
  loading: boolean
  error: string | null
  onClose: () => void
}

export function ClinicJourneyModal({ data, loading, error, onClose }: ClinicJourneyModalProps) {
  const current = data?.current
  return (
    <Modal
      open={data !== null || loading || error !== null}
      onClose={onClose}
      size="lg"
      icon={<Hospital size={20} />}
      title={data ? `Clinic journey · ${data.user_name}` : 'Clinic journey'}
      subtitle="Where the user has been, is going, and what we've recommended"
      footer={
        <ModalFooter info="Recommendations follow the engine referral rule (12 mo / 6 mo if 35+)">
          <Button variant="outline" disabled title="Clinic recommendations are not built yet">Recommend clinic</Button>
          <Button variant="outline" disabled title="Clinic profiles are not built yet">Open clinic</Button>
        </ModalFooter>
      }
    >
      {loading && <p className={parts.state}>Loading…</p>}
      {error && <Notice tone="error" icon={null}>{error}</Notice>}
      {data && (
        <>
          <div className={parts.badges}>
            <Badge tone="neutral">All · {data.counts.all}</Badge>
            <Badge tone="success">Visited · {data.counts.visited}</Badge>
            <Badge tone="primary">Recommended · {data.counts.recommended}</Badge>
            <Badge tone="info">Saved · {data.counts.saved}</Badge>
            <Badge tone="neutral">Dismissed · {data.counts.dismissed}</Badge>
          </div>

          {current && (
            <section className={parts.box}>
              <div className={parts.badges}>
                <Badge tone="success">Visited</Badge>
                {current.program && <Badge tone="info">{current.program}</Badge>}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>{current.name} <span className={parts.muted}>★ {current.rating}</span></h3>
              <p className={parts.muted}>
                {current.detail.address} · {current.detail.distance_km} km from home · {current.detail.coverage}
              </p>
              <div className={parts.stages}>
                {current.detail.stages.map((stage, index) => (
                  <span
                    key={stage}
                    className={`${parts.stage} ${index < current.detail.stage_index ? parts.stageDone : ''} ${index === current.detail.stage_index ? parts.stageNow : ''}`}
                  >
                    {stage}
                  </span>
                ))}
              </div>
              <div className={parts.stats}>
                <Stat value={String(current.detail.visits)} label="Visits" />
                <Stat value={formatIdrCompact(current.detail.paid_idr)} label="Paid via app" />
                <Stat value={current.detail.next} label="Next" />
                <Stat value={current.detail.source} label="Source" />
              </div>
            </section>
          )}

          {current && (
            <ModalSection label="Bookings & payments">
              <ul className={parts.rows}>
                {current.detail.bookings.map((booking) => (
                  <li key={`${booking.date}-${booking.title}`} className={parts.row}>
                    <span className={parts.rowMain}>
                      <span className={parts.rowTitle}>{booking.title}</span>
                      <span className={parts.rowMeta}>{booking.date}</span>
                    </span>
                    <span className={parts.rowAside}>
                      <span className={parts.rowAmount}>{formatIdr(booking.amount_idr)}</span>
                      <Badge tone={BOOKING_TONE[booking.status] ?? 'neutral'}>{booking.status}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </ModalSection>
          )}

          {data.others.length > 0 && (
            <ModalSection label="Other clinics">
              <ul className={parts.rows}>
                {data.others.map((clinic) => (
                  <li key={clinic.name} className={parts.row}>
                    <span className={parts.rowMain}>
                      <span className={parts.rowTitle}>{clinic.name}</span>
                      <span className={parts.rowMeta}>{[clinic.city, clinic.bpjs && 'BPJS covered', clinic.ivf_lab && 'IVF lab', `★ ${clinic.rating}`].filter(Boolean).join(' · ')}</span>
                      {clinic.note && <span className={parts.rowMeta}>{clinic.note}</span>}
                    </span>
                    <Badge tone={TONE[clinic.status] ?? 'neutral'}>{clinic.status}</Badge>
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
      <span className={parts.statValue} style={{ fontSize: 14 }}>{value}</span>
      <span className={parts.statLabel}>{label}</span>
    </div>
  )
}
