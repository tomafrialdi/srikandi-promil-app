import { CheckCircle, PencilSimple, ProhibitInset, ArrowCounterClockwise, WarningCircle } from '@phosphor-icons/react'
import { Badge, Button, Card } from '../../../shared/ui'
import { formatIdr } from '../../../shared/lib/format'
import { WEEKDAYS } from '../config/labels'
import type { DoctorFull, Slot } from '../types'
import { DoctorAvatar } from './DoctorAvatar'

const fmtDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const my = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' })
const hour = (t: string) => (t.endsWith(':00') ? t.slice(0, 2) : t)

interface DoctorPanelProps {
  doctor: DoctorFull
  canEdit: boolean
  onEdit: () => void
  onToggleStatus: () => void
}

function Row({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  const Glyph = ok ? CheckCircle : WarningCircle
  return (
    <div className="grid grid-cols-[minmax(0,110px)_minmax(0,1fr)] items-start gap-3 text-12">
      <span className="flex items-center gap-2 font-bold"><Glyph size={15} className={ok ? 'flex-none text-success' : 'flex-none text-warning-ink'} weight="regular" />{label}</span>
      <span className="leading-snug text-ink-muted">{value}</span>
    </div>
  )
}

export function DoctorPanel({ doctor: d, canEdit, onEdit, onToggleStatus }: DoctorPanelProps) {
  const virtualIds = new Set(d.locations.filter((l) => l.kind === 'virtual').map((l) => l.id))
  const cell = (weekday: number) => {
    const slots = d.slots.filter((s: Slot) => s.weekday === weekday)
    if (slots.length === 0) return null
    const first = slots[0]!
    return { text: `${hour(first.start)}–${hour(first.end)}`, tele: virtualIds.has(first.location_id), more: slots.length - 1 }
  }
  const service = (kind: string) => d.services.find((s) => s.kind === kind && s.active)
  const verified = d.str.status === 'verified'
  const roles = [d.roles.public_advisor && 'Medical advisor', d.roles.medical_reviewer && 'Reviewer', d.roles.engine_signoff && 'Engine sign-off', d.roles.community_expert && 'Community expert'].filter(Boolean) as string[]

  return (
    <Card className="gap-4 min-[1201px]:sticky min-[1201px]:top-4">
      <header className="flex items-start gap-3.5">
        <DoctorAvatar name={d.name} url={d.photo_url} size={64} />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-16 leading-snug font-extrabold">{d.name}</h2>
          <p className="m-0 text-12 text-ink-muted">{d.years != null ? `${d.years} yrs · ` : ''}{d.specialty}</p>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {d.status !== 'active' && <Badge tone={d.status === 'suspended' ? 'error' : 'warning'}>{d.status === 'suspended' ? 'Suspended' : d.status === 'draft' ? 'Draft' : 'Pending verification'}</Badge>}
            {roles.map((r, i) => <Badge key={r} tone={i % 2 ? 'info' : 'primary'}>{r}</Badge>)}
          </div>
        </div>
      </header>

      <div className={verified ? 'flex flex-col gap-2.5 rounded-xl bg-success-soft px-3.5 py-3' : 'flex flex-col gap-2.5 rounded-xl bg-warning-soft px-3.5 py-3'}>
        <Row ok={verified} label="STR (KKI)" value={d.str.number ? `${d.str.number}${d.str.valid_until ? ` · valid to ${new Date(d.str.valid_until).getFullYear()}` : ''}${verified ? '' : ' · not verified yet'}` : 'Not provided'} />
        <Row ok={!!d.sip.number} label="SIP" value={d.sip.number ? `${d.sip.number}${d.sip.valid_until ? ` · valid to ${my.format(new Date(d.sip.valid_until))}` : ''}` : 'Not provided'} />
        {d.cert.label && <Row ok label={d.cert.label} value={d.cert.verified_at ? `Verified ${fmtDate.format(new Date(d.cert.verified_at))}` : 'Not verified'} />}
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-13 font-bold">Weekly schedule</h3>
        <div className="grid grid-cols-6 gap-1.5">
          {WEEKDAYS.slice(0, 6).map((day, i) => {
            const c = cell(i + 1)
            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <span className="text-10 font-semibold text-ink-muted">{day}</span>
                <span
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg text-10 font-bold"
                  style={c ? (c.tele ? { background: 'var(--secondary-soft)', color: 'var(--secondary)' } : { background: 'var(--primary-soft)', color: 'var(--primary)' }) : { background: 'var(--surface-alt)', color: 'var(--ink-faint)' }}
                  title={c && c.more > 0 ? `+${c.more} more slot${c.more === 1 ? '' : 's'}` : undefined}
                >
                  {c ? c.text : '—'}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 text-11 text-ink-muted">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-[3px] bg-primary-soft" />In clinic</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-[3px] bg-secondary-soft" />Teleconsult</span>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        {[
          [d.stats.referrals_30d, 'Referrals (30d)'],
          [d.stats.teleconsults_30d, 'Teleconsults'],
          [d.stats.articles_reviewed, 'Articles reviewed'],
        ].map(([v, label]) => (
          <div key={String(label)} className="flex flex-col gap-0.5 rounded-xl bg-surface px-3 py-2.5">
            <span className="text-18 font-extrabold">{v ?? 0}</span>
            <span className="text-10 text-ink-muted">{label}</span>
          </div>
        ))}
      </div>

      <dl className="m-0 flex flex-col gap-1.5 text-12">
        {service('clinic_first') && <div className="flex justify-between"><dt className="text-ink-muted">In-clinic consult</dt><dd className="m-0 font-bold">{formatIdr(service('clinic_first')!.price_idr)}</dd></div>}
        {service('tele_video') && <div className="flex justify-between"><dt className="text-ink-muted">Teleconsult (30 min)</dt><dd className="m-0 font-bold">{formatIdr(service('tele_video')!.price_idr)}</dd></div>}
        <div className="flex justify-between"><dt className="text-ink-muted">Platform fee</dt><dd className="m-0 font-bold">{d.fee.pct}% · paid by {d.fee.paid_by}</dd></div>
      </dl>

      {canEdit && (
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="outline" onClick={onEdit} leadingIcon={<PencilSimple size={16} />}>Edit profile</Button>
          {d.status === 'suspended' ? (
            <Button variant="outline" onClick={onToggleStatus} leadingIcon={<ArrowCounterClockwise size={16} />}>Reactivate</Button>
          ) : (
            <Button variant="danger" onClick={onToggleStatus} leadingIcon={<ProhibitInset size={16} />}>Suspend</Button>
          )}
        </div>
      )}
    </Card>
  )
}
