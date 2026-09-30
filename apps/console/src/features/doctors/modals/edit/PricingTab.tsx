import { Info, Lock } from '@phosphor-icons/react'
import { Badge, Checkbox, Field, ModalSection, SelectField, Toggle, ToggleRow } from '../../../../shared/ui'
import { formatIdrCompact } from '../../../../shared/lib/format'
import { PAID_BY, PAYOUT, SERVICE } from '../../config/labels'
import type { DoctorForm, DoctorFull } from '../../types'
import { rp } from '../../lib/money'

interface PricingTabProps {
  doctor: DoctorFull
  original: DoctorForm
  form: DoctorForm
  setForm: (updater: (f: DoctorForm) => DoctorForm) => void
}

const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

export function PricingTab({ doctor, original, form, setForm }: PricingTabProps) {
  const gross = doctor.stats.gross_month ?? 0
  const fee = Math.round(gross * (doctor.fee.pct / 100))
  const setSvc = (kind: string, patch: Partial<DoctorForm['services'][number]>) => setForm((f) => ({ ...f, services: f.services.map((s) => (s.kind === kind ? { ...s, ...patch } : s)) }))
  const setPay = (patch: Partial<DoctorForm['payout']>) => setForm((f) => ({ ...f, payout: { ...f.payout, ...patch } }))
  const bigChange = form.services.some((s) => {
    const before = original.services.find((o) => o.kind === s.kind)?.price_idr ?? 0
    return before > 0 && Math.abs(s.price_idr - before) / before > 0.2
  })

  return (
    <>
      <div className="grid gap-3 min-[701px]:grid-cols-3">
        <div className="flex flex-col gap-0.5 rounded-xl bg-surface-alt px-4 py-3"><span className="text-11 font-semibold text-ink-muted">Gross (month)</span><span className="text-18 font-extrabold">{formatIdrCompact(gross)}</span><span className="text-11 text-ink-muted">{doctor.stats.teleconsults_30d ?? 0} teleconsults · {doctor.stats.visits_30d ?? 0} visits</span></div>
        <div className="flex flex-col gap-0.5 rounded-xl bg-warning-soft px-4 py-3"><span className="text-11 font-semibold text-warning-ink">Platform fee</span><span className="text-18 font-extrabold">{formatIdrCompact(fee)}</span><span className="text-11 text-ink-muted">{doctor.fee.pct}% of teleconsult + booking</span></div>
        <div className="flex flex-col gap-0.5 rounded-xl bg-success-soft px-4 py-3"><span className="text-11 font-semibold text-success">Net payout</span><span className="text-18 font-extrabold">{formatIdrCompact(gross - fee)}</span><span className="text-11 text-ink-muted">{doctor.stats.payout_next ? `next: ${dayFmt.format(new Date(doctor.stats.payout_next))}` : 'schedule below'}</span></div>
      </div>

      <ModalSection label="Consultation fees">
        <div className="overflow-x-auto rounded-xl border border-border">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[minmax(0,1.6fr)_80px_150px_48px_56px] items-center gap-3 bg-surface px-3.5 py-2.5 text-11 font-bold text-ink-faint uppercase">
              <span>Service</span><span>Duration</span><span>Price</span><span>BPJS</span><span>Active</span>
            </div>
            {form.services.map((s) => {
              const meta = SERVICE[s.kind]
              const Glyph = meta.icon
              return (
                <div key={s.kind} className={`grid grid-cols-[minmax(0,1.6fr)_80px_150px_48px_56px] items-center gap-3 border-t border-border px-3.5 py-2.5 ${s.active ? '' : 'opacity-55'}`}>
                  <span className="flex items-center gap-2.5 text-13 font-semibold"><Glyph size={16} className="flex-none text-ink-muted" />{meta.label}</span>
                  <span className="text-12 text-ink-muted">{meta.duration}</span>
                  <span className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-13 font-semibold focus-within:border-primary">
                    <span className="text-ink-faint">Rp</span>
                    <input aria-label={`${meta.label} price`} inputMode="numeric" className="min-w-0 flex-1 border-0 bg-transparent text-right outline-0" value={rp(s.price_idr)} onChange={(e) => setSvc(s.kind, { price_idr: Math.min(50_000_000, Number(e.target.value.replace(/\D/g, '')) || 0) })} />
                  </span>
                  <span>{s.kind === 'clinic_first' || s.kind === 'clinic_followup' ? <Checkbox label={`${meta.label} BPJS`} checked={s.bpjs} onChange={(bpjs) => setSvc(s.kind, { bpjs })} /> : <span className="text-ink-faint">—</span>}</span>
                  <Toggle label={`${meta.label} active`} checked={s.active} onChange={(active) => setSvc(s.kind, { active })} />
                </div>
              )
            })}
          </div>
        </div>
        <p className="m-0 text-11 text-ink-muted">Prices shown to patients include the platform fee. Changes take effect for new bookings only.</p>
      </ModalSection>

      <ModalSection label="Platform fee & payout">
        <div className="grid gap-3.5 min-[701px]:grid-cols-3">
          <Field label="Platform fee" hint="per contract"><div className="flex h-11 items-center justify-between rounded-control border border-border bg-surface px-3.5 text-13 font-semibold"><span>{doctor.fee.pct}%</span><Lock size={14} className="text-ink-faint" /></div></Field>
          <Field label="Paid by"><SelectField aria-label="Paid by" value={form.payout.paid_by} options={PAID_BY} onChange={(v) => setPay({ paid_by: v as 'clinic' | 'doctor' })} /></Field>
          <Field label="Payout schedule"><SelectField aria-label="Payout schedule" value={form.payout.payout_schedule} options={PAYOUT} onChange={(payout_schedule) => setPay({ payout_schedule })} /></Field>
        </div>
        {doctor.bank.bank ? (
          <div className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
            <span className="inline-flex size-10 flex-none items-center justify-center rounded-lg bg-secondary text-11 font-extrabold text-white">{doctor.bank.bank}</span>
            <span className="flex min-w-0 flex-1 flex-col"><span className="text-13 font-bold">{doctor.bank.holder} · {doctor.bank.bank} ●●●● {doctor.bank.last4}</span><span className="text-11 text-ink-muted">{doctor.bank.verified_at ? `Verified ${new Date(doctor.bank.verified_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Not verified'}{doctor.bank.npwp ? ' · NPWP on file' : ''}</span></span>
            <Badge tone="success">Verified</Badge>
          </div>
        ) : (
          <p className="m-0 rounded-xl bg-surface px-3.5 py-3 text-12 text-ink-muted">No payout account on file. The clinic or doctor adds it in the partner portal.</p>
        )}
      </ModalSection>

      <ModalSection label="Discounts & promotions">
        <ToggleRow label="Srikandi Plus member discount" title="Srikandi Plus member discount" description="Plus subscribers get 15% off teleconsults" checked={form.payout.discounts.plus_discount} onChange={(plus_discount) => setPay({ discounts: { ...form.payout.discounts, plus_discount } })} />
        <ToggleRow label="Accept platform promo codes" title="Accept platform promo codes" description="e.g. BUNDA-CLINIC, PARTNER20" checked={form.payout.discounts.accept_promos} onChange={(accept_promos) => setPay({ discounts: { ...form.payout.discounts, accept_promos } })} />
        <ToggleRow label="First teleconsult free for referred users" title="First teleconsult free for referred users" description="Funded by clinic partnership" checked={form.payout.discounts.first_tele_free} onChange={(first_tele_free) => setPay({ discounts: { ...form.payout.discounts, first_tele_free } })} />
        <div className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-12 font-medium ${bigChange ? 'bg-error-soft text-error' : 'bg-warning-soft text-warning-ink'}`}>
          <Info size={16} className="mt-px flex-none" />
          Price changes above 20% require clinic admin approval and are announced to patients 7 days in advance.
        </div>
      </ModalSection>
    </>
  )
}
