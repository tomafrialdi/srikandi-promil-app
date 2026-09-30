import { Buildings, CalendarDots, ChatCircle, Lock, ShieldCheck, Stethoscope, User, VideoCamera, type Icon } from '@phosphor-icons/react'
import { Badge, Button, Modal, ModalFooter, ModalSection, Notice, type BadgeTone } from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'
import { formatIdrCompact } from '../../../shared/lib/format'
import type { DoctorCare } from '../types'

const TONE: Record<string, BadgeTone> = { Completed: 'success', Upcoming: 'warning', visited: 'success', upcoming: 'warning', recommended: 'purple' }
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** Icon + colours of a timeline entry, taken from its title ("Upcoming · …", "Teleconsult · …", "Visit · …"). */
function stepLook(title: string): { icon: Icon; tile: string } {
  if (/^upcoming/i.test(title)) return { icon: CalendarDots, tile: 'bg-warning-soft text-warning-ink' }
  if (/tele|video|chat/i.test(title)) return { icon: VideoCamera, tile: 'bg-secondary-soft text-secondary' }
  return { icon: Buildings, tile: 'bg-success-soft text-success' }
}

interface DoctorCareModalProps {
  data: DoctorCare | null
  loading: boolean
  error: string | null
  onClose: () => void
}

export function DoctorCareModal({ data, loading, error, onClose }: DoctorCareModalProps) {
  const d = data?.detail
  const upcoming = d?.timeline?.filter((t) => /^upcoming/i.test(t.title)).length ?? 0
  return (
    <Modal
      open={data !== null || loading || error !== null}
      onClose={onClose}
      size="lg"
      icon={<Stethoscope size={20} />}
      title={data ? `Care with ${data.doctor}` : 'Doctor care'}
      subtitle={data ? `${data.user_name}${d?.primary_since ? ` · primary doctor since ${d.primary_since}` : ''}${d?.consent ? ` · consent to share cycle data: ${d.consent}` : ''}` : undefined}
      footer={
        <ModalFooter info={<span className="inline-flex items-center gap-1.5"><Lock size={14} className="text-ink-faint" />Clinical notes stay with the clinic — not stored in Srikandi Promil</span>}>
          <Button variant="outline" disabled title="Doctor profiles are not built yet" leadingIcon={<User size={16} />}>View doctor profile</Button>
          <Button disabled title="Clinic messaging is not built yet" leadingIcon={<ChatCircle size={16} color="#fff" />}>Message clinic</Button>
        </ModalFooter>
      }
    >
      {loading && <p className="py-10 text-center text-13 text-ink-muted">Loading…</p>}
      {error && <Notice tone="error" icon={null}>{error}</Notice>}
      {data && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex size-14 flex-none items-center justify-center rounded-full bg-secondary-soft text-18 font-extrabold" aria-hidden="true">
              {data.doctor.replace(/^dr\.\s*/i, '')[0] ?? '?'}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={TONE[data.relation] ?? 'neutral'}>{cap(data.relation)}</Badge>
                {data.primary && <Badge tone="primary">Primary doctor</Badge>}
                {upcoming > 0 && <Badge tone="warning">Upcoming × {upcoming}</Badge>}
              </div>
              {d?.clinic_line && <span className="text-12 font-medium text-ink-muted">{d.clinic_line}</span>}
            </div>
            {d?.stats && (
              <div className="flex gap-5">
                <Stat value={String(d.stats.visits)} label="Visits" />
                <Stat value={String(d.stats.teleconsults)} label="Teleconsults" />
                <Stat value={formatIdrCompact(d.stats.spent_idr)} label="Spent" />
              </div>
            )}
          </div>

          {d?.timeline && (
            <ModalSection label="Care timeline">
              <ul className="m-0 flex list-none flex-col p-0">
                {d.timeline.map((item, index) => {
                  const { icon: Glyph, tile } = stepLook(item.title)
                  const last = index === d.timeline!.length - 1
                  return (
                    <li key={item.title} className="flex items-stretch gap-3">
                      <span className="flex w-8 flex-none flex-col items-center">
                        <span className={cn('inline-flex size-8 flex-none items-center justify-center rounded-full', tile)}><Glyph size={15} /></span>
                        {!last && <span className="my-1 min-h-3 w-0.5 flex-1 rounded-full bg-border" />}
                      </span>
                      <span className={cn('flex min-w-0 flex-1 flex-col gap-0.5 pt-[5px]', !last && 'pb-3')}>
                        <span className="text-13 font-bold">{item.title}</span>
                        <span className="text-12 font-medium text-ink-muted">{item.meta}</span>
                      </span>
                      <span className="pt-1"><Badge tone={TONE[item.status] ?? 'neutral'}>{item.status}</Badge></span>
                    </li>
                  )
                })}
              </ul>
            </ModalSection>
          )}

          {(d?.shared || d?.review) && (
            <div className="grid items-start gap-3.5 min-[701px]:grid-cols-2">
              {d.shared && (
                <section className="flex flex-col gap-2 rounded-xl bg-secondary-soft p-3.5">
                  <h3 className="flex items-center gap-2 text-13 font-bold text-secondary"><ShieldCheck size={15} />Data shared with doctor</h3>
                  <dl className="m-0 flex flex-col gap-2">
                    <KV label="Doctor reports" value={d.shared.reports} />
                    <KV label="Live cycle data" value={d.shared.live_data} />
                    <KV label="Notes & mood" value={d.shared.notes} />
                  </dl>
                </section>
              )}
              {d.review && (
                <section className="flex flex-col gap-2 rounded-xl bg-surface p-3.5">
                  <h3 className="text-13 font-bold">User's review</h3>
                  <p className="m-0 text-12 font-bold text-warning-ink">{'★'.repeat(d.review.stars)} · {d.review.date}</p>
                  <p className="m-0 text-12 leading-normal font-medium text-ink-muted">“{d.review.quote}”</p>
                </section>
              )}
            </div>
          )}

          {!d?.timeline && <p className="text-12 text-ink-muted">No visits yet. This doctor was {data.relation} for this user.</p>}

          {data.others.length > 0 && (
            <ModalSection label="Other doctors for this user">
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {data.others.map((other) => (
                  <li key={other.title} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3.5 py-3">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-13 font-bold">{other.title}</span>
                      <span className="text-11 font-medium text-ink-muted">{other.summary.filter(Boolean).join(' · ')}</span>
                    </span>
                    <Badge tone={TONE[other.relation] ?? 'neutral'}>{cap(other.relation)}</Badge>
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
    <div className="flex flex-col gap-px">
      <span className="text-16 font-extrabold">{value}</span>
      <span className="text-11 font-medium text-ink-muted">{label}</span>
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-12">
      <dt className="font-medium">{label}</dt>
      <dd className="m-0 text-right font-bold">{value}</dd>
    </div>
  )
}
