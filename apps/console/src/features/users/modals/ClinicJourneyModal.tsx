import { ArrowSquareOut, Hospital, Info, Plus } from '@phosphor-icons/react'
import { useState } from 'react'
import { Badge, Button, Modal, ModalFooter, ModalSection, Notice, type BadgeTone } from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'
import { formatIdr, formatIdrCompact } from '../../../shared/lib/format'
import type { ClinicJourney } from '../types'

const TONE: Record<string, BadgeTone> = { recommended: 'purple', saved: 'info', dismissed: 'neutral' }
const BOOKING_TONE: Record<string, BadgeTone> = { Completed: 'success', Booked: 'info', 'Paid · upcoming': 'warning' }
const FILTERS = ['all', 'visited', 'recommended', 'saved', 'dismissed'] as const
type Filter = (typeof FILTERS)[number]
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

interface ClinicJourneyModalProps {
  data: ClinicJourney | null
  loading: boolean
  error: string | null
  onClose: () => void
}

export function ClinicJourneyModal({ data, loading, error, onClose }: ClinicJourneyModalProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const current = data?.current
  const showCurrent = current && (filter === 'all' || filter === 'visited')
  const others = (data?.others ?? []).filter((c) => filter === 'all' || c.status === filter)

  return (
    <Modal
      open={data !== null || loading || error !== null}
      onClose={onClose}
      size="lg"
      icon={<Hospital size={20} />}
      title={data ? `Clinic journey · ${data.user_name}` : 'Clinic journey'}
      subtitle="Where the user has been, is going, and what we've recommended"
      footer={
        <ModalFooter info={<span className="inline-flex items-center gap-1.5"><Info size={14} className="text-ink-faint" />Recommendations follow the engine referral rule (12 mo / 6 mo if 35+)</span>}>
          <Button variant="outline" disabled title="Clinic recommendations are not built yet" leadingIcon={<Plus size={16} />}>Recommend clinic</Button>
          <Button disabled title="Clinic profiles are not built yet" leadingIcon={<ArrowSquareOut size={16} color="#fff" />}>Open clinic</Button>
        </ModalFooter>
      }
    >
      {loading && <p className="py-10 text-center text-13 text-ink-muted">Loading…</p>}
      {error && <Notice tone="error" icon={null}>{error}</Notice>}
      {data && (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter clinics">
            {FILTERS.map((key) => (
              <button key={key} type="button" aria-pressed={filter === key} className={cn('inline-flex h-[27px] items-center rounded-full border px-3 text-12 font-semibold', filter === key ? 'border-ink bg-ink text-white' : 'border-border bg-card text-ink-muted')} onClick={() => setFilter(key)}>
                {cap(key)} · {data.counts[key]}
              </button>
            ))}
          </div>

          {showCurrent && (
            <section className="shrink-0 overflow-hidden rounded-[14px] border border-primary bg-card">
              <div className="flex h-[110px] items-end bg-gradient-to-br from-primary-soft via-surface-alt to-secondary-soft p-3.5">
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone="success">Visited</Badge>
                  {current.program && <Badge tone="primary">{current.program}</Badge>}
                </span>
              </div>
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <h3 className="m-0 text-16 font-extrabold">{current.name}</h3>
                    <p className="m-0 text-12 font-medium text-ink-muted">{current.detail.address} · {current.detail.distance_km} km from home · {current.detail.coverage}</p>
                  </div>
                  <span className="flex-none text-13 font-bold text-warning-ink">★ {current.rating}</span>
                </div>

                <div className="flex gap-2">
                  {current.detail.stages.map((stage, index) => {
                    const done = index < current.detail.stage_index
                    const now = index === current.detail.stage_index
                    return (
                      <span key={stage} className="flex flex-1 flex-col gap-1.5">
                        <span className={cn('h-1.5 rounded-full', done ? 'bg-success' : now ? 'bg-primary' : 'bg-surface-alt')} />
                        <span className={cn('text-10 font-bold', done ? 'text-success' : now ? 'text-primary' : 'text-ink-faint')}>{stage}</span>
                      </span>
                    )
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2.5 min-[701px]:grid-cols-4">
                  <Stat value={String(current.detail.visits)} label="Visits" />
                  <Stat value={formatIdrCompact(current.detail.paid_idr)} label="Paid via app" />
                  <Stat value={current.detail.next} label="Next" />
                  <Stat value={current.detail.source} label="Source" />
                </div>
              </div>
            </section>
          )}

          {showCurrent && current.detail.bookings.length > 0 && (
            <ModalSection label="Bookings & payments">
              <ul className="m-0 flex shrink-0 list-none flex-col overflow-hidden rounded-xl border border-border p-0">
                {current.detail.bookings.map((booking) => (
                  <li key={`${booking.date}-${booking.title}`} className="flex min-h-11 items-center gap-3 border-b border-border px-3.5 py-2 last:border-b-0">
                    <span className="w-24 flex-none text-12 font-bold">{booking.date}</span>
                    <span className="min-w-0 flex-1 truncate text-13 font-semibold">{booking.title}</span>
                    <span className="flex-none text-12 font-bold">{formatIdr(booking.amount_idr)}</span>
                    <Badge tone={BOOKING_TONE[booking.status] ?? 'neutral'}>{booking.status}</Badge>
                  </li>
                ))}
              </ul>
            </ModalSection>
          )}

          {others.length > 0 && (
            <ModalSection label="Other clinics">
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {others.map((clinic) => (
                  <li key={clinic.name} className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
                    <span className="inline-flex size-9 flex-none items-center justify-center rounded-[10px] border border-border bg-card text-ink-muted"><Hospital size={16} /></span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-13 font-bold">{clinic.name}</span>
                      <span className="text-11 font-medium text-ink-muted">{[clinic.city, clinic.bpjs && 'BPJS covered', clinic.ivf_lab && 'IVF lab', clinic.rating > 0 && `★ ${clinic.rating}`].filter(Boolean).join(' · ')}</span>
                      {clinic.note && <span className="text-11 font-medium text-ink-faint">{clinic.note}</span>}
                    </span>
                    <Badge tone={TONE[clinic.status] ?? 'neutral'}>{cap(clinic.status)}</Badge>
                  </li>
                ))}
              </ul>
            </ModalSection>
          )}

          {!showCurrent && others.length === 0 && <p className="py-4 text-center text-13 text-ink-muted">No clinics in this group.</p>}
        </>
      )}
    </Modal>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-[10px] bg-surface p-2.5">
      <span className="text-11 font-semibold text-ink-muted">{label}</span>
      <span className="truncate text-13 font-extrabold">{value}</span>
    </div>
  )
}
