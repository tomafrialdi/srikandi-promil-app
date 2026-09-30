import { Hospital } from '@phosphor-icons/react'
import { Badge, Button, Modal, ModalFooter, ModalSection, Notice, type BadgeTone } from '../../../shared/ui'
import { formatIdr, formatIdrCompact } from '../../../shared/lib/format'
import type { ClinicJourney } from '../types'
import { cn } from '../../../shared/lib/cn'

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
      {loading && <p className="py-10 text-center text-13 text-ink-muted">Loading…</p>}
      {error && <Notice tone="error" icon={null}>{error}</Notice>}
      {data && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">All · {data.counts.all}</Badge>
            <Badge tone="success">Visited · {data.counts.visited}</Badge>
            <Badge tone="primary">Recommended · {data.counts.recommended}</Badge>
            <Badge tone="info">Saved · {data.counts.saved}</Badge>
            <Badge tone="neutral">Dismissed · {data.counts.dismissed}</Badge>
          </div>

          {current && (
            <section className="flex flex-col gap-2.5 rounded-xl border border-border p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="success">Visited</Badge>
                {current.program && <Badge tone="info">{current.program}</Badge>}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>{current.name} <span className="text-12 text-ink-muted">★ {current.rating}</span></h3>
              <p className="text-12 text-ink-muted">
                {current.detail.address} · {current.detail.distance_km} km from home · {current.detail.coverage}
              </p>
              <div className="flex gap-1.5">
                {current.detail.stages.map((stage, index) => (
                  <span
                    key={stage}
                    className={cn('flex-1 rounded-lg bg-surface-alt px-1 py-1.5 text-center text-10 font-bold text-ink-muted', index < current.detail.stage_index && 'bg-success-soft text-success', index === current.detail.stage_index && 'bg-primary text-white')}
                  >
                    {stage}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-5.5">
                <Stat value={String(current.detail.visits)} label="Visits" />
                <Stat value={formatIdrCompact(current.detail.paid_idr)} label="Paid via app" />
                <Stat value={current.detail.next} label="Next" />
                <Stat value={current.detail.source} label="Source" />
              </div>
            </section>
          )}

          {current && (
            <ModalSection label="Bookings & payments">
              <ul className="m-0 flex list-none flex-col p-0">
                {current.detail.bookings.map((booking) => (
                  <li key={`${booking.date}-${booking.title}`} className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-13 font-bold">{booking.title}</span>
                      <span className="text-11 text-ink-muted">{booking.date}</span>
                    </span>
                    <span className="flex flex-none flex-col items-end gap-1">
                      <span className="text-13 font-extrabold">{formatIdr(booking.amount_idr)}</span>
                      <Badge tone={BOOKING_TONE[booking.status] ?? 'neutral'}>{booking.status}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </ModalSection>
          )}

          {data.others.length > 0 && (
            <ModalSection label="Other clinics">
              <ul className="m-0 flex list-none flex-col p-0">
                {data.others.map((clinic) => (
                  <li key={clinic.name} className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-13 font-bold">{clinic.name}</span>
                      <span className="text-11 text-ink-muted">{[clinic.city, clinic.bpjs && 'BPJS covered', clinic.ivf_lab && 'IVF lab', `★ ${clinic.rating}`].filter(Boolean).join(' · ')}</span>
                      {clinic.note && <span className="text-11 text-ink-muted">{clinic.note}</span>}
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
    <div className="flex flex-col">
      <span className="text-18 font-extrabold" style={{ fontSize: 14 }}>{value}</span>
      <span className="text-11 text-ink-muted">{label}</span>
    </div>
  )
}
